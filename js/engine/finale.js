import { WU_THRESHOLD, PROLOGUE_ID } from '../config.js';
import { finalWu } from '../state.js';
import { treeVerdict } from './tree.js';

// 瑤池結算（階段 1 簡易版）：悟性公布 → 看樹 → 評語 → 稱號卡
const PHASES = ['wu', 'tree', 'ending', 'done'];

export function createFinale(data, state, treeData) {
  return { data, state, treeData, phases: [...PHASES], phase: 'wu' };
}

export function nextFinalePhase(finale) {
  const i = finale.phases.indexOf(finale.phase);
  finale.phase = finale.phases[Math.min(i + 1, finale.phases.length - 1)];
  return finale.phase;
}

export function prevFinalePhase(finale) {
  const i = finale.phases.indexOf(finale.phase);
  if (i > 0) finale.phase = finale.phases[i - 1];
  return finale.phase;
}

// 四象限（設計 §3.5）：悟性 ≥ 70 為高 × 樹況善／傷
export function endingKey(state) {
  const high = finalWu(state) >= WU_THRESHOLD;
  const good = treeVerdict(state) === 'good';
  if (high) return good ? 'highGood' : 'highBad';
  return good ? 'lowGood' : 'lowBad';
}

export function prologueReplay(state) {
  return state.choices.filter((c) => c.screen === PROLOGUE_ID);
}

export function worstPrologueChoice(state) {
  return prologueReplay(state).find((c) => c.delta < 0) ?? null;
}

// 「知而未行」「再世重修」結語引用序章具體選擇
export function endingQuote(ending, state) {
  if (!ending.quote) return null;
  const worst = worstPrologueChoice(state);
  if (!worst) return ending.quoteFallback ?? null;
  return ending.quote
    .replaceAll('{label}', worst.label ?? '陽間那一日')
    .replaceAll('{text}', worst.text);
}
