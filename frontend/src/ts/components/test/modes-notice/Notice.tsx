import { ParentProps, Show } from "solid-js";

import {
  CommandlineSelector,
  showCommandLineForConfig,
} from "../../../states/core";
import { FaSolidIcon } from "../../../types/font-awesome";
import { cn } from "../../../utils/cn";
import { OneOf } from "../../../utils/types";
import { Button } from "../../common/Button";
import { Fa } from "../../common/Fa";
export function Notice(
  props: {
    when: boolean | undefined;
    icon?: FaSolidIcon;
    class?: string;
  } & ParentProps &
    Partial<
      OneOf<{ onClick: () => void; openCommandline: CommandlineSelector }>
    >,
) {
  const isButton = () =>
    props.onClick !== undefined || props.openCommandline !== undefined;

  return (
    <Show when={props.when}>
      <div class={cn(isButton() ? {} : cn(props.class, "p-[0.5em]"))}>
        <Show
          when={isButton()}
          fallback=<>
            <Show when={props.icon !== undefined}>
              <Fa icon={props.icon as FaSolidIcon} />
            </Show>{" "}
            {props.children}
          </>
        >
          <Button
            class={cn(props.class)}
            variant="text"
            onClick={
              props.onClick ??
              (() =>
                showCommandLineForConfig(
                  props.openCommandline as CommandlineSelector,
                ))
            }
            fa={props.icon !== undefined ? { icon: props.icon } : undefined}
          >
            {props.children}
          </Button>
        </Show>
      </div>
    </Show>
  );
}
