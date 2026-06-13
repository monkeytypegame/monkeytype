import { JSX, ParentProps, Show } from "solid-js";

import { cn } from "../../../utils/cn";
import { Button, ButtonProps } from "../../common/Button";
import { FaProps } from "../../common/Fa";
import { H3 } from "../../common/Headers";

export function Section(
  props: {
    title: string;
    fa: FaProps;
    text?: JSX.Element;
    button?: ButtonProps;
    fullWidth?: boolean;
  } & ParentProps &
    (
      | {
          disabled: boolean;
          disabledText: JSX.Element;
        }
      | {
          disabled?: never;
          disabledText?: never;
        }
    ),
) {
  return (
    <div>
      <H3 text={props.title} fa={{ ...{ fixedWidth: true }, ...props.fa }} />

      <div
        classList={{
          "lg:grid lg:grid-cols-2 xl:grid-cols-[2fr_1fr] lg:items-center gap-2":
            props.fullWidth !== true,
        }}
      >
        <Show
          when={props.disabled === undefined || !props.disabled}
          fallback={props.disabledText}
        >
          <Show when={props.text !== undefined}>
            <p class="mb-4">{props.text}</p>
          </Show>
          <Show when={props.children}>{props.children}</Show>
          <Show when={props.button}>
            <Button
              {...props.button}
              class={cn("w-full", props.button?.class)}
            />
          </Show>
        </Show>
      </div>
    </div>
  );
}
