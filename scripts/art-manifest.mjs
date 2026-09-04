// 階段 1＋2＋3 美術清單：tests/art.test.js 守門、scripts/placeholder-art.mjs 補占位圖共用
export const ART_MANIFEST = [
  'cover', 'share-bg', 'jigong-main',
  'prologue-scene', 'interlude-night', 'interlude-lotus',
  'tree-sapling', 'gate-scene', 'donghua-scene',
  'case-1', 'case-2', 'case-3', 'case-4',
  'tree-1', 'tree-2', 'tree-3', 'tree-4', 'tree-5',
  'yaochi-scene',
  'sanqinghe-scene', 'nanhua-scene', 'xihua-scene', 'beihua-scene', 'zhonghua-scene',
  'kongzi-scene', 'shijia-scene', 'guanyin-scene', 'zhongyi-scene', 'xiaozi-scene', 'baxian-scene',
  'sanguan-scene', 'yinyang-scene',
].map((n) => `${n}.webp`);
