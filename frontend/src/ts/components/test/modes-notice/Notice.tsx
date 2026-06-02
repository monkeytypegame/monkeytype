import { ParentProps, Show } from "solid-js";

import { CommandlineSubgroupKey } from "../../../commandline/types";
import { showCommandLineForConfig } from "../../../states/core";
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
  } & OneOf<{ children: ParentProps["children"]; text: string | undefined }> &
    Partial<
      OneOf<{ onClick: () => void; openCommandline: CommandlineSubgroupKey }>
    >,
) {
  const isButton = () =>
    props.onClick !== undefined || props.openCommandline !== undefined;

  const ButtonNotice = () => (
    <Button
      class={cn("h-full gap-3", props.class)}
      variant="text"
      onClick={
        props.onClick ??
        (() =>
          showCommandLineForConfig(
            props.openCommandline as CommandlineSubgroupKey,
          ))
      }
      fa={props.icon !== undefined ? { icon: props.icon } : undefined}
    >
      {props.children ?? props.text}
    </Button>
  );

  const DivNotice = () => (
    <div class={cn("flex items-center gap-2", props.class)}>
      <Show when={props.icon !== undefined}>
        <Fa icon={props.icon as FaSolidIcon} />
      </Show>
      {props.children ?? props.text}
    </div>
  );

  return (
    <Show when={props.when}>
      <Show when={isButton()} fallback={<DivNotice />}>
        <ButtonNotice />
      </Show>
    </Show>
  );
}
