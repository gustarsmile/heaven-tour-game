import { describe, it, expect } from 'vitest';
import { axesOf, remainingAmends, repentOptions } from '../js/engine/judge.js';
import { createState, recordChoice, setRepent } from '../js/state.js';
import treeData from '../js/data/tree.json';
import xiaozi from '../js/data/xiaozi.json';
import baxian from '../js/data/baxian.json';
import kongzi from '../js/data/kongzi.json';
import zhonghua from '../js/data/zhonghua.json';

describe('axesOf', () => {
  it('scene 抉擇、visit mercy、branch scene 都掃得到；無抉擇站為空', () => {
    expect([...axesOf(xiaozi)].sort()).toEqual(['ren', 'xin', 'yi']);
    expect([...axesOf(baxian)]).toEqual(['zhi']);
    expect([...axesOf(zhonghua)]).toEqual(['xin']);
    expect(axesOf(kongzi).size).toBe(0);
  });
});

describe('remainingAmends', () => {
  const list = [{ id: 'a' }, { id: 'sanguan' }, { id: 'kongzi' }, { id: 'xiaozi' }, { id: 'baxian' }];
  const resources = { kongzi, xiaozi, baxian };
  it('只列目前站之後、會寫五軸的站；軸依 AXES 順序；title 取 menuTitle', () => {
    expect(remainingAmends(list, resources, 'sanguan')).toEqual([
      { id: 'xiaozi', title: xiaozi.menuTitle, axes: ['ren', 'yi', 'xin'] },
      { id: 'baxian', title: baxian.menuTitle, axes: ['zhi'] },
    ]);
  });
  it('之後無可補之站 → 空陣列', () => {
    expect(remainingAmends(list, resources, 'baxian')).toEqual([]);
  });
  it('currentId 不在清單 → 回空陣列（不回整張清單）', () => {
    expect(remainingAmends(list, resources, 'not-a-screen')).toEqual([]);
  });
});

describe('repentOptions', () => {
  function stateWith(entries) {
    const s = createState();
    for (const [axis, delta, weight = 1, text = 't'] of entries) {
      recordChoice(s, { screen: 'p', scene: 'p', text, axis, delta, weight });
    }
    return s;
  }
  it('只列傷軸（AXES 順序），附最重的一筆惡選文字', () => {
    const s = stateWith([['xin', -1, 1, '直接出門'], ['xin', -1, 2, '我臨時有事'], ['ren', 1, 2], ['li', 0], ['zhi', -1, 1, '隨便掰']]);
    expect(repentOptions(s, treeData)).toEqual([
      { axis: 'zhi', label: '智', part: '葉', score: -1, worstText: '隨便掰' },
      { axis: 'xin', label: '信', part: '幹', score: -3, worstText: '我臨時有事' },
    ]);
  });
  it('已補過的軸（−1 補成 0 為平）不再列出；無傷軸為空', () => {
    const s = stateWith([['li', -1]]);
    expect(repentOptions(s, treeData).map((o) => o.axis)).toEqual(['li']);
    setRepent(s, 'li', 'sanguan');
    expect(repentOptions(s, treeData)).toEqual([]);
    expect(repentOptions(stateWith([['ren', 1]]), treeData)).toEqual([]);
  });
});
