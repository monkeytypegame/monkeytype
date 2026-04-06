import { JSXElement } from "solid-js";

import { cn } from "../../../utils/cn";
import { Button } from "../../common/Button";

export function QuickNav(): JSXElement {
  const buttonClass = "px-3 py-3";
  return (
    <div>
      {/* todo: responsiveness */}
      <div class="mx-auto w-max rounded bg-sub-alt text-em-xs">
        <Button
          class={cn(buttonClass, "pl-6")}
          variant="text"
          href="#section_behavior"
          text="behavior"
          fa={{
            icon: "fa-tools",
          }}
        />
        <Button
          class={buttonClass}
          variant="text"
          href="#section_input"
          text="input"
          fa={{
            icon: "fa-keyboard",
          }}
        />
        <Button
          class={buttonClass}
          variant="text"
          href="#section_sound"
          text="sound"
          fa={{
            icon: "fa-volume-up",
          }}
        />
        <Button
          class={buttonClass}
          variant="text"
          href="#section_caret"
          text="caret"
          fa={{
            icon: "fa-i-cursor",
          }}
        />
        <Button
          class={buttonClass}
          variant="text"
          href="#section_appearance"
          text="appearance"
          fa={{
            icon: "fa-palette",
          }}
        />
        <Button
          class={buttonClass}
          variant="text"
          href="#section_theme"
          text="theme"
          fa={{
            icon: "fa-brush",
          }}
        />
        <Button
          class={buttonClass}
          variant="text"
          href="#section_hide_elements"
          text="hide elements"
          fa={{
            icon: "fa-eye-slash",
          }}
        />
        <Button
          class={cn(buttonClass, "pr-6")}
          variant="text"
          href="#section_danger_zone"
          text="danger zone"
          fa={{
            icon: "fa-exclamation-triangle",
          }}
        />
      </div>
    </div>
  );
}
