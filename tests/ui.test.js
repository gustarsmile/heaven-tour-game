// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { el, renderNode, hallLabel, renderError } from '../js/ui/render.js';
import { renderCard, appendCardBody } from '../js/ui/cardView.js';
import { renderBooklet } from '../js/ui/bookletView.js';
import { renderVisitPhase } from '../js/ui/visitView.js';
import { renderFinalePhase, renderShareOverlay } from '../js/ui/finaleView.js';
import { createVisit, nextVisitPhase } from '../js/engine/visit.js';
import { createFinale } from '../js/engine/finale.js';
import { createState, recordChoice, creditWu } from '../js/state.js';
import hall10 from '../js/data/hall10.json';

describe('render.js', () => {
  it('el 建立元素', () => {
    const n = el('p', 'text', '你好');
    expect(n.tagName).toBe('P');
    expect(n.className).toBe('text');
    expect(n.textContent).toBe('你好');
  });
  it('line 節點渲染繼續按鈕並觸發 onAdvance', () => {
    const root = document.createElement('div');
    const onAdvance = vi.fn();
    renderNode({ type: 'line', speaker: '旁白', text: '一句話', next: 'x' }, { onAdvance }, root);
    expect(root.textContent).toContain('一句話');
    root.querySelector('button').click();
    expect(onAdvance).toHaveBeenCalled();
  });
  it('choice 節點渲染全部選項並以索引回呼', () => {
    const root = document.createElement('div');
    const onChoose = vi.fn();
    renderNode({
      type: 'choice', text: '選吧',
      choices: [{ text: '甲', next: 'x' }, { text: '乙', next: 'x' }],
    }, { onChoose }, root);
    const btns = root.querySelectorAll('.btn-choice');
    expect(btns.length).toBe(2);
    btns[1].click();
    expect(onChoose).toHaveBeenCalledWith(1);
  });
});

const demoCard = {
  title: '花樹映心',
  lesson: '人人天上一棵樹，牌上寫著自己的名字。',
  quote: '你在世擁有愉快心境，則天上靈命也將心花怒放。',
  speaker: '東華帝君',
  source: { chapter: 13, url: 'https://www.taolibrary.com/category/category48/c48001b/15.htm' },
};

describe('cardView.js', () => {
  it('天音卡：標題、白話、原文金句、說者、出處連結，按鈕觸發 onNext', () => {
    const root = document.createElement('div');
    const onNext = vi.fn();
    renderCard(demoCard, onNext, root);
    expect(root.textContent).toContain('天 音 卡');
    expect(root.textContent).toContain('花樹映心');
    expect(root.textContent).toContain(demoCard.lesson);
    expect(root.textContent).toContain(demoCard.quote);
    expect(root.textContent).toContain('東華帝君');
    const a = root.querySelector('.card-source');
    expect(a.textContent).toContain('《天堂遊記》第13回');
    expect(a.getAttribute('href')).toBe(demoCard.source.url);
    root.querySelector('.btn-next').click();
    expect(onNext).toHaveBeenCalled();
  });
  it('chapter 為 null 時不顯示出處列', () => {
    const root = document.createElement('div');
    renderCard({ ...demoCard, source: { chapter: null, url: 'https://x' } }, vi.fn(), root);
    expect(root.querySelector('.card-source')).toBeNull();
  });
  it('appendCardBody：僅在 chapter 為真值時渲染出處連結', () => {
    const withChapter = document.createElement('div');
    appendCardBody(withChapter, demoCard);
    expect(withChapter.querySelector('.card-source')).not.toBeNull();

    const withoutChapter = document.createElement('div');
    appendCardBody(withoutChapter, { ...demoCard, source: { chapter: null, url: 'https://x' } });
    expect(withoutChapter.querySelector('.card-source')).toBeNull();
  });
});

describe('小修整（階段2 Task1）', () => {
  it('hallLabel 支援一到十殿，超出以數字 fallback', () => {
    expect(hallLabel(1)).toBe('第一殿');
    expect(hallLabel(7)).toBe('第七殿');
    expect(hallLabel(10)).toBe('第十殿');
    expect(hallLabel(11)).toBe('第11殿');
  });
});

