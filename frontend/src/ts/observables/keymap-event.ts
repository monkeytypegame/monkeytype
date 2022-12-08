type SubscribeFunction = (
  mode: "highlight" | "flash",
  key: string,
  correct?: boolean
) => void;

const subscribers: SubscribeFunction[] = [];

export function subscribe(fn: SubscribeFunction): void {
  subscribers.push(fn);
}

export async function flash(key: string, correct?: boolean): Promise<void> {
  for (const fn of subscribers) {
    try {
      fn("flash", key, correct);
    } catch (error) {
      console.error("Keymap flash event subscriber threw an error");
      console.error(error);
    }
  }
}

export async function highlight(key: string): Promise<void> {
  for (const fn of subscribers) {
    try {
      fn("highlight", key);
    } catch (error) {
      console.error("Keymap highlight event subscriber threw an error");
      console.error(error);
    }
  }
}
