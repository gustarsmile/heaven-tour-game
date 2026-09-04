import { describe, it, expect } from 'vitest';
import { WU_THRESHOLD, KARMA_PENALTY, PROLOGUE_ID } from '../js/config.js';
import { createState, creditWu, recordChoice, setRepent, finalWu } from '../js/state.js';
import {
  createFinale, nextFinalePhase, prevFinalePhase, endingKey,
  prologueReplay, worstPrologueChoice, endingQuote,
} from '../js/engine/finale.js';
import treeData from '../js/data/tree.json';

// wuMax=100 讓 rawWu 直接等於折算分，惡選另扣 KARMA_PENALTY×權重
function stateWith(wu, karmaDelta) {
  const s = createState();
  s.wuMax = 100;
  creditWu(s, 'x', wu);
  if (karmaDelta) recordChoice(s, { screen: 'gate', scene: 'gate', text: 'x', axis: 'li', delta: karmaDelta });
  return s;
}

describe('四象限結局判定（悟性 × 樹況）', () => {
  it('門檻為 70', () => expect(WU_THRESHOLD).toBe(70));
  it('悟性 70／樹善 → highGood；69 → lowGood', () => {
    expect(endingKey(stateWith(70, 0))).toBe('highGood');
    expect(endingKey(stateWith(69, 0))).toBe('lowGood');
  });
  it('五軸總和負 → Bad 象限，且惡選扣悟性', () => {
    expect(finalWu(stateWith(70 + KARMA_PENALTY, -1))).toBe(70);
    expect(endingKey(stateWith(70 + KARMA_PENALTY, -1))).toBe('highBad');
    expect(endingKey(stateWith(69, -1))).toBe('lowBad');
  });
  it('三官殿補過可把樹況從傷翻回善（不退還悟性扣分）', () => {
    const s = stateWith(100, -1);
    expect(endingKey(s)).toBe('highBad');
    setRepent(s, 'li', 'sanguan');
    expect(endingKey(s)).toBe('highGood');
    expect(finalWu(s)).toBe(100 - KARMA_PENALTY);
  });
});

describe('結算階段機', () => {
  it('award→tree→ending→origin→done 到底停住；prev 可回退且首階段停住；treeData／titles 掛在 finale 上', () => {
    const f = createFinale({}, createState(), treeData, { gate: '南天門' });
    expect(f.phase).toBe('award');
    expect(f.treeData).toBe(treeData);
    expect(f.titles).toEqual({ gate: '南天門' });
    for (const expected of ['tree', 'ending', 'origin', 'done', 'done']) expect(nextFinalePhase(f)).toBe(expected);
    expect(prevFinalePhase(f)).toBe('origin');
    const g = createFinale({}, createState(), treeData);
    expect(prevFinalePhase(g)).toBe('award');
    expect(g.titles).toEqual({});
  });
});

describe('序章回放與結語引用', () => {
  function journeyState() {
    const s = createState();
    recordChoice(s, { screen: PROLOGUE_ID, scene: PROLOGUE_ID, label: '清晨・隔壁的信箱', text: '敲敲門', axis: 'ren', delta: 1, weight: 2 });
    recordChoice(s, { screen: PROLOGUE_ID, scene: PROLOGUE_ID, label: '晚上・上週的承諾', text: '我臨時有事', axis: 'xin', delta: -1, weight: 2 });
    recordChoice(s, { screen: 'gate', scene: 'gate', text: '見怪', axis: 'li', delta: -1 });
    return s;
  }
  it('prologueReplay 只取序章、依序', () => {
    expect(prologueReplay(journeyState()).map((c) => c.axis)).toEqual(['ren', 'xin']);
  });
  it('worstPrologueChoice 取序章第一筆惡選；全善回 null', () => {
    expect(worstPrologueChoice(journeyState()).text).toBe('我臨時有事');
    const good = createState();
    recordChoice(good, { screen: PROLOGUE_ID, scene: PROLOGUE_ID, text: 'x', axis: 'ren', delta: 1, weight: 2 });
    expect(worstPrologueChoice(good)).toBeNull();
  });
  it('endingQuote：代入 label/text；無惡選用 fallback；無 quote 回 null', () => {
    const ending = { quote: '{label}——你選的是「{text}」。', quoteFallback: '陽間那日你走得端正。' };
    expect(endingQuote(ending, journeyState())).toBe('晚上・上週的承諾——你選的是「我臨時有事」。');
    const good = createState();
    recordChoice(good, { screen: PROLOGUE_ID, scene: PROLOGUE_ID, text: 'x', axis: 'ren', delta: 1, weight: 2 });
    expect(endingQuote(ending, good)).toBe('陽間那日你走得端正。');
    expect(endingQuote({ title: 't' }, journeyState())).toBeNull();
  });
});
