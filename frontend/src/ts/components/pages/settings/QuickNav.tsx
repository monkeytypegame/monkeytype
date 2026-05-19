import { JSXElement } from "solid-js";

import { cn } from "../../../utils/cn";
import { Button } from "../../common/Button";

export function QuickNav(): JSXElement {
  const buttonClass = "px-3 py-3";
  return (
    <div>
      <div
        class={cn(
          "mx-auto rounded bg-sub-alt text-em-xs",
          "grid w-full grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]",
          "lg:block lg:w-max lg:grid-cols-none",
        )}
      >
        <Button
          class={cn(buttonClass, "pl-6")}
          variant="text"
          href="#group_behavior"
          text="behavior"
          fa={{
            icon: "fa-tools",
          }}
        />
        <Button
          class={buttonClass}
          variant="text"
          href="#group_input"
          text="input"
          fa={{
            icon: "fa-keyboard",
          }}
        />
        <Button
          class={buttonClass}
          variant="text"
          href="#group_sound"
          text="sound"
          fa={{
            icon: "fa-volume-up",
          }}
        />
        <Button
          class={buttonClass}
          variant="text"
          href="#group_caret"
          text="caret"
          fa={{
            icon: "fa-i-cursor",
          }}
        />
        <Button
          class={buttonClass}
          variant="text"
          href="#group_appearance"
          text="appearance"
          fa={{
            icon: "fa-palette",
          }}
        />
        <Button
          class={buttonClass}
          variant="text"
          href="#group_theme"
          text="theme"
          fa={{
            icon: "fa-brush",
          }}
        />
        <Button
          class={buttonClass}
          variant="text"
          href="#group_hideElements"
          text="hide elements"
          fa={{
            icon: "fa-eye-slash",
          }}
        />
        <Button
          class={cn(buttonClass, "pr-6")}
          variant="text"
          href="#group_dangerZone"
          text="danger zone"
          fa={{
            icon: "fa-exclamation-triangle",
          }}
        />
      </div>
    </div>
  );
}
