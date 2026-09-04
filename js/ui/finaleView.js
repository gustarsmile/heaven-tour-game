import {
  el, sceneFrame, appendNext, appendLines, appendTreeVerdicts,
} from './render.js';
import { endingKey, endingQuote } from '../engine/finale.js';
import { finalWu, rawWu, karmaPenalty } from '../state.js';
import { treeLevel, lotusTier } from '../engine/tree.js';
import { treeOrigin } from '../engine/origin.js';
import { appendTreeOrigin } from './originView.js';
import { GAME_TITLE, GAME_URL } from '../config.js';

const LOTUS_ART = 'interlude-lotus.webp'; // 載你一路來的那一朵蓮台（過場圖）

// 主圖：頒賞＝蓮台；看樹／來歷／結尾＝你的樹；稱號評語＝瑤池殿景
function artFor(finale, level) {
  if (finale.phase === 'award') return LOTUS_ART;
  if (['tree', 'origin', 'done'].includes(finale.phase)) return level.art;
  return finale.data.art?.scene;
}

// 蓮台依悟性增大（設計 §3.3 ★④）：分級文字＋依 scale 放大的光暈
function appendLotus(box, wu, tiers) {
  const tier = lotusTier(wu, tiers);
  const lotus = el('div', 'lotus');
  lotus.dataset.tier = tier.label;
  const bloom = el('div', 'lotus-bloom');
  bloom.dataset.scale = String(tier.scale);
  bloom.style.setProperty('--lotus-scale', String(tier.scale));
  lotus.appendChild(bloom);
  lotus.appendChild(el('div', 'lotus-tier', `蓮台・${tier.label}`));
  box.appendChild(lotus);
}

export function renderFinalePhase(finale, handlers, root) {
  root.innerHTML = '';
  const d = finale.data;
  const s = finale.state;
  const level = treeLevel(s, finale.treeData.levels);
  const frame = sceneFrame('scene-box finale-box', artFor(finale, level));
  const box = frame.body;
  box.appendChild(el('div', 'hall-title', d.title));

  if (finale.phase === 'award') {
    appendLines(box, d.award.lines);
    const wu = finalWu(s);
    appendLotus(box, wu, finale.treeData.lotus.tiers);
    box.appendChild(el('p', 'wu-score', `悟性值 ${wu} ／ 100`));
    const pen = karmaPenalty(s);
    const detail = `答題修行 ${rawWu(s)}／${s.wuMax} 分${pen > 0 ? `，心性有虧扣 ${pen} 分` : '，心性無虧'}`;
    box.appendChild(el('p', 'hint wu-detail', detail));
    box.appendChild(el('p', 'hint', d.award.note));
    appendNext(box, '看樹 ▸', handlers.onNextPhase);
  } else if (finale.phase === 'tree') {
    appendLines(box, d.tree.lines);
    box.appendChild(el('div', 'tree-level', `樹況・${level.label}`));
    box.appendChild(el('p', 'text', level.line));
    appendTreeVerdicts(box, s, finale.treeData);
    appendNext(box, '聽評 ▸', handlers.onNextPhase);
  } else if (finale.phase === 'ending') {
    const e = d.endings[endingKey(s)];
    box.appendChild(el('div', 'card-title', '評 語'));
    box.appendChild(el('p', 'ending-title', e.title));
    appendLines(box, e.comment);
    const quote = endingQuote(e, s);
    if (quote) box.appendChild(el('p', 'ending-quote', quote));
    appendNext(box, '這棵樹是怎麼長成的？ ▸', handlers.onNextPhase);
  } else if (finale.phase === 'origin') {
    box.appendChild(el('div', 'card-title', '樹 的 來 歷'));
    appendLines(box, d.origin.lines);
    appendTreeOrigin(box, treeOrigin(s, finale.treeData, finale.titles));
    box.appendChild(el('p', 'hint', d.origin.note));
    appendNext(box, '領受 ▸', handlers.onNextPhase);
  } else if (finale.phase === 'done') {
    frame.box.classList.add('finale-end'); // finale-end：無樣式，供 autoplay／測試辨識結局畫面
    const e = d.endings[endingKey(s)];
    box.appendChild(el('div', 'card-title', '此 行 評 語'));
    box.appendChild(el('p', 'ending-title', e.title));
    box.appendChild(el('p', 'wu-score', `悟性值 ${finalWu(s)} ／ 100`));
    box.appendChild(el('div', 'tree-level', `樹況・${level.label}`));
    box.appendChild(el('p', 'card-lesson', `「${e.motto}」`));
    appendLines(box, d.done.lines);
    if (d.source) {
      const a = el('a', 'card-source', `結算取材：${d.source.label}`);
      a.href = d.source.url;
      a.target = '_blank';
      a.rel = 'noopener';
      box.appendChild(a);
    }
    const share = el('button', 'btn btn-choice', '生成稱號分享卡');
    share.addEventListener('click', handlers.onShare);
    const bk = el('button', 'btn btn-choice', '翻閱善書冊');
    bk.addEventListener('click', handlers.onBooklet);
    const re = el('button', 'btn btn-choice', '重新開始');
    re.addEventListener('click', handlers.onRestart);
    box.appendChild(share);
    box.appendChild(bk);
    box.appendChild(re);
  }
  root.appendChild(frame.box);
}

// 分享卡輸出：優先走系統分享面板（手機原生「分享」），其次 blob 下載，最後長按儲存
export function renderShareOverlay(canvas, payload, onBack, root) {
  root.innerHTML = '';
  const box = el('div', 'scene-box share-box');
  box.appendChild(el('div', 'card-title', '稱 號 分 享 卡'));
  if (!canvas) {
    box.appendChild(el('p', 'text', '此瀏覽器不支援圖片合成，無法生成分享卡。'));
  } else {
    canvas.className = 'share-canvas';
    box.appendChild(canvas);
    const shareText = `我在《${GAME_TITLE}》獲判「${payload.title}」，悟性值 ${payload.wu}／100。${payload.motto}`;

    if (typeof canvas.toBlob === 'function') canvas.toBlob((blob) => {
      if (blob) {
        // 手機系統分享面板：可直接傳圖到 LINE／IG 等
        const file = new File([blob], '天堂遊記-稱號卡.png', { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          const shareBtn = el('button', 'btn btn-next', '分享結果');
          shareBtn.addEventListener('click', () => {
            navigator.share({ files: [file], title: GAME_TITLE, text: shareText })
              .catch(() => { /* 使用者取消分享，不當錯誤 */ });
          });
          box.insertBefore(shareBtn, hint);
        }
        // blob 連結比 dataURL 可靠（大圖 dataURL 在部分手機瀏覽器點了沒反應）
        const a = el('a', 'btn btn-choice', '下載分享卡 PNG');
        a.href = URL.createObjectURL(blob);
        a.download = '天堂遊記-稱號卡.png';
        box.insertBefore(a, hint);
      }
      if (!blob && navigator.share) {
        const textBtn = el('button', 'btn btn-next', '分享結果（文字）');
        textBtn.addEventListener('click', () => {
          navigator.share({ title: GAME_TITLE, text: shareText, url: GAME_URL })
            .catch(() => { /* 使用者取消分享 */ });
        });
        box.insertBefore(textBtn, hint);
      }
    }, 'image/png');

    const hint = el('p', 'hint', '手機亦可長按上圖，直接儲存或分享。');
    box.appendChild(hint);
  }
  const back = el('button', 'btn btn-choice', '返回 ▸');
  back.addEventListener('click', onBack);
  box.appendChild(back);
  root.appendChild(box);
}
