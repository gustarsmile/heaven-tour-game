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
  expect(v.king.length).toBeGreaterThan(0);
  expect(v.intro.length).toBeGreaterThanOrEqual(1);
  expect(v.watch.title.length).toBeGreaterThan(0);
  expect(v.watch.panels.length).toBeGreaterThanOrEqual(1);
  expect(v.watch.panels.length).toBeLessThanOrEqual(3);
  expect(v.quiz && v.mercy).toBeFalsy(); // 考題與慈悲抉擇至多擇一
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
  expectArt(v.art.watch);
}

function validateFinale(f) {
  expect(f.king.length).toBeGreaterThan(0);
  expect(f.intro.length).toBeGreaterThanOrEqual(1);
  expect(f.mengpo.lines.length).toBeGreaterThanOrEqual(1);
  expect(f.mengpo.prompt.length).toBeGreaterThan(0);
  expect(f.mengpo.choices.length).toBe(2);
  expect(f.mengpo.choices[0].drank).toBe(false); // autoplay 慣例：首選為「不喝」（善向）
  for (const c of f.mengpo.choices) {
    expect(typeof c.drank).toBe('boolean');
    expect(c.text.length).toBeGreaterThan(0);
    expect(c.reply.length).toBeGreaterThan(0);
  }
  expect(f.wuReveal.lines.length).toBeGreaterThanOrEqual(1);
  expect(f.wuReveal.note.length).toBeGreaterThan(0);
  expect(f.mirror.lines.length).toBeGreaterThanOrEqual(1);
  expect(f.mirror.journey).toContain('{good}');
  expect(f.mirror.journey).toContain('{evil}');
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
  expect(f.mission.kept.length).toBeGreaterThanOrEqual(1);
  expect(f.mission.drank.length).toBeGreaterThanOrEqual(1);
  expect(f.source.url).toMatch(/^https?:\/\//);
  expectArt(f.art.scene);
  for (const k of keys) expectArt(f.art.endings[k]);
}

// ---------- flow.json 守門 ----------

describe('flow.json 驗證', () => {
  it('id 不重複、首畫面為 prologue、末畫面為 finale、src 檔案都存在', () => {
    const ids = flow.screens.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(flow.screens[0].id).toBe('prologue');
    expect(flow.screens.at(-1).type).toBe('finale');
    for (const s of flow.screens) {
      expect(['scene', 'visit', 'finale']).toContain(s.type);
      expect(FILES[s.src]).toBeDefined();
      if (s.type === 'scene') expectArt(FILES[s.src].art);
    }
  });
  it('每個畫面資料都有 tagline（遊歷選單一句簡介）', () => {
    for (const s of flow.screens) expect(typeof FILES[s.src].tagline).toBe('string');
  });
});

// ---------- 逐檔驗證（自動掃描） ----------

describe('內容資料驗證', () => {
  for (const scr of flow.screens) {
    if (scr.type === 'scene') {
      it(`${scr.src}：場景結構正確`, () => validateScene(FILES[scr.src]));
    } else if (scr.type === 'visit') {
      it(`${scr.src}：見聞殿結構正確`, () => validateVisit(FILES[scr.src]));
    } else if (scr.type === 'finale') {
      it(`${scr.src}：結算關結構正確`, () => validateFinale(FILES[scr.src]));
    }
  }
});

// ---------- 序章專屬 ----------

describe('序章專屬驗證', () => {
  it('權重為 2，且每題 karma 軸皆為五常之一', () => {
    expect(prologue.karmaWeight).toBe(2);
    for (const n of prologue.nodes.filter((x) => x.type === 'choice')) {
      expect(AXES).toContain(n.choices.find((c) => c.karma).karma.axis);
    }
  });
});

// ---------- 十殿專屬驗證 ----------

describe('十殿專屬驗證', () => {
  it('四結局稱號與設計文件一致', () => {
    const e = FILES['hall10.json'].endings;
    expect(e.highGood.title).toBe('大覺大悟·代天宣化');
    expect(e.highBad.title).toBe('滿腹經綸·知易行難');
    expect(e.lowGood.title).toBe('不識一字·菩薩心腸');
    expect(e.lowBad.title).toBe('執迷不悟·輪迴重修');
  });
  it('hall10 結算出處連結與起始回一致（第55回=/57.htm）', () => {
    expect(FILES['hall10.json'].source.url).toBe('https://www.taolibrary.com/category/category48/c48002b/57.htm');
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
