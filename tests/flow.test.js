// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { startGame } from '../js/flow.js';
import { createState, save, load, finalWu, rawWu } from '../js/state.js';
import { endingKey } from '../js/engine/finale.js';
import { loadBooklet } from '../js/booklet.js';
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
    const wu = max > 0 ? Math.round((raw / max) * 100) : 0;
    expect(finalWu(s)).toBe(wu);
    expect(finalWu(s)).toBe(100);
    expect(root.textContent).toContain(`悟性值 ${wu}`);
    expect(root.textContent).toContain(yaochi.endings[endingKey(s)].title);
    expect(root.textContent).toContain('道果圓熟・蓮台九品');
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
    const { raw } = expectedRaw(flowData.screens, { acceptBranch: true, evil: true });
    expect(rawWu(s)).toBe(raw);
    const wu = finalWu(s);
    expect(finalWu(s)).toBeLessThan(70);
    expect(root.textContent).toContain(`悟性值 ${wu}`);
    expect(root.textContent).toContain(yaochi.endings[endingKey(s)].title);
    expect(root.textContent).toContain('種子未萌・再世重修');
    const pro = s.choices.filter((c) => c.screen === 'prologue');
    expect(pro.length).toBe(5);
    for (const c of pro) expect(c.delta).toBe(-1);
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
    expect(rawWu(s)).toBe(raw);
    expect(root.textContent).toContain(`悟性值 ${max > 0 ? Math.round((raw / max) * 100) : 0}`);
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

  it('通關收滿因果卡入善書冊，重新開始後冊仍保留', async () => {
    const storage = fakeStorage();
    const root = document.createElement('div');
    await startGame({ root, loadJSON, storage });
    autoplay(root, storage, { acceptBranch: true });
    const cardScreens = flowData.screens
      .filter((s) => resourceOf(s.id)?.card).map((s) => s.id);
    expect([...loadBooklet(storage)].sort()).toEqual([...cardScreens].sort());
    [...root.querySelectorAll('button')].find((b) => b.textContent === '重新開始').click();
    expect([...loadBooklet(storage)].sort()).toEqual([...cardScreens].sort());
  });
});

describe('場景圖軌跡（節點級換景）', () => {
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
