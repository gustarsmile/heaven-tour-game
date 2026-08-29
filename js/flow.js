import { GAME_TITLE, PROLOGUE_ID } from './config.js';
import {
  createState, recordChoice, creditWu, resetScreen, finalWu, save, load, clearSave,
} from './state.js';
import { loadBooklet, addCard } from './booklet.js';
import { createPlayer } from './engine/scene.js';
import { createVisit, nextVisitPhase, prevVisitPhase, answerQuiz, chooseMercy, takeBranch, visitScore } from './engine/visit.js';
import { createFinale, nextFinalePhase, prevFinalePhase, chooseMengpo, endingKey } from './engine/finale.js';
import { renderNode, el, hallLabel } from './ui/render.js';
import { renderCard } from './ui/cardView.js';
import { renderVisitPhase } from './ui/visitView.js';
import { renderFinalePhase, renderShareOverlay } from './ui/finaleView.js';
import { renderBooklet } from './ui/bookletView.js';
import { renderCover } from './ui/coverView.js';
import { NOOP_NAV } from './ui/nav.js';
import { pushLayer } from './ui/layer.js';
import { buildShareCard, loadQrImage, loadArtImage } from './share.js';
import { collectArtFiles, preloadArt } from './preload.js';

export const MODES = {
  full: { label: '完整遊歷', desc: '十殿全程・約 30–50 分鐘' },
  lite: { label: '精簡速覽', desc: '精選殿宇・約 12–20 分鐘' },
};

async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`載入失敗：${path}`);
  return res.json();
}

// intro 行陣列 → 純 line 場景（取代階段1的 runIntroLines，消除步進邏輯重複）
// art：入殿引言沿用該殿主圖，版面與後續階段連貫
function linesToScene(lines, art) {
  return {
    id: 'lines',
    art,
    start: 'l0',
    nodes: [
      ...lines.map((l, i) => ({
        id: `l${i}`, type: 'line', ...l,
        next: i + 1 < lines.length ? `l${i + 1}` : 'fin',
      })),
      { id: 'fin', type: 'end' },
    ],
  };
}

const NOOP_AUDIO = { chime() {}, flip() {} };

