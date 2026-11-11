/**
 * Calls `onKey` for every keydown and keyup on the document until `signal`
 * aborts. `reset` runs now and on abort, so held keys don't get stuck when a
 * keyup happens after the listeners are gone.
 */
export function listenForKeyState(
  signal: AbortSignal,
  onKey: (event: KeyboardEvent, isKeyDown: boolean) => void,
  reset: () => void,
): void {
  reset();
  document.addEventListener("keydown", (e) => onKey(e, true), { signal });
  document.addEventListener("keyup", (e) => onKey(e, false), { signal });
  signal.addEventListener("abort", reset);
}
