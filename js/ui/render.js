import { enableLightbox } from './lightbox.js';
import { readTree } from '../engine/tree.js';

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

export function artImg(file, className = 'art-banner') {
  const img = el('img', className);
  img.src = `assets/art/${file}`;
  img.alt = '';
  img.decoding = 'async';
  img.loading = className === 'art-banner' ? 'eager' : 'lazy'; // 主圖立即載，避免文字先出圖後跳
  img.addEventListener('error', () => img.remove()); // 資產缺失時優雅降級
  enableLightbox(img);
  return img;
}

// 場景框：主圖放 .scene-art、內容放 .scene-body——窄幕上下疊、寬幕左圖右文
export function sceneFrame(className, artFile) {
  const box = el('div', `${className} framed${artFile ? ' with-art' : ''}`);
  if (artFile) {
    const aside = el('div', 'scene-art');
    aside.appendChild(artImg(artFile));
    box.appendChild(aside);
  }
  const body = el('div', 'scene-body');
  box.appendChild(body);
  return { box, body };
}

export function renderNode(node, handlers, root, opts = {}) {
  root.innerHTML = '';
  const { box, body } = sceneFrame('scene-box', opts.art);
  if (node.speaker) body.appendChild(el('div', 'speaker', node.speaker));
  body.appendChild(el('p', 'text', node.text));
  if (node.img) body.appendChild(artImg(node.img, 'art-figure'));
  if (node.type === 'line') {
    const btn = el('button', 'btn btn-next', '繼續 ▸');
    btn.addEventListener('click', handlers.onAdvance);
    body.appendChild(btn);
  } else if (node.type === 'choice') {
    const list = el('div', 'choices');
    node.choices.forEach((c, i) => {
      const btn = el('button', 'btn btn-choice', c.text);
      btn.addEventListener('click', () => handlers.onChoose(i));
      list.appendChild(btn);
    });
    body.appendChild(list);
  }
  root.appendChild(box);
}

// 共用視圖輔助：見聞／看樹／結算三種畫面都用得到的「繼續」鈕、逐句文字、樹況評語列表
export function appendNext(box, label, onClick) {
  const btn = el('button', 'btn btn-next', label);
  btn.addEventListener('click', onClick);
  box.appendChild(btn);
}

export function appendLines(box, lines) {
  for (const l of lines) {
    if (l.speaker) box.appendChild(el('div', 'speaker', l.speaker));
    box.appendChild(el('p', 'text', l.text));
    if (l.img) box.appendChild(artImg(l.img, 'art-figure'));
  }
}

export function appendTreeVerdicts(box, state, treeData) {
  const list = el('div', 'tree-verdicts');
  for (const r of readTree(state, treeData)) {
    const item = el('div', `tree-verdict verdict-${r.state}`);
    item.appendChild(el('div', 'verdict-part', `${r.part}・${r.label}`));
    item.appendChild(el('p', 'verdict-text', r.text));
    list.appendChild(item);
  }
  box.appendChild(list);
}

export function renderError(err, onRetry, root) {
  root.innerHTML = '';
  const box = el('div', 'scene-box');
  box.appendChild(el('div', 'speaker', '系統'));
  box.appendChild(el('p', 'text', '劇情資料載入失敗。請透過網頁伺服器開啟本遊戲（不要直接雙擊 index.html），或重新整理再試一次。'));
  box.appendChild(el('p', 'hint', String(err)));
  const btn = el('button', 'btn btn-next', '重新開始');
  btn.addEventListener('click', onRetry);
  box.appendChild(btn);
  root.appendChild(box);
}
