/**
 * Runs `fn` after the browser painted the next frame: a task queued from
 * that frame's animation callback runs once the frame is painted.
 */
export function afterPaint(fn: () => void): void {
  requestAnimationFrame(() => setTimeout(fn, 0));
}
