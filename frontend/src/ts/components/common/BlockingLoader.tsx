import { JSXElement } from "solid-js";

import { Portal } from "solid-js/web";
import { Keyframe } from "./Loader";

export function BlockingLoader(props: { keyframe?: Keyframe }): JSXElement {
  return (
    <Portal mount={document.querySelector("main") as HTMLElement}>
      <div id="preloader">
        <div class="bar">
          <div
            class="fill"
            style={{ width: props.keyframe?.percentage + "%" }}
          />
        </div>
        <div class="text">{props.keyframe?.text ?? "Loading..."}</div>
      </div>
    </Portal>
  );
}
