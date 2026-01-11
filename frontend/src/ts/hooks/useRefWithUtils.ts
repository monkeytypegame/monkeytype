import { Accessor } from "solid-js";
import { ElementWithUtils } from "../utils/dom";

export function useRefWithUtils<T extends HTMLElement>(): [
  ref: (el: T) => void,
  element: Accessor<ElementWithUtils<T> | undefined>,
] {
  let elementWithUtils: ElementWithUtils<T> | undefined;

  const ref = (el: T): void => {
    elementWithUtils = new ElementWithUtils(el);
  };

  const element = (): ElementWithUtils<T> | undefined => elementWithUtils;

  return [ref, element];
}
