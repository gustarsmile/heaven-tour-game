import { finalWu } from '../state.js';
import { readTree, treeLevel, treeTotal, lotusTier } from './tree.js';

// 「樹的來歷」（設計 §3.6）：每筆選擇 → 軸 → 澆灌／持平／損傷；補過另列一筆。
// 陰陽界五段回放、瑤池總覽、善書冊「我的樹」共用這一份，不各算各的。
export const EFFECT = { up: '澆灌', flat: '持平', down: '損傷', repent: '補過' };

function effectOf(value) {
  if (value > 0) return 'up';
  if (value < 0) return 'down';
  return 'flat';
}

// 某一軸的所有選擇（依紀錄順序）＋該軸的補過列（若有）
export function originRows(state, axis, titles = {}) {
  const rows = state.choices
    .filter((c) => c.axis === axis)
    .map((c) => {
      const value = c.delta * c.weight;
      return {
        kind: 'choice', screen: c.screen,
        where: c.label ?? titles[c.screen] ?? c.screen,
        text: c.text, value, effect: effectOf(value),
      };
    });
  if (state.repent?.axis === axis) {
    rows.push({
      kind: 'repent', screen: state.repent.screen,
      where: titles[state.repent.screen] ?? '三官殿',
      text: '地官赦罪：你選擇修枝補過此軸', value: 1, effect: 'repent',
    });
  }
  return rows;
}

// 整棵樹：五軸（AXES 順序，由 readTree 決定）各附症狀、來歷列、帝君評語；末尾總和→樹況、悟性→蓮台
export function treeOrigin(state, treeData, titles = {}) {
  const axes = readTree(state, treeData).map((r) => ({
    ...r,
    symptom: treeData.axes[r.axis].symptom[r.state],
    rows: originRows(state, r.axis, titles),
  }));
  const wu = finalWu(state);
  return {
    axes,
    total: treeTotal(state),
    level: treeLevel(state, treeData.levels),
    wu,
    lotus: lotusTier(wu, treeData.lotus.tiers),
  };
}
