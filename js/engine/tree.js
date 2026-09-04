import { AXES, AXIS_LABELS, karmaByAxis } from '../state.js';
import { PROLOGUE_ID } from '../config.js';

// 五常 → 樹的部位（設計 §3.2）
export const AXIS_PARTS = { xin: '幹', ren: '根', zhi: '葉', li: '花', yi: '果' };

// 五軸分數：選擇加總（含權重）＋三官殿懺悔補過 +1（限一軸）
export function axisScores(state) {
  const scores = karmaByAxis(state);
  if (state.repent?.axis && state.repent.axis in scores) scores[state.repent.axis] += 1;
  return scores;
}

export function axisState(score) {
  if (score >= 1) return 'good';
  if (score <= -1) return 'bad';
  return 'flat';
}

export function treeTotal(state) {
  return Object.values(axisScores(state)).reduce((s, v) => s + v, 0);
}

// 樹・善／傷：五軸總和 ≥ 0 為善（陰陽界分流與結局矩陣用）
export function treeVerdict(state) {
  return treeTotal(state) >= 0 ? 'good' : 'bad';
}

// 樹況等級：levels 依 min 遞增排列，取最後一個 total ≥ min 者
export function treeLevel(state, levels) {
  const total = treeTotal(state);
  let hit = levels[0];
  for (const lv of levels) if (total >= lv.min) hit = lv;
  return hit;
}

// 蓮台分級（悟性的介面語言「漸亮／漸大的蓮台」）：tiers 依 min 遞增，取最後一個 wu ≥ min 者
export function lotusTier(wu, tiers) {
  let hit = tiers[0];
  for (const t of tiers) if (wu >= t.min) hit = t;
  return hit;
}

// 序章樹苗葉片數＝序章善選數（微差，不說明）
export function saplingLeaves(state) {
  return state.choices.filter((c) => c.screen === PROLOGUE_ID && c.delta > 0).length;
}

// 讀樹：每軸一段帝君評語；傷者依有無補過取兩版
export function readTree(state, treeData) {
  const scores = axisScores(state);
  return AXES.map((axis) => {
    const st = axisState(scores[axis]);
    const v = treeData.axes[axis].verdict;
    const repented = state.repent?.axis === axis;
    const text = st === 'bad' ? (repented ? v.bad.repented : v.bad.plain) : v[st];
    return { axis, label: AXIS_LABELS[axis], part: AXIS_PARTS[axis], score: scores[axis], state: st, repented, text };
  });
}
