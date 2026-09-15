// 測試共用：在一站的資料裡找出所有「帶五軸 karma 的選項列表」
// （scene 節點的 choices、見聞殿 mercy.choices、支線 branch.scene 的 choices）。
// 選項位置已打散（2026-09-15），測試一律依 delta 判斷善／惡，不靠順序。
export function karmaChoiceLists(value, out = []) {
  if (Array.isArray(value)) {
    const isChoiceList = value.length > 0
      && value.every((c) => c && typeof c === 'object' && typeof c.text === 'string')
      && value.some((c) => c.karma);
    if (isChoiceList) out.push(value);
    else value.forEach((v) => karmaChoiceLists(v, out));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((v) => karmaChoiceLists(v, out));
  }
  return out;
}
