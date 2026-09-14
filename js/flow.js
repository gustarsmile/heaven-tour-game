import { GAME_TITLE, PROLOGUE_ID } from './config.js';
import {
  createState, recordChoice, creditWu, resetScreen, finalWu, save, load, clearSave, setRepent,
} from './state.js';
import { loadBooklet, addCard, clearBooklet } from './booklet.js';
import { createPlayer } from './engine/scene.js';
import { createVisit, nextVisitPhase, prevVisitPhase, answerQuiz, chooseMercy, takeBranch, visitScore } from './engine/visit.js';
import { createTreeScreen, nextTreePhase, prevTreePhase, answerCase, caseIndex, treeScore, treeMax } from './engine/treeScreen.js';
import { remainingAmends } from './engine/judge.js';
import { createReview, nextReviewPhase, prevReviewPhase, answerGuest, guestIndex, reviewScore, reviewMax } from './engine/review.js';
import { createFinale, nextFinalePhase, prevFinalePhase, endingKey } from './engine/finale.js';
import { treeOrigin } from './engine/origin.js';
import { renderNode, el } from './ui/render.js';
import { renderCard } from './ui/cardView.js';
import { renderVisitPhase } from './ui/visitView.js';
import { renderTreePhase } from './ui/treeView.js';
import { renderReviewPhase } from './ui/reviewView.js';
import { renderFinalePhase, renderShareOverlay } from './ui/finaleView.js';
import { renderBooklet } from './ui/bookletView.js';
import { renderCover } from './ui/coverView.js';
import { NOOP_NAV } from './ui/nav.js';
import { pushLayer } from './ui/layer.js';
import { buildShareCard, loadQrImage, loadArtImage } from './share.js';
import { collectArtFiles, preloadArt } from './preload.js';

export const MODES = {
  full: { label: '完整遊歷', desc: '十三站全程・約 30–60 分鐘' },
  lite: { label: '精簡速覽', desc: '精選七站・約 12–20 分鐘' },
};

async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`載入失敗：${path}`);
  return res.json();
}

