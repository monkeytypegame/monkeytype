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
  subscribers.forEach((fn) => {
    try {
      fn("flash", key, correct);
    } catch (e) {
      console.error("Keymap flash event subscriber threw an error");
      console.error(e);
    }
  });
}

export async function highlight(key: string): Promise<void> {
  subscribers.forEach((fn) => {
    try {
      fn("highlight", key);
    } catch (e) {
      console.error("Keymap highlight event subscriber threw an error");
      console.error(e);
    }
  });
}
