import { JSXElement } from "solid-js";

import { restartTestEvent } from "../../../events/test";
import { getActivePage } from "../../../states/core";
import { getFocus } from "../../../states/test";
import { cn } from "../../../utils/cn";
import { isDevEnvironment } from "../../../utils/env";

/**
 * Recurse KMIT logo. Drawn as a CSS mask so it takes the theme's text colour
 * on every theme (light or dark).
 */
export function Logo(): JSXElement {
  return (
    <a
      href={`${location.origin}/`}
      class="relative -m-2 flex w-max shrink-0 items-center p-2"
      aria-label="Recurse Type home"
      router-link
      data-ui-element="logo"
      onClick={() => {
        if (getActivePage() === "test") restartTestEvent.dispatch();
      }}
    >
      <span
        role="img"
        aria-hidden="true"
        data-ui-element="logoMark"
        class={cn(
          "block h-[2.6rem] w-[8.95rem] bg-text transition-colors duration-250",
          { "bg-sub": getFocus() },
        )}
      ></span>
      <span
        class={cn(
          "absolute top-[0.15rem] left-[9.6rem] hidden text-[0.6rem] tracking-[0.08em] text-main uppercase transition-opacity lg:block",
          { "opacity-0": getFocus() },
        )}
        data-ui-element="logoSubtext"
      >
        {isDevEnvironment() ? "localhost" : "type"}
      </span>
    </a>
  );
}