describe('小修整（階段3 Task1）', () => {
  it('見聞殿考題答錯訊息顯示 feedback', () => {
    const root = document.createElement('div');
    const v = createVisit(quizVisit);
    nextVisitPhase(v);
    renderVisitPhase(v, { onQuiz: vi.fn() }, root, 'H');
    expect(root.querySelector('.feedback').textContent).toBe('H');
  });
  it('renderError 顯示錯誤與重新開始鈕', () => {
    const root = document.createElement('div');
    const onRetry = vi.fn();
    renderError(new Error('boom'), onRetry, root);
    expect(root.textContent).toContain('劇情資料載入失敗');
    expect(root.textContent).toContain('boom');
    [...root.querySelectorAll('button')].find((b) => b.textContent === '重新開始').click();
    expect(onRetry).toHaveBeenCalled();
  });
});

const base = {
  id: 'v-demo', type: 'visit', title: '南天門・把關',
  intro: [{ speaker: '旁白', text: 'x' }],
  watch: { title: '某獄', panels: [{ caption: '其一' }] },
  closing: '走吧。',
  card: { title: 't', lesson: 'l', quote: 'q', speaker: 's', source: { chapter: 1, url: 'https://x' } },
};
const quizVisit = { ...base, quiz: { question: 'Q', options: ['甲', '乙', '丙'], answer: 1, hint: 'H', reveal: 'R' } };
const mercyVisit = {
  ...base,
  mercy: {
    prompt: 'P',
    choices: [
      { text: '善', karma: { axis: 'li', delta: 1 }, reply: 'r1' },
      { text: '中', reply: 'r2' },
      { text: '惡', karma: { axis: 'li', delta: -1 }, reply: 'r3' },
    ],
  },
};
const bothVisit = { ...quizVisit, mercy: mercyVisit.mercy };
const branchVisit = {
  ...base,
  branch: {
    prompt: 'B?', acceptText: '去', declineText: '不去', declineLine: 'D', rewardWu: 10,
    scene: { id: 'b', start: 'n1', nodes: [{ id: 'n1', type: 'line', text: 'x', next: 'fin' }, { id: 'fin', type: 'end' }] },
  },
};

