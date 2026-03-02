import { Accessor, createSignal } from "solid-js";

export function createEvent(): [Accessor<number>, () => void] {
  const [get, set] = createSignal(0);
  return [
    get,
    () => {
      set((v) => v + 1);
    },
  ];
}
