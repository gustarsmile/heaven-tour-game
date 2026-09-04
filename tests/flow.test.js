// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { startGame } from '../js/flow.js';
import { createState, save, load, finalWu, rawWu, karmaSum } from '../js/state.js';
import { endingKey } from '../js/engine/finale.js';
import { treeTotal } from '../js/engine/tree.js';
import { loadBooklet, addCard } from '../js/booklet.js';
import { GAME_TITLE } from '../js/config.js';

const modules = import.meta.glob('../js/data/*.json', { eager: true });
const FILES = {};
for (const [path, mod] of Object.entries(modules)) {
  FILES[path.replace('../js/', 'js/')] = mod.default;
}
const flowData = FILES['js/data/flow.json'];
const yaochi = FILES['js/data/yaochi.json'];

const loadJSON = async (p) => {
  if (!(p in FILES)) throw new Error(`missing ${p}`);
  return structuredClone(FILES[p]);
};

function fakeStorage() {
  const data = {};
  return {
    setItem: (k, v) => { data[k] = String(v); },
    getItem: (k) => (k in data ? data[k] : null),
    removeItem: (k) => { delete data[k]; },
  };
}

function resourceOf(screenId) {
  const scr = flowData.screens.find((s) => s.id === screenId);
  return scr?.src ? FILES[`js/data/${scr.src}`] : null;
}

// 由資料推導完美通關的期望原始分與滿分：考題殿 5、支線 rewardWu
function expectedRaw(screens, { acceptBranch } = {}) {
  let raw = 0, max = 0;
  for (const scr of screens) {
    const data = resourceOf(scr.id);
    if (!data) continue;
    if (scr.type === 'visit' && data.quiz) { max += 5; raw += 5; }
    if (scr.type === 'visit' && data.branch) {
      max += data.branch.rewardWu;
      if (acceptBranch) raw += data.branch.rewardWu;
    }
    if (scr.type === 'tree' && data.mode === 'read') { max += data.cases.length * 5; raw += data.cases.length * 5; }
    if (scr.type === 'review') { max += data.guests.length * 5; raw += data.guests.length * 5; }
  }
  return { raw, max };
}

function autoplay(root, storage, { acceptBranch = true, evil = false } = {}) {
  for (let i = 0; i < 3000; i++) {
    if (root.querySelector('.finale-end')) return;
    const saved = load(storage);
    const data = saved ? resourceOf(saved.progress.screen) : null;

    const accept = root.querySelector('.btn-accept');
    if (accept) {
      (acceptBranch ? accept : root.querySelector('.btn-decline')).click();
      continue;
    }
    const next = root.querySelector('.btn-next');
    if (next) { next.click(); continue; } // 封面「完整遊歷」亦為 btn-next，自動走完整版

    const choices = root.querySelectorAll('.btn-choice');
    if (choices.length) {
      const list = choices[0].closest('.choices');
      let idx = 0;
      if (list?.dataset.kind === 'case') idx = data.cases[Number(list.dataset.index)].answer;
      else if (list?.dataset.kind === 'quiz') idx = data.quiz.answer;
      else if (list?.dataset.kind === 'guest') idx = data.guests[Number(list.dataset.index)].quiz.answer;
      else if (evil) idx = choices.length - 1; // 道德選擇全選最惡（末選項慣例）
      choices[idx].click();
      continue;
    }
    throw new Error(`autoplay 卡住於第 ${i} 步（screen=${saved?.progress.screen}）`);
  }
  throw new Error('autoplay 超過步數上限');
}

