// WebAudio 程序化音效：木魚（點擊）、磬（答對）、翻頁（收卡）、環境音（天堂風＋風鈴）
// 零音檔資產；無 AudioContext（測試環境、老瀏覽器）時全部靜默 no-op。
const KEY = 'heavenTourAudio.v1';

function safeStorage(storage) {
  if (storage !== undefined) return storage;
  try { return globalThis.localStorage; } catch { return null; }
}

export function createAudio({ storage, AC = globalThis.AudioContext } = {}) {
  const store = safeStorage(storage);
  let enabled = true;
  try { enabled = store?.getItem(KEY) !== 'off'; } catch { /* 忽略 */ }
  let ctx = null;
  let ambient = null;

  function persist() {
    try { store?.setItem(KEY, enabled ? 'on' : 'off'); } catch { /* 忽略 */ }
  }
  function ensureCtx() {
    if (!enabled || !AC) return null;
    if (!ctx) { try { ctx = new AC(); } catch { return null; } }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function env(g, t0, peak, decay) {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
  }

  function tick() { // 木魚：短促下滑三角波
    const c = ensureCtx(); if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(880, t);
    o.frequency.exponentialRampToValueAtTime(440, t + 0.08);
    env(g, t, 0.22, 0.09);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + 0.12);
  }

  function chime() { // 磬：親子版改為明亮風鈴——C6/E6/G6 快速琶音，衰減縮短去除空靈陰森感
    const c = ensureCtx(); if (!c) return;
    const t = c.currentTime;
    for (const [freq, peak, delay] of [[1046.5, 0.09, 0], [1318.5, 0.07, 0.06], [1568, 0.05, 0.12]]) {
      const o = c.createOscillator(); const g = c.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      env(g, t + delay, peak, 0.9);
      o.connect(g).connect(c.destination);
      o.start(t + delay); o.stop(t + delay + 1);
    }
  }

  function flip() { // 翻頁：帶通白噪短刷
    const c = ensureCtx(); if (!c) return;
    const len = Math.max(1, Math.floor(c.sampleRate * 0.18));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2800; f.Q.value = 0.8;
    const g = c.createGain(); g.gain.value = 0.12;
    src.connect(f).connect(g).connect(c.destination);
    src.start(c.currentTime);
  }

  function windChime() { // 天堂環境點綴：一串輕風鈴（G6-C7-A6）
    const c = ensureCtx(); if (!c) return;
    const t = c.currentTime;
    for (const [freq, peak, delay] of [[1568, 0.03, 0], [2093, 0.02, 0.18], [1760, 0.025, 0.36]]) {
      const o = c.createOscillator(); const g = c.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      env(g, t + delay, peak, 1.2);
      o.connect(g).connect(c.destination);
      o.start(t + delay); o.stop(t + delay + 1.3);
    }
  }

  function startAmbient() {
    const c = ensureCtx(); if (!c || ambient) return;
    // 風：棕噪音循環過低通
    const len = Math.max(1, Math.floor(c.sampleRate * 4));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { last = (last + (Math.random() * 2 - 1) * 0.02) * 0.995; d[i] = last * 3; }
    const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 620; // 天堂風聲較清亮
    const g = c.createGain(); g.gain.value = 0.035;
    src.connect(lp).connect(g).connect(c.destination);
    src.start();
    const timer = setInterval(windChime, 12000); // 天堂風鈴點綴
    ambient = { src, timer };
  }

  function stopAmbient() {
    if (!ambient) return;
    try { ambient.src.stop(); } catch { /* 忽略 */ }
    clearInterval(ambient.timer);
    ambient = null;
  }

  function toggle() {
    enabled = !enabled;
    persist();
    if (!enabled) stopAmbient(); else startAmbient();
    return enabled;
  }

  return { tick, chime, flip, startAmbient, stopAmbient, toggle, isEnabled: () => enabled };
}