describe('visitView', () => {
  it('watch 階段渲染殿名、獄名與觀刑格', () => {
    const root = document.createElement('div');
    const v = createVisit(quizVisit);
    renderVisitPhase(v, { onNextPhase: vi.fn() }, root);
    expect(root.textContent).toContain('南天門・把關');
    expect(root.textContent).toContain('某獄');
    expect(root.querySelectorAll('.watch-panel').length).toBe(1);
  });
  it('quiz 未答時渲染選項並以索引回呼；答對後顯示 reveal 與繼續鈕', () => {
    const root = document.createElement('div');
    const v = createVisit(quizVisit);
    nextVisitPhase(v);
    const onQuiz = vi.fn();
    renderVisitPhase(v, { onQuiz }, root);
    const btns = root.querySelectorAll('.btn-choice');
    expect(btns.length).toBe(3);
    expect(root.querySelector('.choices').dataset.kind).toBe('quiz');
    btns[2].click();
    expect(onQuiz).toHaveBeenCalledWith(2);
    v.quizPoints = 5;
    const onNextPhase = vi.fn();
    renderVisitPhase(v, { onNextPhase }, root);
    expect(root.textContent).toContain('R');
    root.querySelector('.btn-next').click();
    expect(onNextPhase).toHaveBeenCalled();
  });
  it('quiz 答對後：有 mercy 的站顯示「繼續」，否則「繼續前行」；mercy 容器 data-kind=mercy', () => {
    const root = document.createElement('div');
    const v = createVisit(bothVisit);
    nextVisitPhase(v);
    v.quizPoints = 5;
    renderVisitPhase(v, { onNextPhase: vi.fn() }, root);
    expect(root.querySelector('.btn-next').textContent).toBe('繼續 ▸');
    nextVisitPhase(v); // mercy
    renderVisitPhase(v, { onMercy: vi.fn() }, root);
    expect(root.querySelector('.choices').dataset.kind).toBe('mercy');
    expect(root.querySelectorAll('.btn-choice').length).toBe(3);
  });
  it('mercy 已選後顯示 reply 與繼續鈕', () => {
    const root = document.createElement('div');
    const v = createVisit(mercyVisit);
    nextVisitPhase(v);
    v.mercyReply = 'r1';
    renderVisitPhase(v, { onNextPhase: vi.fn() }, root);
    expect(root.textContent).toContain('r1');
    expect(root.querySelector('.btn-next')).not.toBeNull();
  });
  it('branch 未決時渲染接受／婉拒鈕；婉拒後顯示 declineLine', () => {
    const root = document.createElement('div');
    const v = createVisit(branchVisit);
    nextVisitPhase(v);
    const onBranchAccept = vi.fn();
    const onBranchDecline = vi.fn();
    renderVisitPhase(v, { onBranchAccept, onBranchDecline }, root);
    root.querySelector('.btn-accept').click();
    expect(onBranchAccept).toHaveBeenCalled();
    root.querySelector('.btn-decline').click();
    expect(onBranchDecline).toHaveBeenCalled();
    v.branchTaken = false;
    renderVisitPhase(v, { onNextPhase: vi.fn() }, root);
    expect(root.textContent).toContain('D');
    expect(root.querySelector('.btn-next')).not.toBeNull();
  });
  it('closing 階段顯示結語與收下天音卡鈕', () => {
    const root = document.createElement('div');
    const v = createVisit(quizVisit);
    v.phase = 'closing';
    const onFinish = vi.fn();
    renderVisitPhase(v, { onFinish }, root);
    expect(root.textContent).toContain('走吧。');
    expect(root.querySelector('.btn-next').textContent).toContain('天音卡');
    root.querySelector('.btn-next').click();
    expect(onFinish).toHaveBeenCalled();
  });
});

describe('bookletView', () => {
  const entries = [
    { id: 'gate', title: '南天門', owned: true, card: { title: '悟空', lesson: '心要放空。', quote: '空之其情慾及妄念，自可通過此關。', speaker: '齊天大聖', source: { chapter: 1, url: 'https://x' } } },
    { id: 'donghua', title: '東華宮', owned: false, card: { title: '花樹映心', lesson: 'l2', quote: 'q2', speaker: 's2', source: { chapter: 13, url: 'https://x' } } },
  ];
  it('顯示收集進度、已收卡全文、未收卡占位與補完提示', () => {
    const root = document.createElement('div');
    renderBooklet(entries, vi.fn(), root);
    expect(root.textContent).toContain('1／2');
    expect(root.textContent).toContain('悟空');
    expect(root.textContent).toContain('南天門');
    expect(root.textContent).toContain('尚未收得');
    expect(root.textContent).toContain('重遊');
    expect(root.querySelectorAll('.booklet-card').length).toBe(2);
    expect(root.querySelectorAll('.booklet-card.missing').length).toBe(1);
  });
  it('集滿時不顯示補完提示；合上冊觸發 onBack', () => {
    const root = document.createElement('div');
    const full = entries.map((e) => ({ ...e, owned: true }));
    const onBack = vi.fn();
    renderBooklet(full, onBack, root);
    expect(root.textContent).not.toContain('重遊');
    [...root.querySelectorAll('button')].find((b) => b.textContent.includes('合上')).click();
    expect(onBack).toHaveBeenCalled();
  });
});

