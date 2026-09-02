import { safeStorage } from './state.js';

const BOOKLET_KEY = 'heavenTourBooklet.v1'; // 開新局歸零（使用者裁決：歸零比較有動力再完成一次）；續玩保留

export function loadBooklet(storage) {
  try {
    const s = safeStorage(storage);
    const json = s ? s.getItem(BOOKLET_KEY) : null;
    const arr = json ? JSON.parse(json) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function clearBooklet(storage) {
  try {
    const s = safeStorage(storage);
    if (s) s.removeItem(BOOKLET_KEY);
  } catch {
    /* 清除失敗不影響遊玩 */
  }
}

export function addCard(id, storage) {
  const owned = loadBooklet(storage);
  if (!owned.includes(id)) {
    owned.push(id);
    try {
      const s = safeStorage(storage);
      if (s) s.setItem(BOOKLET_KEY, JSON.stringify(owned));
    } catch {
      /* 寫入失敗不影響遊玩 */
    }
  }
  return owned;
}
