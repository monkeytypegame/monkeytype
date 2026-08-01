import { Show } from "solid-js";

import {
  outOfFocusMaxHeight,
  showOutOfFocusWarning,
  testFocusState,
} from "../../../states/test";
import { Fa } from "../../common/Fa";

export function OutOfFocusWarning() {
  const message = () =>
    testFocusState() === "unfocusedWindow"
      ? "Click anywhere to focus the window"
      : "Click here or press any key to focus";

  return (
    <Show when={showOutOfFocusWarning()}>
      <div
        class="pointer-events-none absolute z-999 flex h-full w-full place-content-center items-center gap-2 text-center text-base select-none"
        style={{
          "max-height":
            outOfFocusMaxHeight() !== undefined
              ? `${outOfFocusMaxHeight()}px`
              : undefined,
        }}
      >
        <div>
          <Fa icon="fa-mouse-pointer" fixedWidth />
        </div>
        <div>{message()}</div>
      </div>
    </Show>
  );
}