describe('finaleView', () => {
  function readyState() {
    // 折算 88 分 − 一筆序章惡選（權重2）扣 8 分 → 悟性 80、心性 −2 → highBad
    const s = createState();
    s.wuMax = 100;
    creditWu(s, 'x', 88);
    recordChoice(s, { screen: 'prologue', scene: 'prologue', label: '早市多找的錢', text: '收進口袋——是他自己找錯的', axis: 'xin', delta: -1, weight: 2 });
    return s;
  }
  it('mengpo 未選時渲染兩選項；選後顯示 reply 與繼續鈕', () => {
    const root = document.createElement('div');
    const f = createFinale(hall10, readyState());
    renderFinalePhase(f, { onMengpo: vi.fn() }, root);
    expect(root.querySelectorAll('.btn-choice').length).toBe(2);
    f.drank = false;
    f.mengpoReply = hall10.mengpo.choices[0].reply;
    renderFinalePhase(f, { onNextPhase: vi.fn() }, root);
    expect(root.textContent).toContain(hall10.mengpo.choices[0].reply);
    expect(root.querySelector('.btn-next')).not.toBeNull();
  });
  it('wu 階段顯示悟性值；mirror 階段回放序章選擇與旅途統計', () => {
    const root = document.createElement('div');
    const f = createFinale(hall10, readyState());
    f.phase = 'wu';
    renderFinalePhase(f, { onNextPhase: vi.fn() }, root);
    expect(root.textContent).toContain('悟性值 80');
    f.phase = 'mirror';
    renderFinalePhase(f, { onNextPhase: vi.fn() }, root);
    expect(root.querySelectorAll('.mirror-echo').length).toBe(1);
    expect(root.textContent).toContain('早市多找的錢');
    expect(root.textContent).toContain('收進口袋');
    expect(root.textContent).toContain('0'); // journey tally 代入
  });
  it('孽鏡反照 choices 為空時顯示 fallback 文字而非空清單', () => {
    const root = document.createElement('div');
    const finale = createFinale(hall10, createState()); // choices 為空的全新 state
    const handlers = { onNextPhase: vi.fn() };
    finale.phase = 'mirror';
    renderFinalePhase(finale, handlers, root);
    expect(root.textContent).toContain('模糊');
    expect(root.querySelectorAll('.mirror-echo').length).toBe(0);
  });
  it('ending 階段：highBad 顯示稱號與序章選擇引用', () => {
    const root = document.createElement('div');
    const f = createFinale(hall10, readyState()); // wu80、karma -2 → highBad
    f.phase = 'ending';
    renderFinalePhase(f, { onNextPhase: vi.fn() }, root);
    expect(root.textContent).toContain('滿腹經綸·知易行難');
    expect(root.querySelector('.ending-quote').textContent).toContain('收進口袋');
  });
  it('mission 依 drank 顯示兩版；done 為 finale-end 且含三鈕', () => {
    const root = document.createElement('div');
    const f = createFinale(hall10, readyState());
    f.phase = 'mission';
    f.drank = true;
    renderFinalePhase(f, { onNextPhase: vi.fn() }, root);
    expect(root.textContent).toContain(hall10.mission.drank[0].text);
    f.phase = 'done';
    const onShare = vi.fn(); const onBooklet = vi.fn(); const onRestart = vi.fn();
    renderFinalePhase(f, { onShare, onBooklet, onRestart }, root);
    expect(root.querySelector('.finale-end')).not.toBeNull();
    expect(root.textContent).toContain('悟性值 80');
    const btns = [...root.querySelectorAll('button')];
    btns.find((b) => b.textContent.includes('分享卡')).click();
    btns.find((b) => b.textContent.includes('善書冊')).click();
    btns.find((b) => b.textContent === '重新開始').click();
    expect(onShare).toHaveBeenCalled();
    expect(onBooklet).toHaveBeenCalled();
    expect(onRestart).toHaveBeenCalled();
  });
});

describe('renderShareOverlay', () => {
  it('canvas 為 null 顯示不支援訊息；返回鈕觸發 onBack', () => {
    const root = document.createElement('div');
    const onBack = vi.fn();
    renderShareOverlay(null, { title: 't', wu: 80, motto: 'm' }, onBack, root);
    expect(root.textContent).toContain('不支援');
    [...root.querySelectorAll('button')].find((b) => b.textContent.includes('返回')).click();
    expect(onBack).toHaveBeenCalled();
  });
});
