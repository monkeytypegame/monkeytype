import { cn } from "../../../utils/cn";
import { Button, ButtonProps } from "../../common/Button";
import { Setting, SettingProps } from "../settings/Setting";

export function Section(
  props: Omit<
    SettingProps,
    "breakpoints" | "inputs" | "key" | "showDeepLink" | "fullWidthInputs"
  > & {
    button?: ButtonProps;
    fullWidth?: boolean;
  },
) {
  return (
    <Setting
      {...(props as SettingProps)}
      showDeepLink={false}
      breakpoints={props.fullWidth ? "none" : "narrow"}
      inputs={
        props.button !== undefined ? (
          <Button {...props.button} class={cn("w-full", props.button?.class)} />
        ) : undefined
      }
    />
  );
}