// intro 行陣列 → 純 line 場景（取代階段1的 runIntroLines，消除步進邏輯重複）
// art：入站引言沿用該站主圖，版面與後續階段連貫
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
  const treeData = await loadJSON('js/data/tree.json');
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
  const screenHistory = []; // 走過的站，供跨站返回

  const onChoice = (rec) => recordChoice(state, { ...rec, screen: currentScreenId });
  const hooks = { onChoice };

  function modeScreens(mode) {
    const ids = flow.modes?.[mode];
    if (!ids) return flow.screens;
    return ids.map((id) => flow.screens.find((s) => s.id === id)).filter(Boolean);
  }

  // 該模式滿分：考題 5、案例樹題 5、歸天者題 5、支線功德
  function computeWuMax(list) {
    let max = 0;
    for (const scr of list) {
      const d = resources[scr.id];
      if (!d) continue;
      if (scr.type === 'visit') max += (d.quiz ? 5 : 0) + (d.branch?.rewardWu ?? 0);
      if (scr.type === 'tree') max += treeMax(d);
      if (scr.type === 'review') max += reviewMax(d);
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
    nav.setBack(currentScreenId !== null && (localBack || screenHistory.length > 0) ? goBack : null);
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

  function runTree(data, onEnd) {
    // 三官殿：水官解厄要知道「往後還能補的站」（依當前模式清單）
    const extras = data.mode === 'judge'
      ? { amends: remainingAmends(modeList, resources, currentScreenId) }
      : {};
    const t = createTreeScreen(data, extras);
    let message = '';
    const step = () => {
      setLocalBack(t.phase !== t.phases[0]
        ? () => { message = ''; prevTreePhase(t); step(); }
        : null);
      renderTreePhase(t, state, treeData, handlers, root, message);
    };
    const handlers = {
      onNextPhase: () => { message = ''; nextTreePhase(t); step(); },
      onCase: (i) => {
        const r = answerCase(t, i);
        if (r.correct) audio.chime();
        message = r.correct ? '' : data.cases[caseIndex(t)].hint;
        step();
      },
      onRepent: (axis) => { setRepent(state, axis, currentScreenId); audio.chime(); step(); }, // 限一次：視圖見 state.repent 即不再出選項
      onFinish: () => { creditWu(state, currentScreenId, treeScore(t)); onEnd(); },
    };
    step();
  }

  // 站名表：樹的來歷／通天五段回放用來把 choice.screen 換成站名（choice 有 label 者優先用 label）
  function screenTitles() {
    return Object.fromEntries(flow.screens.map((scr) => [scr.id, menuTitleOf(scr)]));
  }

  function runReview(data, onEnd) {
    const r = createReview(data);
    let message = '';
    const step = () => {
      setLocalBack(r.phase !== r.phases[0]
        ? () => { message = ''; prevReviewPhase(r); step(); }
        : null);
      renderReviewPhase(r, state, screenTitles(), handlers, root, message);
    };
    const handlers = {
      onNextPhase: () => { message = ''; nextReviewPhase(r); step(); },
      onGuest: (i) => {
        const res = answerGuest(r, i);
        if (res.correct) audio.chime();
        message = res.correct ? '' : data.guests[guestIndex(r)].quiz.hint;
        step();
      },
      onFinish: () => { creditWu(state, currentScreenId, reviewScore(r)); onEnd(); },
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

  // 「我的樹」：瑤池看過樹的來歷後才解鎖（設計 §3.6 通關後隨時可回看）
  function bookletOrigin() {
    return state.progress.originUnlocked ? treeOrigin(state, treeData, screenTitles()) : null;
  }

  // 善書冊疊層：不打斷當前站的進度
  function openBookletOverlay() {
    audio.flip();
    const overlay = el('div');
    overlay.id = 'booklet-overlay';
    const inner = el('div', 'booklet-overlay-inner');
    overlay.appendChild(inner);
    document.body.appendChild(overlay);
    const layer = pushLayer(() => overlay.remove());
    renderBooklet(bookletEntries(), () => layer.close(), inner, { origin: bookletOrigin() });
  }

  function runFinale(data) {
    const finale = createFinale(data, state, treeData, screenTitles());
    const step = () => {
      setLocalBack(finale.phase !== finale.phases[0]
        ? () => { prevFinalePhase(finale); step(); }
        : null);
      renderFinalePhase(finale, handlers, root);
    };
    const handlers = {
      onNextPhase: () => {
        nextFinalePhase(finale);
        if (finale.phase === 'origin' && !state.progress.originUnlocked) {
          state.progress.originUnlocked = true; // 稱號公布後「我的樹」解鎖（設計 §3.6）
          save(state, storage);
        }
        step();
      },
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
    return d?.menuTitle ?? d?.title ?? (scr.id === PROLOGUE_ID ? '序章・陽間一日' : '過場');
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
    resetScreen(state, id); // 重入整站重新計分，杜絕重複灌分
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
      runScene(data, data.card ? () => {
        audio.flip();
        setLocalBack(null);
        renderCard(data.card, collectCard, root);
      } : goNext);
    } else if (scr.type === 'visit') {
      runScene(linesToScene(data.intro, data.art?.scene), () =>
        runVisit(data, () => {
          audio.flip();
          setLocalBack(null);
          renderCard(data.card, collectCard, root);
        }));
    } else if (scr.type === 'tree') {
      runScene(linesToScene(data.intro, data.art?.scene), () =>
        runTree(data, () => {
          if (!data.card) { goNext(); return; }
          audio.flip();
          setLocalBack(null);
          renderCard(data.card, collectCard, root);
        }));
    } else if (scr.type === 'review') {
      runScene(linesToScene(data.intro, data.art?.scene), () =>
        runReview(data, () => {
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
    // 舊版存檔：記錄的滿分與現行不符 → 續玩會少掉新關卡的分數（階段 2 的存檔停在八仙或瑤池，
    // 陰陽界已在其前面，那 15 分再也拿不到），一律回封面重開；滿分未記錄（0）者不擋。
    const staleSave = Boolean(saved && saved.wuMax > 0 && saved.wuMax !== computeWuMax(savedList));
    const resumable = Boolean(
      saved
      && !staleSave
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
        clearBooklet(storage); // 開新局天音卡歸零；「繼續旅程」不經此處，冊保留
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
