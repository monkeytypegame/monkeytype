import { JSXElement, Show } from "solid-js";
import { z } from "zod";
import { serialize } from "zod-urlsearchparams";

import {
  showErrorNotification,
  showSuccessNotification,
} from "../../../states/notifications";
import { cn } from "../../../utils/cn";
import { Button } from "../../common/Button";
import { FaProps } from "../../common/Fa";
import { H3 } from "../../common/Headers";

type Props = {
  key: string;
  title: string;
  fa: FaProps;
  description: string | JSXElement;
  inputs?: JSXElement;
  fullWidthInputs?: JSXElement;
};

export function Setting(props: Props): JSXElement {
  return (
    <div
      class={cn(
        "group grid gap-2",
        "-m-4 rounded-double p-4",
        // "animate-[ring-flash_4s_ease-in_forwards]",
      )}
      data-setting-key={props.key}
    >
      <div class="flex gap-2">
        <H3 text={props.title} fa={props.fa} class="pb-0" />
        <Button
          class="-m-2 p-2 opacity-0 group-hover:opacity-100"
          variant="text"
          fa={{ icon: "fa-link" }}
          onClick={() => {
            const urlParams = serialize({
              schema: z.object({
                highlight: z.string(),
              }),
              data: {
                highlight: props.key,
              },
            });
            const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
            window.history.replaceState({}, "", newUrl);

            navigator.clipboard
              .writeText(window.location.toString())
              .then(() => {
                showSuccessNotification("Link copied to clipboard");
              })
              .catch((e: unknown) => {
                showErrorNotification("Failed to copy to clipboard", {
                  error: e,
                });
              });
          }}
        />
      </div>
      <Show when={props.inputs !== undefined}>
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
          <Show when={props.description !== ""}>
            <div class="">{props.description}</div>
          </Show>
          <div>{props.inputs}</div>
        </div>
      </Show>
      <Show when={props.fullWidthInputs}>{props.fullWidthInputs}</Show>
    </div>
  );
}
