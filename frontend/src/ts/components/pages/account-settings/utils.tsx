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
  return (
    <Setting
      {...(props as SettingProps)}
      showDeepLink={false}
      key={undefined}
      breakpoints={props.fullWidth ? "none" : "narrow"}
      inputs={
        props.button !== undefined ? (
          <Button {...props.button} class={cn("w-full", props.button?.class)} />
        ) : undefined
      }
    />
  );
}
