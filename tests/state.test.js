import { describe, it, expect } from 'vitest';
import {
  AXES, AXIS_LABELS, createState, creditWu, resetScreen, rawWu, recordChoice, setRepent,
  karmaSum, karmaByAxis, karmaPenalty, finalWu,
  serialize, deserialize, save, load, clearSave,
} from '../js/state.js';
import { KARMA_PENALTY } from '../js/config.js';

function fakeStorage() {
  const data = {};
  return {
    setItem: (k, v) => { data[k] = String(v); },
    getItem: (k) => (k in data ? data[k] : null),
    removeItem: (k) => { delete data[k]; },
  };
}

describe('state 基本結構', () => {
  it('初始狀態：無得分、無選擇、無補過、畫面 prologue、預設完整模式', () => {
    const s = createState();
    expect(s.wuByScreen).toEqual({});
    expect(s.choices).toEqual([]);
    expect(s.repent).toBeNull();
    expect(s.progress.screen).toBe('prologue');
    expect(s.mode).toBe('full');
    expect(s.wuMax).toBe(0);
  });
  it('五常五軸鍵名與標籤固定', () => {
    expect(AXES).toEqual(['ren', 'yi', 'li', 'zhi', 'xin']);
    expect(AXIS_LABELS).toEqual({ ren: '仁', yi: '義', li: '禮', zhi: '智', xin: '信' });
  });
});

describe('分站計分', () => {
  it('creditWu 分站累加，rawWu 加總', () => {
    const s = createState();
    creditWu(s, 'gate', 5);
    creditWu(s, 'gate', 5);
    creditWu(s, 'donghua', 20);
    expect(s.wuByScreen).toEqual({ gate: 10, donghua: 20 });
    expect(rawWu(s)).toBe(30);
  });
  it('resetScreen 清該站得分、選擇與該站的補過（重玩不灌分）', () => {
    const s = createState();
    creditWu(s, 'gate', 5);
    creditWu(s, 'donghua', 5);
    recordChoice(s, { screen: 'gate', scene: 'gate', text: 'a', axis: 'li', delta: -1 });
    recordChoice(s, { screen: 'donghua', scene: 'donghua', text: 'b', axis: 'ren', delta: 1 });
    setRepent(s, 'li', 'sanguan');
    resetScreen(s, 'gate');
    expect(rawWu(s)).toBe(5);
    expect(s.choices.map((c) => c.screen)).toEqual(['donghua']);
    expect(s.repent).toEqual({ axis: 'li', screen: 'sanguan' });
    resetScreen(s, 'sanguan');
    expect(s.repent).toBeNull();
  });
});

describe('悟性值 finalWu（正規化＋心性扣分）', () => {
  it('依 wuMax 折算百分制', () => {
    const s = createState();
    s.wuMax = 45;
    creditWu(s, 'x', 45);
    expect(finalWu(s)).toBe(100);
    resetScreen(s, 'x');
    creditWu(s, 'x', 30);
    expect(finalWu(s)).toBe(67); // round(30/45*100)
  });
  it('每筆惡選依權重扣分；補過不退還扣分', () => {
    const s = createState();
    s.wuMax = 100;
    creditWu(s, 'x', 100);
    recordChoice(s, { screen: 'prologue', scene: 'prologue', text: 'a', axis: 'xin', delta: -1, weight: 2 });
    recordChoice(s, { screen: 'gate', scene: 'gate', text: 'b', axis: 'li', delta: -1 });
    expect(karmaPenalty(s)).toBe(3 * KARMA_PENALTY);
    setRepent(s, 'xin', 'sanguan');
    expect(karmaPenalty(s)).toBe(3 * KARMA_PENALTY);
    expect(finalWu(s)).toBe(100 - 3 * KARMA_PENALTY);
  });
  it('下限 0、上限 100；wuMax 未設時直接取 rawWu 封頂', () => {
    const s = createState();
    s.wuMax = 10;
    creditWu(s, 'x', 1);
    for (let i = 0; i < 10; i++) {
      recordChoice(s, { screen: 'p', scene: 'p', text: 'a', axis: 'ren', delta: -1, weight: 2 });
    }
    expect(finalWu(s)).toBe(0);
    const t = createState();
    creditWu(t, 'x', 120);
    expect(finalWu(t)).toBe(100);
  });
});

