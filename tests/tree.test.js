import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { AXES, createState, recordChoice, setRepent } from '../js/state.js';
import {
  AXIS_PARTS, axisScores, axisState, treeTotal, treeVerdict, treeLevel, saplingLeaves, readTree,
} from '../js/engine/tree.js';
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
  it('treeLevel 依 tree.json 門檻：−5 枯萎、−1 稀疏、0 平常、3 茂盛、7 結果纍纍', () => {
    const lv = (total) => treeLevel(
      stateWith(total >= 0 ? [['ren', 1, total]] : [['ren', -1, -total]]), treeData.levels,
    ).label;
    expect(lv(-5)).toBe('枯萎');
    expect(lv(-1)).toBe('稀疏');
    expect(lv(0)).toBe('平常');
    expect(lv(3)).toBe('茂盛');
    expect(lv(7)).toBe('結果纍纍');
    expect(lv(11)).toBe('結果纍纍');
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
  it('五軸 × 三態、傷含 plain／repented；五級 min 固定、圖檔存在、各有一句 line', () => {
    for (const a of AXES) {
      const v = treeData.axes[a].verdict;
      expect(v.good.length).toBeGreaterThan(0);
      expect(v.flat.length).toBeGreaterThan(0);
      expect(v.bad.plain.length).toBeGreaterThan(0);
      expect(v.bad.repented.length).toBeGreaterThan(0);
    }
    expect(treeData.levels.map((l) => l.min)).toEqual([-99, -4, 0, 3, 7]);
    expect(treeData.levels.map((l) => l.label)).toEqual(['枯萎', '稀疏', '平常', '茂盛', '結果纍纍']);
    for (const l of treeData.levels) {
      expect(existsSync(`assets/art/${l.art}`), l.art).toBe(true);
      expect(l.line.length).toBeGreaterThan(0);
    }
    expect(existsSync(`assets/art/${treeData.sapling.art}`)).toBe(true);
  });
});
