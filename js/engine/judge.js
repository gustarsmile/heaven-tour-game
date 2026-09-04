import { AXES } from '../state.js';
import { readTree } from './tree.js';

// 三官殿考核（設計 §3.3 ★③）：地官赦罪的可補過軸、水官解厄的「還能補的站」

// 遞迴掃描站點資料，找出所有會寫入五軸的選項（scene choice、visit mercy、branch scene）
export function axesOf(value, out = new Set()) {
  if (Array.isArray(value)) {
    value.forEach((v) => axesOf(v, out));
  } else if (value && typeof value === 'object') {
    if (value.karma && AXES.includes(value.karma.axis)) out.add(value.karma.axis);
    Object.values(value).forEach((v) => axesOf(v, out));
  }
  return out;
}

// 目前站之後、還會寫入五軸的站（依當前模式清單）
export function remainingAmends(modeList, resources, currentId) {
  const idx = modeList.findIndex((s) => s.id === currentId);
  return modeList.slice(idx + 1)
    .map((s) => {
      const d = resources[s.id];
      const found = axesOf(d);
      return { id: s.id, title: d?.menuTitle ?? d?.title ?? s.id, axes: AXES.filter((a) => found.has(a)) };
    })
    .filter((r) => r.axes.length > 0);
}

// 地官赦罪：只有「傷」軸可補；附該軸最重的一筆惡選，讓玩家對著具體的事低頭
export function repentOptions(state, treeData) {
  return readTree(state, treeData)
    .filter((r) => r.state === 'bad')
    .map((r) => {
      const worst = state.choices
        .filter((c) => c.axis === r.axis && c.delta < 0)
        .sort((a, b) => a.delta * a.weight - b.delta * b.weight)[0] ?? null;
      return { axis: r.axis, label: r.label, part: r.part, score: r.score, worstText: worst?.text ?? null };
    });
}
