const element = $("#backgroundLoader");
let timeout: NodeJS.Timeout | null = null;
let visible = false;

function clearTimeout(): void {
  if (timeout !== null) {
    window.clearTimeout(timeout);
    timeout = null;
  }
}

export function show(instant = false): void {
  if (visible) return;

  if (instant) {
    element.stop(true, true).show();
    visible = true;
  } else {
    timeout = setTimeout(() => {
      element.stop(true, true).show();
    }, 125);
    visible = true;
  }
}

export function hide(): void {
  if (!visible) return;
  clearTimeout();
  element.stop(true, true).fadeOut(125);
  visible = false;
}
