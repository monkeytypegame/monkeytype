type SubscribeFunction = (
  mode: "prompt",
  word: string,
  wordIndex: number,
  actualKeyPressed?: string,
  correct?: boolean
) => void;

const subscribers: SubscribeFunction[] = [];

export function subscribe(fn: SubscribeFunction): void {
  subscribers.push(fn);
}

export async function prompt(word: string, wordIndex: number): Promise<void> {
  subscribers.forEach((fn) => {
    try {
      fn("prompt", word, wordIndex);
    } catch (e) {
      console.error(
        "ScreenReaderPrompt prompt event subscriber threw an error"
      );
      console.error(e);
    }
  });
}