export async function startGame({ root, loadJSON = fetchJSON, storage, audio = NOOP_AUDIO, nav = NOOP_NAV }) {
  document.title = GAME_TITLE;

  const flow = await loadJSON('js/data/flow.json');
  const resources = {};
  await Promise.all(
    flow.screens.filter((s) => s.src).map(async (s) => {
      resources[s.id] = await loadJSON(`js/data/${s.src}`);
    }),
  );

  let state = createState();
  let modeList = flow.screens; // 當前模式的畫面清單
  let currentScreenId = null;
  let localBack = null; // 當前畫面內的一步返回（對話上一句／上一階段）
  const screenHistory = []; // 走過的殿，供跨殿返回

  const onChoice = (rec) => recordChoice(state, { ...rec, screen: currentScreenId });
  const hooks = { onChoice };

  function modeScreens(mode) {
    const ids = flow.modes?.[mode];
    if (!ids) return flow.screens;
    return ids.map((id) => flow.screens.find((s) => s.id === id)).filter(Boolean);
  }

  // 該模式滿分：判案殿 30（破綻10＋斷獄10＋勸化10）、考題 5、支線功德
  function computeWuMax(list) {
    let max = 0;
    for (const scr of list) {
      const d = resources[scr.id];
      if (!d) continue;
      if (scr.type === 'visit') max += (d.quiz ? 5 : 0) + (d.branch?.rewardWu ?? 0);
    }
    return max;
  }

  function buildMode(mode) {
    state.mode = mode;
    modeList = modeScreens(mode);
    state.wuMax = computeWuMax(modeList);
  }

  function setLocalBack(fn) {
    localBack = fn;
    nav.setBack(currentScreenId === null ? null : goBack);
  }

  function goBack() {
    if (localBack) { localBack(); return; }
    const prev = screenHistory.pop();
    if (prev) runScreen(prev);
    else showCover();
  }

  function goTo(id) {
    if (currentScreenId && currentScreenId !== id) screenHistory.push(currentScreenId);
    runScreen(id);
  }

  function runScene(sceneData, onEnd) {
    const player = createPlayer(sceneData, hooks);
    // 場景圖軌跡：節點帶 art 者自該節點起換場景圖，延續至下一個帶 art 的節點；返回時同步回退
    const artTrail = [player.current().art ?? sceneData.art];
    const step = () => {
      const node = player.current();
      if (node.type === 'end') { onEnd(); return; }
      setLocalBack(player.canBack() ? () => { player.back(); artTrail.pop(); step(); } : null);
      renderNode(node, {
        onAdvance: () => { player.advance(); artTrail.push(player.current().art ?? artTrail.at(-1)); step(); },
        onChoose: (i) => { player.choose(i); artTrail.push(player.current().art ?? artTrail.at(-1)); step(); },
      }, root, { art: artTrail.at(-1) });
    };
    step();
  }

  function runVisit(data, onEnd) {
    const visit = createVisit(data, hooks);
    let message = '';
    const step = () => {
      setLocalBack(visit.phase !== visit.phases[0]
        ? () => { message = ''; prevVisitPhase(visit); step(); }
        : null);
      renderVisitPhase(visit, handlers, root, message);
    };
    const handlers = {
      onNextPhase: () => { message = ''; nextVisitPhase(visit); step(); },
      onQuiz: (i) => {
        const r = answerQuiz(visit, i);
        if (r.correct) audio.chime();
        message = r.correct ? '' : data.quiz.hint;
        step();
      },
      onMercy: (i) => { chooseMercy(visit, i); step(); },
      onBranchAccept: () => {
        takeBranch(visit, true);
        runScene(data.branch.scene, () => {
          creditWu(state, currentScreenId, data.branch.rewardWu ?? 0); // 隱藏功德，不顯示訊息
          nextVisitPhase(visit);
          step();
        });
      },
      onBranchDecline: () => { takeBranch(visit, false); step(); },
      onFinish: () => { creditWu(state, currentScreenId, visitScore(visit)); onEnd(); },
    };
    step();
  }

  function bookletEntries() {
    const owned = loadBooklet(storage);
    return flow.screens
      .filter((scr) => resources[scr.id] && resources[scr.id].card)
      .map((scr) => ({
        id: scr.id,
        title: resources[scr.id].menuTitle ?? resources[scr.id].title ?? scr.id,
        card: resources[scr.id].card,
        owned: owned.includes(scr.id),
      }));
  }

  // 善書冊疊層：不打斷當前殿的進度
  function openBookletOverlay() {
    audio.flip();
    const overlay = el('div');
    overlay.id = 'booklet-overlay';
    const inner = el('div', 'booklet-overlay-inner');
    overlay.appendChild(inner);
    document.body.appendChild(overlay);
    const layer = pushLayer(() => overlay.remove());
    renderBooklet(bookletEntries(), () => layer.close(), inner);
  }

  function runFinale(data) {
    const finale = createFinale(data, state);
    const step = () => {
      setLocalBack(finale.phase !== finale.phases[0]
        ? () => { prevFinalePhase(finale); step(); }
        : null);
      renderFinalePhase(finale, handlers, root);
    };
    const handlers = {
      onNextPhase: () => { nextFinalePhase(finale); step(); },
      onMengpo: (i) => { chooseMengpo(finale, i); step(); },
      onShare: async () => {
        const ending = data.endings[endingKey(state)];
        const [qr, bg] = await Promise.all([
          loadQrImage(document),
          loadArtImage(document, 'share-bg.webp'),
        ]);
        const canvas = buildShareCard(document, {
          title: ending.title, wu: finalWu(state), motto: ending.motto,
        }, qr, bg);
        setLocalBack(null);
        renderShareOverlay(canvas, { title: ending.title, wu: finalWu(state), motto: ending.motto }, step, root);
      },
      onBooklet: openBookletOverlay,
      onRestart: () => { clearSave(storage); showCover(); },
    };
    step();
  }

  function menuTitleOf(scr) {
    const d = resources[scr.id];
    if (d?.menuTitle) return d.menuTitle;
    if (d?.hall) return `${hallLabel(d.hall)}・${d.king}`;
    return scr.id === PROLOGUE_ID ? '序章・陽間一日' : '過場';
  }

  function menuConfig() {
    return {
      modeLabel: MODES[state.mode]?.label ?? '',
      entries: modeList
        .filter((scr) => resources[scr.id])
        .map((scr) => ({
          id: scr.id,
          title: menuTitleOf(scr),
          desc: resources[scr.id].tagline ?? '',
          current: scr.id === currentScreenId,
        })),
      onJump: goTo,
      onBooklet: openBookletOverlay,
      onSave: () => save(state, storage),
      onCover: showCover,
    };
  }

  function runScreen(id) {
    const scr = modeList.find((s) => s.id === id) ?? flow.screens.find((s) => s.id === id);
    if (!scr) { showCover(); return; }
    currentScreenId = id;
    resetScreen(state, id); // 重入整殿重新計分，杜絕重複灌分
    state.progress.screen = id;
    save(state, storage);
    nav.setMenu(menuConfig());
    setLocalBack(null);

    const idx = modeList.indexOf(scr);
    const nextScr = modeList[idx + 1];
    const goNext = nextScr ? () => goTo(nextScr.id) : showCover;
    const collectCard = () => { addCard(scr.id, storage); goNext(); };
    const data = resources[scr.id];

    if (scr.type === 'scene') {
      runScene(data, goNext);
    } else if (scr.type === 'visit') {
      runScene(linesToScene(data.intro, data.art?.scene), () =>
        runVisit(data, () => {
          audio.flip();
          setLocalBack(null);
          renderCard(data.card, collectCard, root);
        }));
    } else if (scr.type === 'finale') {
      runScene(linesToScene(data.intro, data.art?.scene), () => runFinale(data));
    } else {
      throw new Error(`未知的畫面類型：${scr.type}`);
    }
  }

  function showCover() {
    currentScreenId = null;
    localBack = null;
    screenHistory.length = 0;
    nav.setBack(null);
    nav.setMenu(null);
    const saved = load(storage);
    const savedList = saved ? modeScreens(saved.mode) : [];
    const resumable = Boolean(
      saved
      && saved.progress.screen !== savedList[0]?.id
      && savedList.some((s) => s.id === saved.progress.screen),
    );
    renderCover({ resumable, modes: MODES }, {
      onResume: () => {
        state = saved;
        buildMode(saved.mode);
        runScreen(saved.progress.screen);
      },
      onStart: (mode) => {
        clearSave(storage);
        state = createState(mode);
        buildMode(mode);
        runScreen(modeList[0].id);
      },
    }, root);
  }

  showCover();

  // 封面就緒後，背景把整趟旅程的美術逐張拉進快取
  preloadArt(new Set(['cover.webp', ...collectArtFiles(resources), 'share-bg.webp']));
}