describe('全流程整合（flow manifest）', () => {
  it('入口封面：無存檔顯示完整／精簡兩版，不顯示續玩', async () => {
    const storage = fakeStorage();
    const root = document.createElement('div');
    await startGame({ root, loadJSON, storage });
    expect(document.title).toBe(GAME_TITLE);
    expect(root.textContent).toContain('完整遊歷');
    expect(root.textContent).toContain('精簡速覽');
    expect(root.textContent).not.toContain('繼續旅程');
    expect(root.textContent).toContain('天堂遊記');
    expect(root.textContent).toContain('天上有一棵樹');
  });

  it('通關後存檔含序章五筆選擇紀錄（label、權重×2、screen 欄位）', async () => {
    const storage = fakeStorage();
    const root = document.createElement('div');
    await startGame({ root, loadJSON, storage });
    autoplay(root, storage, { acceptBranch: true });
    const pro = load(storage).choices.filter((c) => c.screen === 'prologue');
    expect(pro.length).toBe(5);
    for (const c of pro) {
      expect(c.weight).toBe(2);
      expect(c.delta).toBe(1); // autoplay 全選最善
      expect(c.label.length).toBeGreaterThan(0);
    }
  });

  it('完美通關：東華宮四題案例樹得 20 分入該站', async () => {
    const storage = fakeStorage();
    const root = document.createElement('div');
    await startGame({ root, loadJSON, storage });
    autoplay(root, storage);
    expect(load(storage).wuByScreen.donghua).toBe(20);
  });

  it('完美通關（接受支線）：悟性 100，highGood；重新開始回封面再入序章', async () => {
    const storage = fakeStorage();
    const root = document.createElement('div');
    await startGame({ root, loadJSON, storage });
    autoplay(root, storage, { acceptBranch: true });
    const { raw, max } = expectedRaw(flowData.screens, { acceptBranch: true });
    const s = load(storage);
    expect(rawWu(s)).toBe(raw);
    expect(s.wuMax).toBe(max);
    expect(s.wuMax).toBe(95);
    const wu = max > 0 ? Math.round((raw / max) * 100) : 0;
    expect(finalWu(s)).toBe(wu);
    expect(finalWu(s)).toBe(100);
    expect(root.textContent).toContain(`悟性值 ${wu}`);
    expect(root.textContent).toContain(yaochi.endings[endingKey(s)].title);
    expect(root.textContent).toContain('道果圓熟・蓮台九品');
    const gate = s.choices.filter((c) => c.screen === 'gate');
    expect(gate).toEqual([expect.objectContaining({ axis: 'li', delta: 1, weight: 1 })]);
    // 重新開始 → 回封面 → 選完整遊歷 → 序章第一句
    [...root.querySelectorAll('button')].find((b) => b.textContent === '重新開始').click();
    expect(root.textContent).toContain('完整遊歷');
    [...root.querySelectorAll('button')].find((b) => b.textContent.includes('完整遊歷')).click();
    expect(root.textContent).toContain(FILES['js/data/prologue.json'].nodes[0].text);
  });

  it('婉拒支線：悟性依滿分折算', async () => {
    const storage = fakeStorage();
    const root = document.createElement('div');
    await startGame({ root, loadJSON, storage });
    autoplay(root, storage, { acceptBranch: false });
    const { raw, max } = expectedRaw(flowData.screens, { acceptBranch: false });
    const wu = max > 0 ? Math.round((raw / max) * 100) : 0;
    expect(root.textContent).toContain(`悟性值 ${wu}`);
  });

  it('惡向通關：答題高分仍遭心性扣分，結局與 endingKey 一致', async () => {
    const storage = fakeStorage();
    const root = document.createElement('div');
    await startGame({ root, loadJSON, storage });
    autoplay(root, storage, { acceptBranch: true, evil: true });
    const s = load(storage);
    const { raw } = expectedRaw(flowData.screens, { acceptBranch: true });
    expect(rawWu(s)).toBe(raw);
    const wu = finalWu(s);
    expect(finalWu(s)).toBeLessThan(70);
    expect(root.textContent).toContain(`悟性值 ${wu}`);
    expect(root.textContent).toContain(yaochi.endings[endingKey(s)].title);
    expect(root.textContent).toContain('種子未萌・再世重修');
    const pro = s.choices.filter((c) => c.screen === 'prologue');
    expect(pro.length).toBe(5);
    for (const c of pro) expect(c.delta).toBe(-1);
    const gate = s.choices.filter((c) => c.screen === 'gate');
    expect(gate).toEqual([expect.objectContaining({ axis: 'li', delta: -1, weight: 1 })]);
  });

  it('精簡速覽：只走精選殿，悟性依精簡滿分折算', async () => {
    const storage = fakeStorage();
    const root = document.createElement('div');
    await startGame({ root, loadJSON, storage });
    [...root.querySelectorAll('button')].find((b) => b.textContent.includes('精簡速覽')).click();
    autoplay(root, storage, { acceptBranch: true });
    const liteScreens = flowData.modes.lite.map((id) => flowData.screens.find((x) => x.id === id));
    const { raw, max } = expectedRaw(liteScreens, { acceptBranch: true });
    const s = load(storage);
    expect(s.mode).toBe('lite');
    expect(s.wuMax).toBe(max);
    expect(s.wuMax).toBe(45);
    expect(rawWu(s)).toBe(raw);
    expect(root.textContent).toContain(`悟性值 ${max > 0 ? Math.round((raw / max) * 100) : 0}`);
    expect(flowData.modes.lite).toEqual([
      'prologue', 'interlude', 'sapling', 'gate', 'donghua', 'beihua', 'sanguan', 'yinyang', 'yaochi',
    ]);
    expect(s.wuByScreen.yinyang).toBe(15);
    expect(s.repent).toBeNull(); // 全善無傷軸
    expect(root.textContent).toContain(yaochi.endings[endingKey(s)].title);
  });

  it('精簡版惡向：三官殿仍可補過一軸（水官此時已無可補之站）', async () => {
    const storage = fakeStorage();
    const root = document.createElement('div');
    await startGame({ root, loadJSON, storage });
    [...root.querySelectorAll('button')].find((b) => b.textContent.includes('精簡速覽')).click();
    autoplay(root, storage, { acceptBranch: true, evil: true });
    const s = load(storage);
    expect(s.mode).toBe('lite');
    expect(s.repent).toEqual({ axis: 'xin', screen: 'sanguan' });
    expect(finalWu(s)).toBeLessThan(70);
  });

  it('有存檔時封面顯示續玩，繼續從該畫面開始', async () => {
    const storage = fakeStorage();
    const s = createState();
    s.progress.screen = 'interlude';
    save(s, storage);
    const root = document.createElement('div');
    await startGame({ root, loadJSON, storage });
    expect(root.textContent).toContain('繼續旅程');
    [...root.querySelectorAll('button')].find((b) => b.textContent === '繼續旅程').click();
    expect(root.textContent).toContain(FILES['js/data/interlude.json'].nodes[0].text);
  });

  it('有存檔仍可直接選「完整遊歷」重新開始 → 序章且存檔重置', async () => {
    const storage = fakeStorage();
    const s = createState();
    s.progress.screen = 'interlude';
    save(s, storage);
    const root = document.createElement('div');
    await startGame({ root, loadJSON, storage });
    [...root.querySelectorAll('button')].find((b) => b.textContent.includes('完整遊歷')).click();
    expect(root.textContent).toContain(FILES['js/data/prologue.json'].nodes[0].text);
    expect(load(storage).progress.screen).toBe('prologue');
  });

  it('存檔畫面 id 不在流程清單（舊版存檔）→ 封面不顯示續玩', async () => {
    const storage = fakeStorage();
    const s = createState();
    s.progress.screen = 'card'; // 階段1的畫面 id，已不存在
    save(s, storage);
    const root = document.createElement('div');
    await startGame({ root, loadJSON, storage });
    expect(root.textContent).not.toContain('繼續旅程');
    expect(root.textContent).toContain('完整遊歷');
  });

  it('通關收滿天音卡入善書冊；重新開始開新局後冊歸零', async () => {
    const storage = fakeStorage();
    const root = document.createElement('div');
    await startGame({ root, loadJSON, storage });
    autoplay(root, storage, { acceptBranch: true });
    const cardScreens = flowData.screens
      .filter((s) => resourceOf(s.id)?.card).map((s) => s.id);
    expect(cardScreens.length).toBe(15);
    expect([...loadBooklet(storage)].sort()).toEqual([...cardScreens].sort());
    // 重新開始 → 封面選模式開新局 → 善書冊歸零（使用者裁決：歸零比較有動力再完成一次）
    [...root.querySelectorAll('button')].find((b) => b.textContent === '重新開始').click();
    [...root.querySelectorAll('button')].find((b) => b.textContent.includes('完整遊歷')).click();
    expect(loadBooklet(storage)).toEqual([]);
  });

  it('中途離開後「繼續旅程」不清善書冊', async () => {
    const storage = fakeStorage();
    const s = createState();
    s.progress.screen = 'gate';
    save(s, storage);
    addCard('sapling', storage);
    const root = document.createElement('div');
    await startGame({ root, loadJSON, storage });
    [...root.querySelectorAll('button')].find((b) => b.textContent.includes('繼續旅程')).click();
    expect(loadBooklet(storage)).toEqual(['sapling']);
  });

  it('scene 站帶 card：場景走完發天音卡並收入善書冊', async () => {
    const miniFlow = {
      screens: [
        { id: 'prologue', type: 'scene', src: 'prologue.json' },
        { id: 'xiaozi-mini', type: 'scene', src: 'xiaozi-mini.json' },
        { id: 'yaochi', type: 'finale', src: 'yaochi.json' },
      ],
      modes: {},
    };
    const miniCard = {
      title: '測試卡', lesson: '白話。', quote: '原文。', speaker: '測試',
      source: { chapter: 33, url: 'https://www.taolibrary.com/category/category48/c48001b/35.htm' },
    };
    const miniScene = {
      id: 'xiaozi-mini', art: 'xiaozi-scene.webp', start: 'a',
      nodes: [{ id: 'a', type: 'line', speaker: '旁白', text: 'x', next: 'fin' }, { id: 'fin', type: 'end' }],
      menuTitle: '迷你', tagline: 't', card: miniCard,
    };
    const miniLoad = async (p) => {
      if (p === 'js/data/flow.json') return structuredClone(miniFlow);
      if (p === 'js/data/xiaozi-mini.json') return structuredClone(miniScene);
      return loadJSON(p);
    };
    const storage = fakeStorage();
    const root = document.createElement('div');
    await startGame({ root, loadJSON: miniLoad, storage });
    autoplay(root, storage);
    expect(loadBooklet(storage)).toContain('xiaozi-mini');
  });
});

