import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { AXES, createState, recordChoice, setRepent } from '../js/state.js';
import {
  AXIS_PARTS, axisScores, axisState, treeTotal, treeVerdict, treeLevel, lotusTier, saplingLeaves, readTree,
} from '../js/engine/tree.js';
import { WU_THRESHOLD } from '../js/config.js';
import treeData from '../js/data/tree.json';

// entries: [axis, delta, weight=1, screen='gate']
function stateWith(entries, repent) {
  const s = createState();
  for (const [axis, delta, weight = 1, screen = 'gate'] of entries) {
    recordChoice(s, { screen, scene: screen, text: 'x', axis, delta, weight });
  }
  if (repent) setRepent(s, repent, 'sanguan');
  return s;
}

describe('五軸分數與三態', () => {
  it('axisScores＝選擇加總（含權重）＋補過 +1', () => {
    const s = stateWith([['ren', 1, 2], ['li', -1], ['li', -1]], 'li');
    expect(axisScores(s)).toEqual({ ren: 2, yi: 0, li: -1, zhi: 0, xin: 0 });
  });
  it('axisState：≥1 佳、0 平、≤−1 傷', () => {
    expect(axisState(1)).toBe('good');
    expect(axisState(0)).toBe('flat');
    expect(axisState(-1)).toBe('bad');
    expect(axisState(-3)).toBe('bad');
  });
  it('AXIS_PARTS 五部位', () => {
    expect(AXIS_PARTS).toEqual({ xin: '幹', ren: '根', zhi: '葉', li: '花', yi: '果' });
  });
});

describe('樹況', () => {
  it('treeTotal／treeVerdict：總和 ≥ 0 善', () => {
    expect(treeVerdict(stateWith([]))).toBe('good');
    expect(treeVerdict(stateWith([['xin', -1]]))).toBe('bad');
    expect(treeTotal(stateWith([['xin', -1], ['ren', 1, 2]]))).toBe(1);
  });
  it('treeLevel 依 tree.json 門檻（階段 3 校準）：≤−7 枯萎、−6～−1 稀疏、0～3 平常、4～8 茂盛、≥9 結果纍纍', () => {
    const lv = (total) => treeLevel(
      stateWith(total >= 0 ? [['ren', 1, total]] : [['ren', -1, -total]]), treeData.levels,
    ).label;
    expect(lv(-21)).toBe('枯萎');
    expect(lv(-7)).toBe('枯萎');
    expect(lv(-6)).toBe('稀疏');
    expect(lv(-1)).toBe('稀疏');
    expect(lv(0)).toBe('平常');
    expect(lv(3)).toBe('平常');
    expect(lv(4)).toBe('茂盛');
    expect(lv(8)).toBe('茂盛');
    expect(lv(9)).toBe('結果纍纍');
    expect(lv(21)).toBe('結果纍纍');
  });
  it('lotusTier 依 tree.json 分級：0 一瓣初綻、40 蓮台半開、70 蓮台盛開、90 九品蓮台', () => {
    const t = (wu) => lotusTier(wu, treeData.lotus.tiers).label;
    expect(t(0)).toBe('一瓣初綻');
    expect(t(39)).toBe('一瓣初綻');
    expect(t(40)).toBe('蓮台半開');
    expect(t(69)).toBe('蓮台半開');
    expect(t(70)).toBe('蓮台盛開');
    expect(t(89)).toBe('蓮台盛開');
    expect(t(90)).toBe('九品蓮台');
    expect(t(100)).toBe('九品蓮台');
  });
  it('saplingLeaves 只數序章善選', () => {
    const s = stateWith([
      ['ren', 1, 2, 'prologue'], ['li', 0, 2, 'prologue'], ['yi', -1, 2, 'prologue'], ['zhi', 1, 1, 'gate'],
    ]);
    expect(saplingLeaves(s)).toBe(1);
  });
});

describe('讀樹 readTree', () => {
  it('五軸各一段依 AXES 順序；三態取評語；傷者依有無補過取兩版', () => {
    const s = stateWith([['ren', 1, 2], ['li', -1], ['xin', -1], ['xin', -1]], 'xin');
    const r = readTree(s, treeData);
    expect(r.map((x) => x.axis)).toEqual(AXES);
    const by = Object.fromEntries(r.map((x) => [x.axis, x]));
    expect(by.ren.state).toBe('good');
    expect(by.ren.text).toBe(treeData.axes.ren.verdict.good);
    expect(by.yi.state).toBe('flat');
    expect(by.yi.text).toBe(treeData.axes.yi.verdict.flat);
    expect(by.li.state).toBe('bad');
    expect(by.li.repented).toBe(false);
    expect(by.li.text).toBe(treeData.axes.li.verdict.bad.plain);
    expect(by.xin.state).toBe('bad'); // −2 +1 補過 = −1 仍傷
    expect(by.xin.repented).toBe(true);
    expect(by.xin.text).toBe(treeData.axes.xin.verdict.bad.repented);
    expect(by.xin.part).toBe('幹');
    expect(by.xin.label).toBe('信');
    expect(by.xin.score).toBe(-1);
  });
});

describe('tree.json 守門', () => {
  it('五軸 × 三態評語與症狀、傷含 plain／repented；五級 min 為校準值、圖檔存在、各有 line；蓮台四級含 WU_THRESHOLD', () => {
    for (const a of AXES) {
      const v = treeData.axes[a].verdict;
      expect(v.good.length).toBeGreaterThan(0);
      expect(v.flat.length).toBeGreaterThan(0);
      expect(v.bad.plain.length).toBeGreaterThan(0);
      expect(v.bad.repented.length).toBeGreaterThan(0);
      const sy = treeData.axes[a].symptom;
      for (const k of ['good', 'flat', 'bad']) expect(sy[k].length, `${a}.symptom.${k}`).toBeGreaterThan(0);
    }
    expect(treeData.levels.map((l) => l.min)).toEqual([-99, -6, 0, 4, 9]);
    expect(treeData.levels.map((l) => l.label)).toEqual(['枯萎', '稀疏', '平常', '茂盛', '結果纍纍']);
    for (const l of treeData.levels) {
      expect(existsSync(`assets/art/${l.art}`), l.art).toBe(true);
      expect(l.line.length).toBeGreaterThan(0);
    }
    expect(existsSync(`assets/art/${treeData.sapling.art}`)).toBe(true);
    expect(treeData.lotus.tiers.map((t) => t.min)).toEqual([0, 40, 70, 90]);
    expect(treeData.lotus.tiers.map((t) => t.min)).toContain(WU_THRESHOLD);
    for (const t of treeData.lotus.tiers) {
      expect(t.label.length).toBeGreaterThan(0);
      expect(t.scale).toBeGreaterThan(0);
    }
  });
});
