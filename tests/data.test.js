import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { AXES } from '../js/state.js';
import { SOURCE_BASE, SOURCE_CHAPTERS } from '../js/config.js';
import prologue from '../js/data/prologue.json';

const modules = import.meta.glob('../js/data/*.json', { eager: true });
const FILES = {};
for (const [path, mod] of Object.entries(modules)) {
  FILES[path.split('/').pop()] = mod.default;
}
const flow = FILES['flow.json'];

// ---------- 通用驗證器 ----------

function expectKarma(karma) {
  expect(AXES).toContain(karma.axis);
  expect([-1, 0, 1]).toContain(karma.delta);
}

function expectArt(file) {
  expect(typeof file).toBe('string');
  expect(existsSync(`assets/art/${file}`), file).toBe(true);
}

function validateScene(scene) {
  const ids = new Set(scene.nodes.map((n) => n.id));
  expect(ids.size).toBe(scene.nodes.length);
  expect(ids.has(scene.start)).toBe(true);
  for (const node of scene.nodes) {
    if (node.type === 'line') expect(ids.has(node.next)).toBe(true);
    if (node.type === 'choice') {
      expect(node.choices.length).toBeGreaterThanOrEqual(2);
      // autoplay 慣例：choices[0] 必為最善（無 karma 或 delta ≥ 0）
      if (node.choices[0].karma) expect(node.choices[0].karma.delta).toBeGreaterThanOrEqual(0);
      // autoplay 慣例：凡帶 karma 的選擇列表，最末選項必為最惡（delta ≤ 0）
      if (node.choices.some((c) => c.karma)) {
        expect(node.choices.at(-1).karma?.delta ?? 0).toBeLessThanOrEqual(0);
      }
      for (const c of node.choices) {
        expect(ids.has(c.next)).toBe(true);
        if (c.karma) expectKarma(c.karma);
      }
    }
  }
  expect(scene.nodes.some((n) => n.type === 'end')).toBe(true);
}

function validateCard(card) {
  for (const key of ['title', 'lesson', 'quote', 'speaker', 'source']) expect(card[key]).toBeTruthy();
  expect(Number.isInteger(card.source.chapter)).toBe(true);
  expect(card.source.chapter).toBeGreaterThanOrEqual(1);
  expect(card.source.chapter).toBeLessThanOrEqual(SOURCE_CHAPTERS);
  // 網址與回數強一致（網頁編號＝回數＋2，兩位數補零：第 1 回 → 03.htm）
  expect(card.source.url).toBe(`${SOURCE_BASE}/${String(card.source.chapter + 2).padStart(2, '0')}.htm`);
}

function validateReactionChoices(choices) {
  expect(choices.length).toBeGreaterThanOrEqual(2);
  for (const c of choices) {
    expect(c.text.length).toBeGreaterThan(0);
    expect(c.reply.length).toBeGreaterThan(0);
    if (c.karma) expectKarma(c.karma);
  }
  const deltas = choices.map((c) => c.karma?.delta ?? 0);
  expect(deltas).toContain(1);   // 至少一善
  expect(deltas).toContain(-1);  // 至少一惡
  expect(deltas[0]).toBeGreaterThanOrEqual(0); // choices[0] 最善慣例
  expect(deltas.at(-1)).toBeLessThanOrEqual(0); // 最末選項最惡慣例
}

