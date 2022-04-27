export function show(): void {
  $("#backgroundLoader").stop(true, true).fadeIn(125);
}

export function hide(): void {
  $("#backgroundLoader").stop(true, true).fadeOut(125);
}
