import { Accessor, createSignal } from "solid-js";

export function useRef<T extends HTMLElement>(): [
  ref: (el: T) => void,
  element: Accessor<T | undefined>,
] {
  const [element, setElement] = createSignal<T | undefined>();

  const ref = (el: T): void => {
    setElement(() => el);
  };

  return [ref, element];
}
