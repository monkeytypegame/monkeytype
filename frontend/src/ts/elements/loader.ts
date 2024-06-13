let timeout: NodeJS.Timeout | null = null;

let visible = false;

function clearTimeout(): void {
  if (timeout !== null) {
    window.clearTimeout(timeout);
    timeout = null;
  }
}

export function show(): void {
  if (visible) return;
  timeout = setTimeout(() => {
    $("#backgroundLoader").stop(true, true).show();
  }, 125);
  visible = true;
}

export function hide(): void {
  if (!visible) return;
  clearTimeout();
  $("#backgroundLoader").stop(true, true).fadeOut(125);
  visible = false;
}
