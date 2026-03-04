import { Accessor, createSignal } from "solid-js";
import { ElementWithUtils } from "../utils/dom";

export function useRefWithUtils<T extends HTMLElement>(): [
  ref: (el: T) => void,
  element: Accessor<ElementWithUtils<T> | undefined>,
] {
  const [element, setElement] = createSignal<ElementWithUtils<T> | undefined>();

  const ref = (el: T): void => {
    setElement(new ElementWithUtils(el));
  };

  return [ref, element];
}
