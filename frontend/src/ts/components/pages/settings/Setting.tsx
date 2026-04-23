import { JSXElement, Show } from "solid-js";

import { cn } from "../../../utils/cn";
import { Button } from "../../common/Button";
import { FaProps } from "../../common/Fa";
import { H3 } from "../../common/Headers";

type Props = {
  title: string;
  fa: FaProps;
  description: string | JSXElement;
  inputs?: JSXElement;
  fullWidthInputs?: JSXElement;
};

export function Setting(props: Props): JSXElement {
  return (
    <div class="group grid gap-2">
      <div class="flex gap-2">
        <H3 text={props.title} fa={props.fa} class="pb-0" />
        <Button
          class="-m-2 p-2 opacity-0 group-hover:opacity-100"
          variant="text"
          fa={{ icon: "fa-link" }}
        />
      </div>
      <div
        class={cn(
          "grid grid-cols-1 gap-2",
          "md:grid-cols-[1fr_1fr] md:gap-x-8",
          "lg:grid-cols-[1.5fr_1fr]",
          "xl:grid-cols-[2fr_1fr]",
          props.inputs === undefined &&
            "grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1",
        )}
      >
        <div class="">{props.description}</div>
        <div>{props.inputs}</div>
      </div>
      <Show when={props.fullWidthInputs}>{props.fullWidthInputs}</Show>
    </div>
  );
}
