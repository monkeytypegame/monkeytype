import { qsr } from "../utils/dom";

const element = qsr("#backgroundLoader");
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
    element.show();
    visible = true;
  } else {
    timeout = setTimeout(() => {
      element.show();
    }, 125);
    visible = true;
  }
}

export function hide(): void {
  if (!visible) return;
  clearTimeout();
  element.hide();
  visible = false;
}
