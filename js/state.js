import { WU_CAP, KARMA_PENALTY, PROLOGUE_ID, DEFAULT_MODE } from './config.js';

// 五常五軸（設計 §3.2）：仁→根、義→果、禮→花、智→葉、信→幹
export const AXES = ['ren', 'yi', 'li', 'zhi', 'xin'];
export const AXIS_LABELS = { ren: '仁', yi: '義', li: '禮', zhi: '智', xin: '信' };

const SAVE_KEY = 'heavenTourSave.v1';

export function createState(mode = DEFAULT_MODE) {
  return {
    mode,
    wuMax: 0, // 該模式滿分，流程層依畫面清單推算（每次啟動重算，不信任舊存檔）
    wuByScreen: {},
    choices: [],
    repent: null, // 三官殿懺悔補過：{ axis, screen }，限一次
    progress: { screen: PROLOGUE_ID },
  };
}

// 分站記分：重玩／跳站時整站重置再重算，杜絕重複灌分
export function creditWu(state, screenId, pts) {
  state.wuByScreen[screenId] = (state.wuByScreen[screenId] ?? 0) + pts;
  return state.wuByScreen[screenId];
}

export function resetScreen(state, screenId) {
  delete state.wuByScreen[screenId];
  state.choices = state.choices.filter((c) => c.screen !== screenId);
  if (state.repent?.screen === screenId) state.repent = null;
}

export function rawWu(state) {
  return Object.values(state.wuByScreen).reduce((s, v) => s + v, 0);
}

function assertAxis(axis) {
  if (!AXES.includes(axis)) throw new Error(`未知的心性軸：${axis}`);
}

export function recordChoice(state, { screen, scene, label = null, text, axis, delta, weight = 1 }) {
  assertAxis(axis);
  state.choices.push({ screen, scene, label, text, axis, delta, weight });
}

export function setRepent(state, axis, screen) {
  assertAxis(axis);
  state.repent = { axis, screen };
}

// 五軸分數（只算選擇；補過 +1 由 engine/tree.js 的 axisScores 加上）
export function karmaByAxis(state) {
  const karma = Object.fromEntries(AXES.map((a) => [a, 0]));
  for (const c of state.choices) karma[c.axis] += c.delta * c.weight;
  return karma;
}

export function karmaSum(state) {
  return state.choices.reduce((s, c) => s + c.delta * c.weight, 0);
}

// 心性扣分：每一筆惡選依權重扣 KARMA_PENALTY 分（序章權重 2 → 一筆扣 8）；補過不退還
export function karmaPenalty(state) {
  return state.choices
    .filter((c) => c.delta < 0)
    .reduce((s, c) => s + Math.abs(c.delta) * c.weight * KARMA_PENALTY, 0);
}

// 悟性值＝答題得分佔該模式滿分的百分比，再扣心性分
export function finalWu(state) {
  const raw = rawWu(state);
  const scaled = state.wuMax > 0 ? Math.round((raw / state.wuMax) * WU_CAP) : Math.min(raw, WU_CAP);
  return Math.max(0, Math.min(WU_CAP, scaled - karmaPenalty(state)));
}

export function serialize(state) {
  return JSON.stringify(state);
}

// 存檔可能來自舊版或被竄改；只留下值為有限數字的分站分數，避免壞資料讓悟性值算出 NaN
function sanitizeWuByScreen(wuByScreen) {
  const clean = {};
  if (wuByScreen && typeof wuByScreen === 'object') {
    for (const [id, v] of Object.entries(wuByScreen)) {
      if (Number.isFinite(v)) clean[id] = v;
    }
  }
  return clean;
}

export function deserialize(json) {
  const raw = JSON.parse(json);
  const base = createState(raw.mode);
  const repentOk = raw.repent && typeof raw.repent === 'object' && AXES.includes(raw.repent.axis);
  return {
    ...base,
    ...raw,
    wuByScreen: sanitizeWuByScreen(raw.wuByScreen),
    choices: Array.isArray(raw.choices) ? raw.choices : [],
    repent: repentOk ? { axis: raw.repent.axis, screen: raw.repent.screen ?? null } : null,
    progress: { ...base.progress, ...(raw.progress ?? {}) },
  };
}

export function safeStorage(storage) {
  if (storage !== undefined) return storage;
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export function save(state, storage) {
  try {
    const s = safeStorage(storage);
    if (s) s.setItem(SAVE_KEY, serialize(state));
  } catch {
    /* 存檔失敗不影響遊玩 */
  }
}

export function load(storage) {
  try {
    const s = safeStorage(storage);
    if (!s) return null;
    const json = s.getItem(SAVE_KEY);
    return json ? deserialize(json) : null;
  } catch {
    clearSave(storage);
    return null;
  }
}

export function clearSave(storage) {
  try {
    const s = safeStorage(storage);
    if (s) s.removeItem(SAVE_KEY);
  } catch {
    /* 忽略 */
  }
}
