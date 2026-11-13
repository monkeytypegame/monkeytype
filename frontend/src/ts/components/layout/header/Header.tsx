import { JSXElement } from "solid-js";

import { getIsScreenshotting } from "../../../states/core";
import { isFocusMode } from "../../../states/test";
import { cn } from "../../../utils/cn";
import { isLoadingShown } from "../../core/PageSwitcher";
import { Logo } from "./Logo";
import { Nav } from "./Nav";

export function Header(): JSXElement {
  return (
    <header
      class={cn("flex place-items-center gap-2", {
        "opacity-0": getIsScreenshotting(),
      })}
      data-ui-element="header"
      data-focused={isFocusMode() ? "" : undefined}
      inert={isLoadingShown()}
    >
      <Logo />
      <Nav />
    </header>
  );
}
