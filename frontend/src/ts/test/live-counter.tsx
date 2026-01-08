import { render } from "solid-js/web";
import { ElementWithUtils } from "../utils/dom";
import { Accessor } from "solid-js";

export function LiveCounter(
  el: ElementWithUtils,
  value: Accessor<number>,
): void {
  render(() => {
    return <div>{value()}</div>;
  }, el.native);
}
