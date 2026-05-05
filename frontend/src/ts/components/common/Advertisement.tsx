import { Ads } from "@monkeytype/schemas/configs";
import { JSXElement, Show } from "solid-js";

import { getConfig } from "../../config/store";

export function Advertisement(props: {
  id: "ad-account-1" | "ad-account-2" | "ad-about-1" | "ad-about-2";
  visible: Ads | Ads[];
}): JSXElement {
  const isVisible = () =>
    Array.isArray(props.visible)
      ? props.visible.includes(getConfig.ads)
      : props.visible === getConfig.ads;
  return (
    <Show when={isVisible()}>
      <div
        id={props.id + "-wrapper"}
        class="ad full-width advertisement ad-h place-self-center"
      >
        <div class="icon">
          <i class="fas fa-ad"></i>
        </div>
        <div id={props.id}></div>
      </div>
      <div
        id={props.id + "-small-wrapper"}
        class="ad advertisement ad-h-s place-self-center"
      >
        <div class="icon small">
          <i class="fas fa-ad"></i>
        </div>
        <div id={props.id + "-small"}></div>
      </div>
    </Show>
  );
}
