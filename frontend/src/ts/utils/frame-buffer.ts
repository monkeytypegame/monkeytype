/**
 * Collects writes into plain data and applies them once, on the next
 * animation frame. Writes in the same frame share one flush: later writes
 * don't push it back.
 */
export type FrameBuffer<T> = {
  /** Mutates the pending data and schedules a flush. */
  write: (mutate: (data: T) => void) => void;
  /** Pending data, for reads only: write through `write`. */
  peek: () => Readonly<T>;
  /** Applies the pending data now, cancelling the scheduled flush. */
  flush: () => void;
  /** Drops the pending data and cancels the scheduled flush. */
  clear: () => void;
};

export function createFrameBuffer<T>(
  empty: () => T,
  apply: (data: T) => void,
): FrameBuffer<T> {
  let data = empty();
  let pendingFrame: number | undefined;

  function cancel(): void {
    if (pendingFrame === undefined) return;
    cancelAnimationFrame(pendingFrame);
    pendingFrame = undefined;
  }

  function flush(): void {
    cancel();
    const taken = data;
    data = empty();
    apply(taken);
  }

  return {
    write(mutate) {
      mutate(data);
      if (pendingFrame !== undefined) return;
      pendingFrame = requestAnimationFrame(() => {
        pendingFrame = undefined;
        flush();
      });
    },
    peek: () => data,
    flush,
    clear() {
      cancel();
      data = empty();
    },
  };
}
