import { describe, it, expect, vi } from 'vitest';
import { createAudio } from '../js/audio.js';

function fakeNode() {
  return { connect(n) { return n; }, start() {}, stop() {},
    frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} },
    gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} },
    type: '', Q: { value: 0 }, buffer: null, loop: false };
}
class FakeAC {
  constructor() { this.created = 0; this.state = 'running'; this.currentTime = 0; this.sampleRate = 8000; this.destination = fakeNode(); }
  createOscillator() { this.created++; return fakeNode(); }
  createGain() { return fakeNode(); }
  createBiquadFilter() { return fakeNode(); }
  createBuffer(ch, len) { return { getChannelData: () => new Float32Array(len) }; }
  createBufferSource() { return fakeNode(); }
  resume() {}
}
function memStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) };
}

describe('audio 模組', () => {
  it('預設開啟；toggle 後關閉並持久化', () => {
    const store = memStorage();
    const a = createAudio({ storage: store, AC: FakeAC });
    expect(a.isEnabled()).toBe(true);
    a.toggle();
    expect(a.isEnabled()).toBe(false);
    expect(store.getItem('heavenTourAudio.v1')).toBe('off');
  });
  it('讀到 off 時初始為靜音，且 tick 不建立節點', () => {
    const store = memStorage({ 'heavenTourAudio.v1': 'off' });
    let built = 0;
    class CountAC extends FakeAC { constructor() { super(); built++; } }
    const a = createAudio({ storage: store, AC: CountAC });
    expect(a.isEnabled()).toBe(false);
    a.tick();
    expect(built).toBe(0);
  });
  it('無 AudioContext 環境下所有發聲函式安全 no-op', () => {
    const a = createAudio({ storage: memStorage(), AC: undefined });
    expect(() => { a.tick(); a.chime(); a.flip(); a.startAmbient(); a.stopAmbient(); a.toggle(); }).not.toThrow();
  });
  it('startAmbient 具冪等性（重複呼叫不疊加）', () => {
    const a = createAudio({ storage: memStorage(), AC: FakeAC });
    a.startAmbient(); a.startAmbient();
    a.stopAmbient();
    expect(() => a.stopAmbient()).not.toThrow();
  });
  it('setScene 切換場景不擲錯，且以新場景參數重建環境音（低通 heaven 620／hell 320）', () => {
    let ac;
    class SpyAC extends FakeAC { // 記錄建立的低通節點以驗證場景參數
      constructor() { super(); ac = this; this.filters = []; }
      createBiquadFilter() { const n = super.createBiquadFilter(); this.filters.push(n); return n; }
    }
    const a = createAudio({ storage: memStorage(), AC: SpyAC });
    a.startAmbient(); // 預設天堂場景
    expect(ac.filters.at(-1).frequency.value).toBe(620);
    expect(() => a.setScene('hell')).not.toThrow();
    expect(ac.filters.at(-1).frequency.value).toBe(320); // 地府：低通壓暗
    a.setScene('heaven');
    expect(ac.filters.at(-1).frequency.value).toBe(620); // 天堂：風聲較清亮
    const built = ac.filters.length;
    a.setScene('heaven'); // 同場景重複呼叫為 no-op，不重建
    expect(ac.filters.length).toBe(built);
    a.stopAmbient();
  });
  it('環境音 12 秒點綴依場景而異：天堂風鈴（sine）／地府鐵鍊（square）', () => {
    vi.useFakeTimers();
    try {
      let ac;
      class SpyAC extends FakeAC { // 記錄振盪器節點以驗證點綴音波形
        constructor() { super(); ac = this; this.oscs = []; }
        createOscillator() { const n = super.createOscillator(); this.oscs.push(n); return n; }
      }
      const a = createAudio({ storage: memStorage(), AC: SpyAC });
      a.startAmbient(); // 預設天堂場景
      vi.advanceTimersByTime(12000);
      expect(ac.oscs.map((o) => o.type)).toEqual(['sine', 'sine', 'sine']); // windChime
      ac.oscs.length = 0;
      a.setScene('hell'); // 重建環境音，計時器換掛 clank
      vi.advanceTimersByTime(12000);
      expect(ac.oscs.map((o) => o.type)).toEqual(['square', 'square', 'square']); // clank
      a.stopAmbient();
    } finally {
      vi.useRealTimers();
    }
  });
});
