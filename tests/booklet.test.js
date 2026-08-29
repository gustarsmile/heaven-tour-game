import { describe, it, expect } from 'vitest';
import { loadBooklet, addCard } from '../js/booklet.js';

function fakeStorage() {
  const data = {};
  return {
    setItem: (k, v) => { data[k] = String(v); },
    getItem: (k) => (k in data ? data[k] : null),
    removeItem: (k) => { delete data[k]; },
  };
}

describe('善書冊儲存', () => {
  it('初始為空；addCard 累積且去重', () => {
    const st = fakeStorage();
    expect(loadBooklet(st)).toEqual([]);
    addCard('gate', st);
    addCard('donghua', st);
    addCard('gate', st);
    expect(loadBooklet(st)).toEqual(['gate', 'donghua']);
  });
  it('與 run 存檔 key 無關（清 run 存檔不影響冊）', () => {
    const st = fakeStorage();
    addCard('gate', st);
    st.removeItem('heavenTourSave.v1');
    expect(loadBooklet(st)).toEqual(['gate']);
  });
  it('損壞 JSON 或非陣列 → 空陣列', () => {
    const st = fakeStorage();
    st.setItem('heavenTourBooklet.v1', '{oops');
    expect(loadBooklet(st)).toEqual([]);
    st.setItem('heavenTourBooklet.v1', '"x"');
    expect(loadBooklet(st)).toEqual([]);
  });
  it('storage 擲錯不擲錯', () => {
    const boom = {
      setItem() { throw new Error('quota'); },
      getItem() { throw new Error('denied'); },
      removeItem() { throw new Error('denied'); },
    };
    expect(loadBooklet(boom)).toEqual([]);
    expect(() => addCard('gate', boom)).not.toThrow();
  });
});
