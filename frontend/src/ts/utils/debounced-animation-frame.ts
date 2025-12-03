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
