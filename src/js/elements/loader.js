export function show() {
  $("#backgroundLoader").stop(true, true).fadeIn(125);
}

export function hide() {
  $("#backgroundLoader").stop(true, true).fadeOut(125);
}
