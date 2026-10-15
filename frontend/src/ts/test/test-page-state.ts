let mounted = false;
let leaving = false;

/** Call when the test page mounts. It counts as unmounted once `signal` aborts. */
export function markTestPageMounted(signal: AbortSignal): void {
  mounted = true;
  leaving = false;
  signal.addEventListener("abort", () => {
    mounted = false;
  });
}

/** Call when a navigation away from the test page starts. */
export function markTestPageLeaving(): void {
  leaving = true;
}

/** A test can only start on the mounted test page, not while it fades out. */
export function canStartTest(): boolean {
  return mounted && !leaving;
}
