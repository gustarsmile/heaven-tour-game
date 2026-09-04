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
  expect(['sapling', 'read', 'judge']).toContain(t.mode);
  expect(t.title.length).toBeGreaterThan(0);
  expect(t.intro.length).toBeGreaterThanOrEqual(1);
  expect(t.closing.length).toBeGreaterThan(0);
  expectArt(t.art.scene);
  if (t.mode === 'sapling') {
    expect(t.look.lines.length).toBeGreaterThanOrEqual(1);
    expect(t.card).toBeUndefined();
    return;
  }
  if (t.mode === 'judge') {
    expect(t.tianguan.lines.length).toBeGreaterThanOrEqual(1);
    for (const k of ['goodLead', 'noneLine', 'closing']) expect(t.tianguan[k].length, `tianguan.${k}`).toBeGreaterThan(0);
    expect(t.diguan.lines.length).toBeGreaterThanOrEqual(1);
    for (const k of ['badLead', 'prompt', 'reply', 'noneLine', 'skipHint']) expect(t.diguan[k].length, `diguan.${k}`).toBeGreaterThan(0);
    expect(t.diguan.reply).toContain('{part}');
    expect(t.diguan.reply).toContain('{label}');
    expect(t.shuiguan.lines.length).toBeGreaterThanOrEqual(1);
    for (const k of ['remainLead', 'noneLine', 'closing']) expect(t.shuiguan[k].length, `shuiguan.${k}`).toBeGreaterThan(0);
    validateCard(t.card);
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

const STAGE_AXES = ['xin', 'li', 'yi', 'ren', 'zhi']; // 腳→六根→肚腸→心→絕塵嶺（設計 §3.4）

function validateReview(r) {
  expect(r.title.length).toBeGreaterThan(0);
  expect(r.intro.length).toBeGreaterThanOrEqual(1);
  for (const k of ['good', 'bad']) {
    expect(r.fork[k].lines.length, `fork.${k}`).toBeGreaterThanOrEqual(1);
    expect(r.road[k].lines.length, `road.${k}`).toBeGreaterThanOrEqual(1);
  }
  expect(r.guests.length).toBe(3);
  for (const g of r.guests) {
    expect(g.name.length).toBeGreaterThan(0);
    expect(g.lines.length).toBeGreaterThanOrEqual(1);
    expect(g.quiz.question.length).toBeGreaterThan(0);
    expect(g.quiz.options.length).toBe(3);
    expect(g.quiz.answer).toBeGreaterThanOrEqual(0);
    expect(g.quiz.answer).toBeLessThan(3);
    expect(g.quiz.hint.length).toBeGreaterThan(0);
    expect(g.quiz.reveal.length).toBeGreaterThan(0);
  }
  expect(r.stages.map((s) => s.axis)).toEqual(STAGE_AXES);
  for (const s of r.stages) {
    for (const key of ['name', 'line', 'empty']) expect(s[key].length, key).toBeGreaterThan(0);
    for (const k of ['good', 'flat', 'bad']) expect(s.comment[k].length, `comment.${k}`).toBeGreaterThan(0);
  }
  expect(r.closing.length).toBeGreaterThan(0);
  validateCard(r.card);
  expectArt(r.art.scene);
}

// ---------- flow.json 守門 ----------

describe('flow.json 驗證', () => {
  it('id 不重複、首畫面為 prologue、末畫面為 finale、src 檔案都存在', () => {
    const ids = flow.screens.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(flow.screens[0].id).toBe('prologue');
    expect(flow.screens.at(-1).type).toBe('finale');
    for (const s of flow.screens) {
      expect(['scene', 'visit', 'tree', 'review', 'finale']).toContain(s.type);
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
  it('階段 3 完整版畫面順序固定（防止站點被默默移除）', () => {
    expect(flow.screens.map((s) => s.id)).toEqual([
      'prologue', 'interlude', 'sapling', 'gate', 'sanqinghe', 'donghua',
      'nanhua', 'xihua', 'beihua', 'zhonghua', 'kongzi', 'shijia', 'guanyin',
      'sanguan', 'zhongyi', 'xiaozi', 'yinyang', 'baxian', 'yaochi',
    ]);
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
    } else if (scr.type === 'review') {
      it(`${scr.src}：結算關（陰陽界）結構正確`, () => validateReview(FILES[scr.src]));
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

describe('scene 站天音卡', () => {
  it('孝子殿為 scene 型別且帶天音卡（引擎 scene 卡路徑的實際對象）', () => {
    const scr = flow.screens.find((s) => s.id === 'xiaozi');
    expect(scr.type).toBe('scene');
    expect(FILES['xiaozi.json'].card).toBeTruthy();
  });
});

// ---------- 孝子殿專屬 ----------

describe('孝子殿專屬驗證', () => {
  it('三段抉擇軸恰為 ren／xin／yi 各一，delta 皆為 [1, 0, -1]，且附天音卡', () => {
    const xiaozi = FILES['xiaozi.json'];
    const nodes = xiaozi.nodes.filter((n) => n.type === 'choice');
    expect(nodes.length).toBe(3);
    const axes = nodes.map((n) => n.choices.find((c) => c.karma)?.karma.axis);
    expect([...axes].sort()).toEqual(['ren', 'xin', 'yi']);
    for (const n of nodes) {
      expect(n.label.length).toBeGreaterThan(0);
      expect(n.choices.map((c) => c.karma.delta)).toEqual([1, 0, -1]);
    }
    validateCard(xiaozi.card);
  });
});

// ---------- 三官殿專屬 ----------

describe('三官殿專屬驗證', () => {
  it('tree:judge、插在普陀山之後忠義殿之前、天音卡出自第 31 回地官', () => {
    const ids = flow.screens.map((s) => s.id);
    const scr = flow.screens.find((s) => s.id === 'sanguan');
    expect(scr.type).toBe('tree');
    expect(FILES['sanguan.json'].mode).toBe('judge');
    expect(ids.indexOf('sanguan')).toBe(ids.indexOf('guanyin') + 1);
    expect(ids.indexOf('zhongyi')).toBe(ids.indexOf('sanguan') + 1);
    expect(FILES['sanguan.json'].card.source.chapter).toBe(31);
    expect(FILES['sanguan.json'].card.speaker).toBe('地官大帝');
  });
  it('普陀山結語不再指向忠義殿（後接三官殿）', () => {
    expect(FILES['guanyin.json'].closing).not.toContain('兩位人間的榜樣');
  });
});

// ---------- 陰陽界專屬 ----------

describe('陰陽界專屬驗證', () => {
  it('review 型別、插在孝子殿之後；八仙移到陰陽界之後、瑤池之前；天音卡出自第 34 回濟佛', () => {
    const ids = flow.screens.map((s) => s.id);
    expect(flow.screens.find((s) => s.id === 'yinyang').type).toBe('review');
    expect(ids.indexOf('yinyang')).toBe(ids.indexOf('xiaozi') + 1);
    expect(ids.indexOf('baxian')).toBe(ids.indexOf('yinyang') + 1);
    expect(ids.indexOf('yaochi')).toBe(ids.indexOf('baxian') + 1);
    const y = FILES['yinyang.json'];
    expect(y.card.source.chapter).toBe(34);
    expect(y.card.speaker).toBe('濟佛');
    expect(y.guests.map((g) => g.quiz.answer)).toEqual([1, 0, 2]); // 三題答案位置錯開
  });
});
