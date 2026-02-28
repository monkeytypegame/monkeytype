import { JSXElement } from "solid-js";

import { cn } from "../../utils/cn";
import { Conditional } from "./Conditional";
import { Fa } from "./Fa";

export function LoadingCircle(props: {
  mode?: "icon" | "svg";
  class?: string;
}): JSXElement {
  return (
    <Conditional
      if={props.mode === "icon" || props.mode === undefined}
      then={
        <div class={cn("preloader text-main", props.class)}>
          <Fa icon="fa-circle-notch" fixedWidth spin />
        </div>
      }
      else={
        <div
          class={cn(
            "preloader grid h-[1em] w-[1em] animate-spin place-items-center fill-main p-[0.5em] [animation-duration:2s]",
            props.class,
          )}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            {/* !Font Awesome Free v5.15.4 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc. */}
            <path d="M288 39.056v16.659c0 10.804 7.281 20.159 17.686 23.066C383.204 100.434 440 171.518 440 256c0 101.689-82.295 184-184 184-101.689 0-184-82.295-184-184 0-84.47 56.786-155.564 134.312-177.219C216.719 75.874 224 66.517 224 55.712V39.064c0-15.709-14.834-27.153-30.046-23.234C86.603 43.482 7.394 141.206 8.003 257.332c.72 137.052 111.477 246.956 248.531 246.667C393.255 503.711 504 392.788 504 256c0-115.633-79.14-212.779-186.211-240.236C302.678 11.889 288 23.456 288 39.056z"></path>
          </svg>
        </div>
      }
    />
  );
}