describe('五軸心性（由選擇推導）', () => {
  it('karmaByAxis 五軸齊備、含權重；karmaSum 加總；不含補過', () => {
    const s = createState();
    recordChoice(s, { screen: 'prologue', scene: 'prologue', text: 'a', axis: 'ren', delta: 1, weight: 2 });
    recordChoice(s, { screen: 'gate', scene: 'gate', text: 'b', axis: 'li', delta: -1 });
    setRepent(s, 'li', 'sanguan');
    expect(karmaByAxis(s)).toEqual({ ren: 2, yi: 0, li: -1, zhi: 0, xin: 0 });
    expect(karmaSum(s)).toBe(1);
  });
  it('recordChoice／setRepent 拒絕未知心性軸', () => {
    const s = createState();
    expect(() => recordChoice(s, { screen: 'x', scene: 'x', text: 't', axis: 'honesty', delta: 1 })).toThrow(/未知的心性軸/);
    expect(() => setRepent(s, 'luck', 'sanguan')).toThrow(/未知的心性軸/);
  });
  it('recordChoice 追加，label/weight 有預設值', () => {
    const s = createState();
    recordChoice(s, { screen: 'prologue', scene: 'prologue', label: '清晨・隔壁的信箱', text: '敲敲門', axis: 'ren', delta: 1, weight: 2 });
    recordChoice(s, { screen: 'gate', scene: 'gate', text: '見怪', axis: 'li', delta: -1 });
    expect(s.choices[0].weight).toBe(2);
    expect(s.choices[1]).toEqual({ screen: 'gate', scene: 'gate', label: null, text: '見怪', axis: 'li', delta: -1, weight: 1 });
  });
});

describe('存讀檔', () => {
  it('serialize/deserialize 往返（含 repent）', () => {
    const s = createState('lite');
    creditWu(s, 'gate', 5);
    recordChoice(s, { screen: 'prologue', scene: 'prologue', text: 'x', axis: 'xin', delta: 1, weight: 2 });
    setRepent(s, 'xin', 'sanguan');
    s.progress.screen = 'gate';
    expect(deserialize(serialize(s))).toEqual(s);
  });
  it('舊格式無 choices／repent 補預設；損壞型別補預設', () => {
    const legacy = JSON.parse(serialize(createState()));
    delete legacy.choices;
    delete legacy.repent;
    const r = deserialize(JSON.stringify(legacy));
    expect(r.choices).toEqual([]);
    expect(r.repent).toBeNull();
    legacy.choices = 'oops';
    legacy.repent = 'oops';
    const r2 = deserialize(JSON.stringify(legacy));
    expect(r2.choices).toEqual([]);
    expect(r2.repent).toBeNull();
  });
  it('wuByScreen 損壞型別／內含非數值項目時，deserialize 清成乾淨物件，finalWu 仍為數字', () => {
    const legacy = JSON.parse(serialize(createState()));
    legacy.wuByScreen = 'oops';
    const r = deserialize(JSON.stringify(legacy));
    expect(r.wuByScreen).toEqual({});
    expect(typeof finalWu(r)).toBe('number');

    const legacy2 = JSON.parse(serialize(createState()));
    legacy2.wuByScreen = { gate: 5, donghua: 'oops', bad: NaN };
    const r2 = deserialize(JSON.stringify(legacy2));
    expect(r2.wuByScreen).toEqual({ gate: 5 });
    expect(typeof finalWu(r2)).toBe('number');
  });
  it('save/load 經 storage 往返，無檔回 null；鍵為 heavenTourSave.v1', () => {
    const st = fakeStorage();
    expect(load(st)).toBeNull();
    const s = createState();
    creditWu(s, 'gate', 5);
    save(s, st);
    expect(st.getItem('heavenTourSave.v1')).not.toBeNull();
    expect(load(st)).toEqual(s);
    clearSave(st);
    expect(load(st)).toBeNull();
  });
  it('load 讀到損壞 JSON 回 null 並清除存檔；地獄篇舊鍵不理會', () => {
    const st = fakeStorage();
    st.setItem('heavenTourSave.v1', '{oops');
    st.setItem('hellTourSave.v3', JSON.stringify(createState()));
    expect(load(st)).toBeNull();
    expect(st.getItem('heavenTourSave.v1')).toBeNull();
  });
  it('storage 擲錯時 save/load/clearSave 不擲錯', () => {
    const boom = {
      setItem() { throw new Error('quota'); },
      getItem() { throw new Error('denied'); },
      removeItem() { throw new Error('denied'); },
    };
    expect(() => save(createState(), boom)).not.toThrow();
    expect(load(boom)).toBeNull();
    expect(() => clearSave(boom)).not.toThrow();
  });
});