describe('場景圖軌跡（節點級換景）', () => {
  it('序章第一站首次抉擇後，◂ 立即停用（setBack 收到 null）', async () => {
    const storage = fakeStorage();
    const root = document.createElement('div');
    let lastBack = 'unset';
    const nav = { setBack(fn) { lastBack = fn; }, setMenu() {}, closeMenu() {}, toast() {} };
    await startGame({ root, loadJSON, storage, nav });
    [...root.querySelectorAll('button')].find((b) => b.textContent.includes('完整遊歷')).click();
    while (root.querySelector('.btn-next') && !root.querySelector('.btn-choice')) {
      root.querySelector('.btn-next').click();
    }
    expect(root.querySelector('.btn-choice')).toBeTruthy();
    root.querySelectorAll('.btn-choice')[0].click();
    expect(lastBack).toBe(null);
  });

  it('過場：夜訪圖 → 蓮台圖，返回時回退', async () => {
    const storage = fakeStorage();
    const s = createState();
    s.progress.screen = 'interlude';
    save(s, storage);
    const root = document.createElement('div');
    let back = null;
    const nav = { setBack(fn) { back = fn; }, setMenu() {}, closeMenu() {}, toast() {} };
    await startGame({ root, loadJSON, storage, nav });
    [...root.querySelectorAll('button')].find((b) => b.textContent === '繼續旅程').click();
    const art = () => root.querySelector('.scene-art img')?.getAttribute('src');
    expect(art()).toBe('assets/art/interlude-night.webp');
    const nodes = FILES['js/data/interlude.json'].nodes;
    const lotusIdx = nodes.findIndex((n) => n.art === 'interlude-lotus.webp');
    for (let i = 0; i < lotusIdx; i++) root.querySelector('.btn-next').click();
    expect(art()).toBe('assets/art/interlude-lotus.webp');
    back();
    expect(art()).toBe('assets/art/interlude-night.webp');
  });
});