function validateVisit(v) {
  expect(v.title.length).toBeGreaterThan(0);
  expect(v.intro.length).toBeGreaterThanOrEqual(1);
  expect(v.watch.title.length).toBeGreaterThan(0);
  expect(v.watch.panels.length).toBeGreaterThanOrEqual(1);
  expect(v.watch.panels.length).toBeLessThanOrEqual(3);
  if (v.quiz) {
    expect(v.quiz.options.length).toBe(3);
    expect(v.quiz.answer).toBeGreaterThanOrEqual(0);
    expect(v.quiz.answer).toBeLessThan(v.quiz.options.length);
    expect(v.quiz.hint.length).toBeGreaterThan(0);
    expect(v.quiz.reveal.length).toBeGreaterThan(0);
  }
  if (v.mercy) validateReactionChoices(v.mercy.choices);
  if (v.branch) {
    for (const key of ['prompt', 'acceptText', 'declineText', 'declineLine']) {
      expect(v.branch[key].length).toBeGreaterThan(0);
    }
    expect(typeof v.branch.rewardWu).toBe('number');
    validateScene(v.branch.scene);
  }
  expect(v.closing.length).toBeGreaterThan(0);
  validateCard(v.card);
  expectArt(v.art.scene);
  if (v.art.watch) expectArt(v.art.watch);
}

function validateTree(t) {
  expect(['sapling', 'read']).toContain(t.mode);
  expect(t.title.length).toBeGreaterThan(0);
  expect(t.intro.length).toBeGreaterThanOrEqual(1);
  expect(t.closing.length).toBeGreaterThan(0);
  expectArt(t.art.scene);
  if (t.mode === 'sapling') {
    expect(t.look.lines.length).toBeGreaterThanOrEqual(1);
    expect(t.card).toBeUndefined();
    return;
  }
  expect(t.garden.lines.length).toBeGreaterThanOrEqual(1);
  expect(t.read.lines.length).toBeGreaterThanOrEqual(1);
  expect(t.cases.length).toBeGreaterThanOrEqual(4);
  for (const c of t.cases) {
    for (const key of ['desc', 'question', 'hint', 'reveal']) expect(c[key].length).toBeGreaterThan(0);
    expect(c.options.length).toBe(3);
    expect(c.answer).toBeGreaterThanOrEqual(0);
    expect(c.answer).toBeLessThan(3);
    expectArt(c.art);
  }
  validateCard(t.card);
}

