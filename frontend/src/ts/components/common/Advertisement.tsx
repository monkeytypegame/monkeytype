import { Ads } from "@monkeytype/schemas/configs";
import { JSXElement, Show } from "solid-js";

import { getConfig } from "../../config/store";
import { isResultShown } from "../../states/result";
import { getRoutePage } from "../../states/router";
import { isFocusMode } from "../../states/test";
import { cn } from "../../utils/cn";
import { AdIcon } from "./AdIcon";

type AdSize = "h" | "hs" | "v";

/** Where ad slots show or hide (adSlotClass): crossing one places the ads again */
export const adSlotMediaQueries = [
  "(width < 356px)",
  "(width < 721px)",
  "(width >= 1876px)",
];

/**
 * An ad slot's wrapper: the ad scripts fill it, stacked over the placeholder
 * icon. `ad advertisement` aren't styled: ad blockers hide them, the empty
 * slot with them
 */
export function adSlotClass(size: AdSize): string {
  return cn(
    "ad advertisement duration-half grid justify-center bg-sub-alt transition-opacity [grid-template-areas:'slot'] *:[grid-area:slot]",
    {
      // keep in sync with adSlotMediaQueries
      // the small horizontal ad replaces the big one on narrow screens
      h: "h-[90px] w-[728px] max-sm:hidden",
      hs: "hidden h-[50px] w-[320px] max-sm:grid max-[356px]:hidden",
      // only when there's room beside the content (see core.scss)
      v: "hidden h-[600px] w-[160px] min-[1876px]:grid",
    }[size],
  );
}

export function Advertisement(props: {
  id:
    | "ad-account-1"
    | "ad-account-2"
    | "ad-about-1"
    | "ad-about-2"
    | "ad-settings-1"
    | "ad-settings-2"
    | "ad-settings-3"
    | "ad-footer"
    | "ad-vertical-left"
    | "ad-vertical-right";
  visible: Ads | Ads[];
  vertical?: boolean;
}): JSXElement {
  const isVisible = () =>
    Array.isArray(props.visible)
      ? props.visible.includes(getConfig.ads)
      : props.visible === getConfig.ads;

  const slotClass = (size: AdSize): string =>
    cn(adSlotClass(size), {
      "opacity-0": isFocusMode(),
      // hidden while testing, shown again on the result
      "hidden!": getRoutePage() === "test" && !isResultShown(),
    });

  const horizontal = () => (
    <>
      <div
        id={`${props.id}-wrapper`}
        class={cn(slotClass("h"), "full-width mx-auto place-self-center")}
      >
        <AdIcon />
        <div id={props.id}></div>
      </div>
      <div
        id={`${props.id}-small-wrapper`}
        class={cn(slotClass("hs"), "full-width mx-auto place-self-center")}
      >
        <AdIcon small />
        <div id={`${props.id}-small`}></div>
      </div>
    </>
  );

  const vertical = () => (
    <div id={`${props.id}-wrapper`} class={slotClass("v")}>
      <AdIcon />
      <div id={props.id}></div>
    </div>
  );

  return (
    <Show when={isVisible()}>
      <Show when={!props.vertical}>{horizontal()}</Show>
      <Show when={props.vertical}>{vertical()}</Show>
    </Show>
  );
}
