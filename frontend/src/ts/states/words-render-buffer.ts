/**
 * Pending writes to the words render store, collected between flushes. Plain
 * data, no reactivity: the input path writes here, words-render applies it.
 */

export type WordsRenderBufferData = {
  truncateTo: number | undefined;
  appended: string[];
  inputs: Map<number, { input: string; composition: string }>;
  activeWordIndex: number | undefined;
  typed: Map<number, boolean>;
};

export type WordsRenderBuffer = {
  take: () => WordsRenderBufferData;
  clear: () => void;
  pendingWordCount: (committedLength: number) => number;
  getPendingInput: (index: number) => string | undefined;
  append: (text: string) => void;
  setInput: (index: number, input: string, composition: string) => void;
  setActiveWord: (index: number) => void;
  setTyped: (index: number, isTyped: boolean) => void;
  truncate: (length: number, committedLength: number) => boolean;
};

function emptyBuffer(): WordsRenderBufferData {
  return {
    truncateTo: undefined,
    appended: [],
    inputs: new Map(),
    activeWordIndex: undefined,
    typed: new Map(),
  };
}

export function createWordsRenderBuffer(): WordsRenderBuffer {
  let buffer = emptyBuffer();

  /** Word count once the buffer is applied to `committedLength` words. */
  function pendingWordCount(committedLength: number): number {
    return (buffer.truncateTo ?? committedLength) + buffer.appended.length;
  }

  return {
    /** Returns the pending writes and starts a fresh buffer. */
    take(): WordsRenderBufferData {
      const taken = buffer;
      buffer = emptyBuffer();
      return taken;
    },

    clear(): void {
      buffer = emptyBuffer();
    },

    pendingWordCount,

    /** Input written for a word that hasn't been flushed yet. */
    getPendingInput(index: number): string | undefined {
      return buffer.inputs.get(index)?.input;
    },

    append(text: string): void {
      buffer.appended.push(text);
    },

    setInput(index: number, input: string, composition: string): void {
      buffer.inputs.set(index, { input, composition });
    },

    setActiveWord(index: number): void {
      buffer.activeWordIndex = index;
    },

    setTyped(index: number, isTyped: boolean): void {
      buffer.typed.set(index, isTyped);
    },

    /**
     * Drops pending words from `length` on. Returns false if nothing changes.
     * `committedLength`: words already in the store.
     */
    truncate(length: number, committedLength: number): boolean {
      if (length >= pendingWordCount(committedLength)) return false;
      const committed = buffer.truncateTo ?? committedLength;
      if (length < committed) {
        buffer.truncateTo = length;
        buffer.appended = [];
      } else {
        buffer.appended.length = length - committed;
      }
      for (const index of [...buffer.inputs.keys()]) {
        if (index >= length) buffer.inputs.delete(index);
      }
      for (const index of [...buffer.typed.keys()]) {
        if (index >= length) buffer.typed.delete(index);
      }
      return true;
    },
  };
}
