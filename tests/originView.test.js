// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { signed, appendOriginRows, appendTreeOrigin } from '../js/ui/originView.js';
import { originRows, treeOrigin } from '../js/engine/origin.js';
import { createState, creditWu, recordChoice, setRepent } from '../js/state.js';
import treeData from '../js/data/tree.json';

function journey() {
  const s = createState();
  s.wuMax = 100;
  creditWu(s, 'x', 80);
  recordChoice(s, { screen: 'prologue', scene: 'prologue', label: '晚上・上週的承諾', text: '「我臨時有事。」', axis: 'xin', delta: -1, weight: 2 });
  recordChoice(s, { screen: 'zhonghua', scene: 'zhonghua', text: '直接出門', axis: 'xin', delta: -1 });
  recordChoice(s, { screen: 'xiaozi', scene: 'xiaozi', label: '孝子殿・提親的人', text: '守住答應過的話', axis: 'xin', delta: 1 });
  recordChoice(s, { screen: 'gate', scene: 'gate', text: '像猴子', axis: 'li', delta: 0 });
  return s;
}
const titles = { zhonghua: '中華宮（土・信）', gate: '南天門', sanguan: '三官殿（考核・補過）' };

describe('signed', () => {
  it('正數帶 +、零為 0、負數原樣', () => {
    expect(signed(3)).toBe('+3');
    expect(signed(0)).toBe('0');
    expect(signed(-2)).toBe('-2');
  });
});

describe('appendOriginRows', () => {
  it('每列含站名、選項文字、效果字與數值；effect class 對應', () => {
    const box = document.createElement('div');
    const ul = appendOriginRows(box, originRows(journey(), 'xin', titles));
    expect(ul.className).toBe('origin-rows');
    const rows = box.querySelectorAll('.origin-row');
    expect(rows.length).toBe(3);
    expect(rows[0].className).toContain('effect-down');
    expect(rows[0].querySelector('.origin-where').textContent).toBe('晚上・上週的承諾');
    expect(rows[0].querySelector('.origin-choice').textContent).toBe('「我臨時有事。」');
    expect(rows[0].querySelector('.origin-effect').textContent).toBe('損傷 -2');
    expect(rows[1].querySelector('.origin-where').textContent).toBe('中華宮（土・信）');
    expect(rows[2].className).toContain('effect-up');
    expect(rows[2].querySelector('.origin-effect').textContent).toBe('澆灌 +1');
  });
});

describe('appendTreeOrigin', () => {
  it('五部位區塊、標頭（部位（軸）、症狀、總計）、列、帝君語、總結兩行', () => {
    const s = journey();
    setRepent(s, 'xin', 'sanguan');
    const box = document.createElement('div');
    appendTreeOrigin(box, treeOrigin(s, treeData, titles));
    const axes = box.querySelectorAll('.origin-axis');
    expect(axes.length).toBe(5);
    const xin = [...axes].find((a) => a.querySelector('.origin-part').textContent === '幹（信）');
    expect(xin.className).toContain('state-bad');
    expect(xin.querySelector('.origin-symptom').textContent).toBe(treeData.axes.xin.symptom.bad);
    expect(xin.querySelector('.origin-total').textContent).toBe('總計 -1');
    expect(xin.querySelectorAll('.origin-row').length).toBe(4);
    expect(xin.querySelector('.origin-row.effect-repent .origin-effect').textContent).toBe('補過 +1');
    expect(xin.querySelector('.origin-verdict').textContent).toBe(`帝君語：「${treeData.axes.xin.verdict.bad.repented}」`);
    const ren = [...axes].find((a) => a.querySelector('.origin-part').textContent === '根（仁）');
    expect(ren.querySelectorAll('.origin-row').length).toBe(0);
    expect(ren.textContent).toContain('這一處還沒有紀錄');
    expect(box.querySelectorAll('.origin-row').length).toBe(5);
    const lines = [...box.querySelectorAll('.origin-summary .origin-line')].map((l) => l.textContent);
    expect(lines[0]).toBe('五軸總和 -1 → 樹況・稀疏');
    expect(lines[1]).toBe('悟性值 68 ／ 100 → 蓮台・蓮台半開');
  });
});
