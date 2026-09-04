// tree 型別畫面狀態機：sapling（序章雲隙看樹苗）／read（東華宮案例樹考題＋讀你的樹）／judge（三官殿考核・補過）
export function treePhases(data) {
  if (data.mode === 'sapling') return ['look', 'closing', 'done'];
  if (data.mode === 'judge') return ['tianguan', 'diguan', 'shuiguan', 'closing', 'done'];
  return ['garden', ...data.cases.map((_, i) => `case${i}`), 'read', 'closing', 'done'];
}

// extras：流程層附加的畫面級資料（三官殿的 amends＝水官「還能補的站」）
export function createTreeScreen(data, extras = {}) {
  const phases = treePhases(data);
  return { data, phases, phase: phases[0], caseAttempted: {}, casePoints: {}, ...extras };
}

export function nextTreePhase(t) {
  const i = t.phases.indexOf(t.phase);
  t.phase = t.phases[Math.min(i + 1, t.phases.length - 1)];
  return t.phase;
}

export function prevTreePhase(t) {
  const i = t.phases.indexOf(t.phase);
  if (i > 0) t.phase = t.phases[i - 1];
  return t.phase;
}

export function caseIndex(t) {
  const m = /^case(\d+)$/.exec(t.phase);
  return m ? Number(m[1]) : null;
}

// 案例樹考題：首答對 5 分，答錯提示後重答 0 分（同見聞站考題）
export function answerCase(t, index) {
  const i = caseIndex(t);
  if (i === null) throw new Error('目前不在案例樹階段');
  if (t.casePoints[i] !== undefined) return { correct: true, points: t.casePoints[i] };
  const correct = index === t.data.cases[i].answer;
  if (correct) {
    t.casePoints[i] = t.caseAttempted[i] ? 0 : 5;
    return { correct, points: t.casePoints[i] };
  }
  t.caseAttempted[i] = true;
  return { correct: false, points: 0 };
}

export function treeScore(t) {
  return Object.values(t.casePoints).reduce((s, v) => s + v, 0);
}

export function treeMax(data) {
  return data.mode === 'read' ? data.cases.length * 5 : 0;
}
