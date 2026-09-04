// 陰陽界結算關狀態機（設計 §3.4）：三岔路（依樹・善／傷分流）→ 三位歸天者訪談（考題）
// → 通天路引言 → 通天五段（每段回放一軸的選擇）→ 結語 → 天音卡
export function reviewPhases(data) {
  return [
    'fork',
    ...data.guests.map((_, i) => `guest${i}`),
    'road',
    ...data.stages.map((_, i) => `stage${i}`),
    'closing',
    'done',
  ];
}

export function createReview(data) {
  const phases = reviewPhases(data);
  return { data, phases, phase: phases[0], guestAttempted: {}, guestPoints: {} };
}

export function nextReviewPhase(r) {
  const i = r.phases.indexOf(r.phase);
  r.phase = r.phases[Math.min(i + 1, r.phases.length - 1)];
  return r.phase;
}

export function prevReviewPhase(r) {
  const i = r.phases.indexOf(r.phase);
  if (i > 0) r.phase = r.phases[i - 1];
  return r.phase;
}

export function guestIndex(r) {
  const m = /^guest(\d+)$/.exec(r.phase);
  return m ? Number(m[1]) : null;
}

export function stageIndex(r) {
  const m = /^stage(\d+)$/.exec(r.phase);
  return m ? Number(m[1]) : null;
}

// 歸天者考題：首答對 5 分，答錯提示後重答 0 分（同見聞站考題、案例樹題）
export function answerGuest(r, index) {
  const g = guestIndex(r);
  if (g === null) throw new Error('目前不在歸天者訪談階段');
  if (r.guestPoints[g] !== undefined) return { correct: true, points: r.guestPoints[g] };
  const correct = index === r.data.guests[g].quiz.answer;
  if (correct) {
    r.guestPoints[g] = r.guestAttempted[g] ? 0 : 5;
    return { correct, points: r.guestPoints[g] };
  }
  r.guestAttempted[g] = true;
  return { correct: false, points: 0 };
}

export function reviewScore(r) {
  return Object.values(r.guestPoints).reduce((s, v) => s + v, 0);
}

export function reviewMax(data) {
  return data.guests.length * 5;
}