function validateFinale(f) {
  expect(f.title.length).toBeGreaterThan(0);
  expect(f.intro.length).toBeGreaterThanOrEqual(1);
  expect(f.wuReveal.lines.length).toBeGreaterThanOrEqual(1);
  expect(f.wuReveal.note.length).toBeGreaterThan(0);
  expect(f.tree.lines.length).toBeGreaterThanOrEqual(1);
  const keys = ['highBad', 'highGood', 'lowBad', 'lowGood'];
  expect(Object.keys(f.endings).sort()).toEqual(keys);
  for (const k of keys) {
    const e = f.endings[k];
    expect(e.title.length).toBeGreaterThan(0);
    expect(e.comment.length).toBeGreaterThanOrEqual(1);
    for (const line of e.comment) expect(line.text.length).toBeGreaterThan(0);
    expect(e.motto.length).toBeGreaterThan(0);
  }
  for (const k of ['highBad', 'lowBad']) {
    expect(f.endings[k].quote).toContain('{text}'); // 引用序章具體選擇（設計 §3.5）
    expect(f.endings[k].quoteFallback.length).toBeGreaterThan(0);
  }
  expect(f.source.label.length).toBeGreaterThan(0);
  expect(f.source.url).toMatch(/^https?:\/\//);
  expectArt(f.art.scene);
}

// ---------- flow.json 守門 ----------

describe('flow.json 驗證', () => {
  it('id 不重複、首畫面為 prologue、末畫面為 finale、src 檔案都存在', () => {
    const ids = flow.screens.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(flow.screens[0].id).toBe('prologue');
    expect(flow.screens.at(-1).type).toBe('finale');
    for (const s of flow.screens) {
      expect(['scene', 'visit', 'tree', 'finale']).toContain(s.type);
      expect(FILES[s.src]).toBeDefined();
      if (s.type === 'scene') expectArt(FILES[s.src].art);
    }
  });
  it('每個畫面資料都有 tagline（遊歷選單一句簡介）', () => {
    for (const s of flow.screens) expect(typeof FILES[s.src].tagline).toBe('string');
  });
  it('modes 每個鍵的每個 id 都能對應到 flow.screens，且首站為 prologue', () => {
    const screenIds = new Set(flow.screens.map((s) => s.id));
    for (const [, ids] of Object.entries(flow.modes)) {
      expect(ids.length).toBeGreaterThan(0);
      for (const id of ids) expect(screenIds.has(id)).toBe(true);
      expect(ids[0]).toBe('prologue');
    }
  });
});

// ---------- 逐檔驗證（自動掃描） ----------

describe('內容資料驗證', () => {
  for (const scr of flow.screens) {
    if (scr.type === 'scene') {
      it(`${scr.src}：場景結構正確`, () => {
        validateScene(FILES[scr.src]);
        if (FILES[scr.src].card) validateCard(FILES[scr.src].card);
      });
    } else if (scr.type === 'visit') {
      it(`${scr.src}：見聞殿結構正確`, () => validateVisit(FILES[scr.src]));
    } else if (scr.type === 'tree') {
      it(`${scr.src}：看樹站結構正確`, () => validateTree(FILES[scr.src]));
    } else if (scr.type === 'finale') {
      it(`${scr.src}：結算關結構正確`, () => validateFinale(FILES[scr.src]));
    }
  }
});

// ---------- 序章專屬 ----------

describe('序章專屬驗證', () => {
  it('權重為 2，且五軸恰好各一題', () => {
    expect(prologue.karmaWeight).toBe(2);
    const axesUsed = prologue.nodes
      .filter((n) => n.type === 'choice')
      .map((n) => n.choices.find((c) => c.karma)?.karma.axis);
    expect(axesUsed.length).toBe(AXES.length);
    expect([...axesUsed].sort()).toEqual([...AXES].sort());
  });
  it('五個抉擇節點皆有 label，且三選項為 善／中／惡（+1／0／−1）', () => {
    const nodes = prologue.nodes.filter((n) => n.type === 'choice');
    expect(nodes.length).toBe(5);
    for (const n of nodes) {
      expect(n.label.length).toBeGreaterThan(0);
      expect(n.choices.map((c) => c.karma.delta)).toEqual([1, 0, -1]);
    }
  });
  it('節點級 art 皆存在於 assets/art', () => {
    for (const f of ['prologue.json', 'interlude.json']) {
      for (const n of FILES[f].nodes) if (n.art) expectArt(n.art);
    }
  });
});

// ---------- 瑤池結算專屬 ----------

describe('瑤池結算專屬驗證', () => {
  it('四結局稱號與設計文件 §3.5 一致', () => {
    const e = FILES['yaochi.json'].endings;
    expect(e.highGood.title).toBe('道果圓熟・蓮台九品');
    expect(e.highBad.title).toBe('滿樹青果・知而未行');
    expect(e.lowGood.title).toBe('不識經文・根深葉茂');
    expect(e.lowBad.title).toBe('種子未萌・再世重修');
  });
  it('結算出處為第三六回（/38.htm）', () => {
    expect(FILES['yaochi.json'].source.url).toBe('https://www.taolibrary.com/category/category48/c48001b/38.htm');
  });
});

// ---------- 美術資產：全域補漏 ----------

describe('美術欄位驗證', () => {
  it('資料中所有 .webp 引用皆存在', () => {
    const seen = [];
    const walk = (v) => {
      if (typeof v === 'string' && v.endsWith('.webp')) seen.push(v);
      else if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') Object.values(v).forEach(walk);
    };
    Object.values(FILES).forEach(walk);
    expect(seen.length).toBeGreaterThan(0);
    seen.forEach(expectArt);
  });
});

// ---------- scene 站天音卡：引擎規則守門（Task 6 孝子殿起有實際對象） ----------

describe('scene 站天音卡（引擎支援）', () => {
  it('validateCard 拒絕缺 quote 的卡', () => {
    expect(() => validateCard({ title: 't', lesson: 'l', speaker: 's', source: { chapter: 1, url: 'x' } })).toThrow();
  });
});
