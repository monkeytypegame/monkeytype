import { JSXElement, ParentProps } from "solid-js";

import { cn } from "../../../utils/cn";
import { Button, ButtonProps } from "../../common/Button";
import { FaProps } from "../../common/Fa";
import { Setting } from "../settings/Setting";

export function Section(
  props: {
    title: string;
    fa: FaProps;
    text?: JSXElement;
    button?: ButtonProps;
    fullWidth?: boolean;
  } & ParentProps &
    (
      | {
          disabled: boolean;
          disabledText: JSXElement;
        }
      | {
          disabled?: never;
          disabledText?: never;
        }
    ),
) {
  return (
    <Setting
      title={props.title}
      fa={props.fa}
      description={props.text}
      showDeepLink={false}
      {...(props.disabled !== undefined
        ? {
            disabled: props.disabled,
            disabledText: props.disabledText,
          }
        : {})}
      breakpoints={props.fullWidth ? "none" : "narrow"}
      inputs={
        props.button !== undefined ? (
          <Button {...props.button} class={cn("w-full", props.button?.class)} />
        ) : undefined
      }
    >
      {props.children}
    </Setting>
  );
}
