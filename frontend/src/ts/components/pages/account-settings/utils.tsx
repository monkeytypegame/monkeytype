import { splitProps } from "solid-js";

import { cn } from "../../../utils/cn";
import { Button, ButtonProps } from "../../common/Button";
import { Setting, SettingProps } from "../../common/Setting";

export function Section(
  props: Omit<
    SettingProps,
    "breakpoints" | "inputs" | "key" | "showDeepLink" | "fullWidthInputs"
  > & {
    button?: ButtonProps;
    fullWidth?: boolean;
  },
) {
  const [local, settingsProps] = splitProps(props, ["button", "fullWidth"]);
  return (
    <Setting
      {...(settingsProps as SettingProps)}
      showDeepLink={false}
      key={undefined}
      breakpoints={local.fullWidth ? "none" : "narrow"}
      inputs={
        local.button !== undefined ? (
          <Button {...local.button} class={cn("w-full", local.button?.class)} />
        ) : undefined
      }
    />
  );
}