describe('八仙支線功德', () => {
  const miniFlow = {
    screens: [
      { id: 'prologue', type: 'scene', src: 'prologue.json' },
      { id: 'baxian', type: 'visit', src: 'baxian.json' },
      { id: 'yaochi', type: 'finale', src: 'yaochi.json' },
    ],
    modes: {},
  };
  const miniLoad = async (p) =>
    p === 'js/data/flow.json' ? structuredClone(miniFlow) : loadJSON(p);

  it('接受並看完戲法 → 隱藏功德 +10 入 baxian', async () => {
    const storage = fakeStorage();
    const root = document.createElement('div');
    await startGame({ root, loadJSON: miniLoad, storage });
    autoplay(root, storage, { acceptBranch: true });
    expect(load(storage).wuByScreen.baxian).toBe(10);
  });
  it('婉拒支線 → baxian 0 分', async () => {
    const storage = fakeStorage();
    const root = document.createElement('div');
    await startGame({ root, loadJSON: miniLoad, storage });
    autoplay(root, storage, { acceptBranch: false });
    expect(load(storage).wuByScreen.baxian).toBe(0);
  });
});

describe('五軸覆蓋（完整版整合守門）', () => {
  it('完美通關後，五軸每一軸都至少有兩筆選擇紀錄', async () => {
    const storage = fakeStorage();
    const root = document.createElement('div');
    await startGame({ root, loadJSON, storage });
    autoplay(root, storage, { acceptBranch: true });
    const s = load(storage);
    for (const axis of ['ren', 'yi', 'li', 'zhi', 'xin']) {
      expect(s.choices.filter((c) => c.axis === axis).length, axis).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('三官殿懺悔補過（完整版整合）', () => {
  it('全善通關：無傷軸，repent 維持 null', async () => {
    const storage = fakeStorage();
    const root = document.createElement('div');
    await startGame({ root, loadJSON, storage });
    autoplay(root, storage, { acceptBranch: true });
    expect(load(storage).repent).toBeNull();
  });
  it('惡向通關：地官階段補過一軸（autoplay 取末項＝信），記在 sanguan；樹總分＝選擇總和＋1', async () => {
    const storage = fakeStorage();
    const root = document.createElement('div');
    await startGame({ root, loadJSON, storage });
    autoplay(root, storage, { acceptBranch: true, evil: true });
    const s = load(storage);
    expect(s.repent).toEqual({ axis: 'xin', screen: 'sanguan' });
    expect(treeTotal(s)).toBe(karmaSum(s) + 1);
    expect(s.wuByScreen.sanguan ?? 0).toBe(0); // 三官殿無考題
  });
  it('補過後再從選單直達三官殿 → resetScreen 清掉補過，可重選', async () => {
    const storage = fakeStorage();
    const root = document.createElement('div');
    let cfg = null;
    const nav = { setBack() {}, closeMenu() {}, toast() {}, setMenu(c) { if (c) cfg = c; } };
    await startGame({ root, loadJSON, storage, nav });
    autoplay(root, storage, { acceptBranch: true, evil: true });
    expect(load(storage).repent).not.toBeNull();
    cfg.onJump('sanguan');
    expect(load(storage).repent).toBeNull();
    expect(root.textContent).toContain(FILES['js/data/sanguan.json'].intro[0].text);
  });
});

describe('陰陽界結算（完整版整合）', () => {
  it('三位歸天者答對得 15 分入 yinyang；惡向亦得 15（悟性與五軸不連坐）', async () => {
    const storage = fakeStorage();
    const root = document.createElement('div');
    await startGame({ root, loadJSON, storage });
    autoplay(root, storage, { acceptBranch: true });
    expect(load(storage).wuByScreen.yinyang).toBe(15);
    const storage2 = fakeStorage();
    const root2 = document.createElement('div');
    await startGame({ root: root2, loadJSON, storage: storage2 });
    autoplay(root2, storage2, { acceptBranch: true, evil: true });
    expect(load(storage2).wuByScreen.yinyang).toBe(15);
  });
  it('答錯歸天者考題顯示 hint，重答對後 0 分', async () => {
    const storage = fakeStorage();
    const root = document.createElement('div');
    const s = createState();
    s.progress.screen = 'yinyang';
    save(s, storage);
    await startGame({ root, loadJSON, storage });
    [...root.querySelectorAll('button')].find((b) => b.textContent === '繼續旅程').click();
    while (!root.querySelector('.choices[data-kind="guest"]')) root.querySelector('.btn-next').click();
    const y = FILES['js/data/yinyang.json'];
    const wrong = (y.guests[0].quiz.answer + 1) % 3;
    root.querySelectorAll('.btn-choice')[wrong].click();
    expect(root.querySelector('.feedback').textContent).toBe(y.guests[0].quiz.hint);
    root.querySelectorAll('.btn-choice')[y.guests[0].quiz.answer].click();
    expect(root.querySelector('.feedback').textContent).toBe(y.guests[0].quiz.reveal);
    autoplay(root, storage, { acceptBranch: true });
    expect(load(storage).wuByScreen.yinyang).toBe(10);
  });
});

describe('瑤池：樹的來歷解鎖旗標', () => {
  it('旅途中 originUnlocked 為 false；走到瑤池「樹的來歷」後為 true 並存檔', async () => {
    const storage = fakeStorage();
    const root = document.createElement('div');
    await startGame({ root, loadJSON, storage });
    root.querySelector('.btn-next').click(); // 封面「完整遊歷」
    expect(load(storage).progress.originUnlocked).toBe(false);
    autoplay(root, storage, { acceptBranch: true });
    expect(load(storage).progress.originUnlocked).toBe(true);
    expect(root.querySelector('.finale-end')).not.toBeNull();
  });
});
