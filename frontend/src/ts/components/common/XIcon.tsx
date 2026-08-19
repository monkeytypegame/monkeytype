import { JSXElement } from "solid-js";

import { cn } from "../../utils/cn";

type XIconProps = {
  fixedWidth?: boolean;
  class?: string;
};

/**
 * The X (formerly Twitter) logo. Font Awesome only ships this icon from v6
 * onwards, so it is inlined here instead of going through `Fa`.
 */
export function XIcon(props: XIconProps): JSXElement {
  return (
    <span
      class={cn(
        "inline-flex items-center justify-center",
        { "w-[1.25em]": props.fixedWidth },
        props.class,
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        class="h-[1em] fill-current"
        aria-hidden="true"
      >
        {/* <!--!Font Awesome Free v6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--> */}
        <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zm-24.8 373.8h39.1L151.1 88h-42l255.3 333.8z"></path>
      </svg>
    </span>
  );
}
