import { describe, it, expect } from 'vitest';
import { AXES, createState, creditWu, recordChoice, setRepent } from '../js/state.js';
import { KARMA_PENALTY } from '../js/config.js';
import { EFFECT, originRows, treeOrigin } from '../js/engine/origin.js';
import treeData from '../js/data/tree.json';

function journey() {
  const s = createState();
  s.wuMax = 100;
  recordChoice(s, { screen: 'prologue', scene: 'prologue', label: '晚上・上週的承諾', text: '「我臨時有事。」', axis: 'xin', delta: -1, weight: 2 });
  recordChoice(s, { screen: 'zhonghua', scene: 'zhonghua', text: '直接出門', axis: 'xin', delta: -1 });
  recordChoice(s, { screen: 'xiaozi', scene: 'xiaozi', label: '孝子殿・提親的人', text: '守住答應過的話', axis: 'xin', delta: 1 });
  recordChoice(s, { screen: 'gate', scene: 'gate', text: '像猴子', axis: 'li', delta: 0 });
  return s;
}
const titles = { prologue: '序章・陽間一日', zhonghua: '中華宮（土・信）', xiaozi: '孝子殿', gate: '南天門', sanguan: '三官殿（考核・補過）' };

describe('originRows', () => {
  it('只取該軸、依紀錄順序；value＝delta×weight；effect 依正負；where＝label 優先、否則站名', () => {
    const rows = originRows(journey(), 'xin', titles);
    expect(rows.map((r) => r.where)).toEqual(['晚上・上週的承諾', '中華宮（土・信）', '孝子殿・提親的人']);
    expect(rows.map((r) => r.value)).toEqual([-2, -1, 1]);
    expect(rows.map((r) => r.effect)).toEqual(['down', 'down', 'up']);
    expect(rows[0].text).toBe('「我臨時有事。」');
    expect(rows.every((r) => r.kind === 'choice')).toBe(true);
  });
  it('持平選擇 effect=flat；無 titles 時 where 退回 screen id', () => {
    expect(originRows(journey(), 'li')).toEqual([
      { kind: 'choice', screen: 'gate', where: 'gate', text: '像猴子', value: 0, effect: 'flat' },
    ]);
  });
  it('補過軸最後多一列 repent；其他軸不受影響；無紀錄軸為空', () => {
    const s = journey();
    setRepent(s, 'xin', 'sanguan');
    const rows = originRows(s, 'xin', titles);
    expect(rows.length).toBe(4);
    expect(rows.at(-1)).toEqual({
      kind: 'repent', screen: 'sanguan', where: '三官殿（考核・補過）',
      text: '地官赦罪：你選擇修枝補過此軸', value: 1, effect: 'repent',
    });
    expect(originRows(s, 'li').length).toBe(1);
    expect(originRows(s, 'ren')).toEqual([]);
  });
  it('EFFECT 用語固定', () => {
    expect(EFFECT).toEqual({ up: '澆灌', flat: '持平', down: '損傷', repent: '補過' });
  });
});

describe('treeOrigin', () => {
  it('五軸依 AXES 順序，各含 symptom、rows、評語、score／state；總和、樹況、悟性、蓮台', () => {
    const s = journey();
    creditWu(s, 'x', 80);
    const o = treeOrigin(s, treeData, titles);
    expect(o.axes.map((a) => a.axis)).toEqual(AXES);
    const xin = o.axes.find((a) => a.axis === 'xin');
    expect(xin.score).toBe(-2);
    expect(xin.state).toBe('bad');
    expect(xin.symptom).toBe(treeData.axes.xin.symptom.bad);
    expect(xin.rows.length).toBe(3);
    expect(xin.text).toBe(treeData.axes.xin.verdict.bad.plain);
    expect(xin.part).toBe('幹');
    const ren = o.axes.find((a) => a.axis === 'ren');
    expect(ren.rows).toEqual([]);
    expect(ren.symptom).toBe(treeData.axes.ren.symptom.flat);
    expect(o.total).toBe(-2);
    expect(o.level.label).toBe('稀疏');
    expect(o.wu).toBe(80 - 3 * KARMA_PENALTY); // 68：序章惡選權重 2 ＋中華宮惡選 1
    expect(o.lotus.label).toBe('蓮台半開');
  });
  it('補過後：該軸 score +1、repented 為真、評語為 repented 版、rows 含補過列', () => {
    const s = journey();
    setRepent(s, 'xin', 'sanguan');
    const xin = treeOrigin(s, treeData, titles).axes.find((a) => a.axis === 'xin');
    expect(xin.score).toBe(-1);
    expect(xin.repented).toBe(true);
    expect(xin.text).toBe(treeData.axes.xin.verdict.bad.repented);
    expect(xin.rows.at(-1).kind).toBe('repent');
  });
});
