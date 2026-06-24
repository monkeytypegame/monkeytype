import { DebounceStrategy, Transaction } from "@tanstack/solid-db";
import { LiteDebouncer } from "@tanstack/pacer-lite/lite-debouncer";

export function flushDebounceStrategy(options: { maxWait: number }): {
  strategy: DebounceStrategy;
  flush: () => void;
} {
  const debouncer = new LiteDebouncer(
    (callback: () => Transaction) => callback(),
    { wait: options.maxWait },
  );
  const strategy: DebounceStrategy = {
    _type: `debounce`,
    options: { wait: options.maxWait },
    execute: <T extends object = Record<string, unknown>>(
      fn: () => Transaction<T>,
    ) => {
      debouncer.maybeExecute(fn as () => Transaction);
    },
    cleanup: () => {
      debouncer.cancel();
    },
  };

  return {
    strategy,
    flush: () => {
      debouncer.flush();
    },
  };
}
