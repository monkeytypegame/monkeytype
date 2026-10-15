import { JSXElement } from "solid-js";

import { getFocus, getResultVisible } from "../../../states/test";
import { cn } from "../../../utils/cn";

/**
 * Recurse website style hero above the test: terminal kicker plus the
 * solid / outlined display headline. Fades out while typing and on results.
 */
export function RecurseIntro(): JSXElement {
  return (
    <div
      class={cn("mb-6 w-full transition-opacity duration-125", {
        "pointer-events-none opacity-0": getFocus(),
      })}
      data-ui-element="recurseIntro"
    >
      <p class="mb-3 text-[0.7rem] tracking-[0.06em] text-main uppercase">
        {getResultVisible()
          ? "> test.complete --result"
          : "recurse@kmit:~$ type --test"}
      </p>
      <h1
        class={cn("recurse-display", { hidden: getResultVisible() })}
        aria-label="Type faster."
      >
        type<span>faster.</span>
      </h1>
    </div>
  );
}
