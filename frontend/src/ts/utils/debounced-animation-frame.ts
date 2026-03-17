const pendingFrames = new Map<string, number>();

export function requestDebouncedAnimationFrame(
  frameId: string,
  callback: () => void,
): void {
  cancelIfPending(frameId);
  const frame = requestAnimationFrame(() => {
    pendingFrames.delete(frameId);
    callback();
  });
  pendingFrames.set(frameId, frame);
}

function cancelIfPending(frameId: string): void {
  const pending = pendingFrames.get(frameId);
  if (pending !== undefined) {
    cancelAnimationFrame(pending);
    pendingFrames.delete(frameId);
  }
}

export function cancelPendingAnimationFrame(frameId: string): void {
  cancelIfPending(frameId);
}

export function cancelPendingAnimationFramesStartingWith(prefix: string): void {
  for (const frameId of pendingFrames.keys()) {
    if (frameId.startsWith(prefix)) {
      cancelIfPending(frameId);
    }
  }
}
