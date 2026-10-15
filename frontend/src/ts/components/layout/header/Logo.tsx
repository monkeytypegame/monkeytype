import { JSXElement } from "solid-js";

import { restartTestEvent } from "../../../events/test";
import { getActivePage } from "../../../states/core";
import { getFocus } from "../../../states/test";
import { cn } from "../../../utils/cn";
import { isDevEnvironment } from "../../../utils/env";

export function Logo(): JSXElement {
  return (
    <a
      href={`${location.origin}/`}
      class="-m-2 flex h-6 w-max gap-2 rounded-[0.8rem] p-2 focus-visible:**:data-[ui-element='logoSubtext']:text-transparent"
      aria-label="Recurse Home"
      router-link
      style={{
        "box-sizing": "content-box",
        "font-family": "Roboto Mono, monospace",
      }}
      data-ui-element="logo"
      onClick={() => {
        if (getActivePage() === "test") restartTestEvent.dispatch();
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 30 18"
        class={cn(
          "h-full fill-none stroke-current stroke-2 text-main transition-colors",
          {
            "text-sub": getFocus(),
          },
        )}
        style={{ "stroke-linecap": "round", "stroke-linejoin": "round" }}
      >
        <rect x="1" y="1" width="28" height="16" rx="4"></rect>
        <path d="M7 5.5 L11 9 L7 12.5"></path>
        <path d="M14 12.5 H21"></path>
      </svg>
      <div class="hidden h-6 place-content-center text-[2rem] leading-0 sm:grid">
        <div
          class={cn(
            "-mt-[1.65em] hidden pl-[0.5em] text-[0.315em] leading-0 text-sub transition-colors duration-125 lg:block",
            {
              "text-transparent": getFocus(),
            },
          )}
          data-ui-element="logoSubtext"
        >
          {isDevEnvironment() ? "localhost" : "kmit"}
        </div>
        <h1
          class={cn("-mt-[0.11em] text-text transition-colors duration-250", {
            "text-sub": getFocus(),
          })}
          data-ui-element="logoText"
        >
          recurse
        </h1>
      </div>
    </a>
  );
}
