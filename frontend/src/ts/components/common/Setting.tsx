import {
  children,
  createSignal,
  JSXElement,
  onCleanup,
  onMount,
  ParentProps,
  Show,
} from "solid-js";

import {
  showErrorNotification,
  showSuccessNotification,
} from "../../states/notifications";
import {
  getHighlightedSetting,
  settingsSearch,
} from "../../states/settings-search";
import { cn } from "../../utils/cn";
import { Button } from "./Button";
import { FaProps } from "./Fa";
import { H3 } from "./Headers";

export type SettingProps = {
  title: string;
  fa: FaProps;
  description: string | JSXElement;
  inputs?: JSXElement;
  fullWidthInputs?: JSXElement;
  breakpoints?: "none" | "normal" | "narrow";
  class?: string;
} & ParentProps &
  (
    | {
        /**
         * data-settings-key
         */
        key: string;
        showDeepLink?: true;
      }
    | {
        key?: never;
        showDeepLink: false;
      }
  ) &
  (
    | {
        disabled: boolean;
        disabledDescription: JSXElement;
      }
    | {
        disabled?: never;
        disabledDescription?: never;
      }
  );

export function Setting(props: SettingProps): JSXElement {
  const breakpoints = () => props.breakpoints ?? "normal";
  // JSX props are getters that build new DOM on every read - resolve each once
  const description = children(() => props.description);
  const inputs = children(() => props.inputs);
  const fullWidthInputs = children(() => props.fullWidthInputs);
  const content = children(() => props.children);

  // deep link highlight from the `?highlight=` param
  let ref: HTMLDivElement | undefined;
  const [highlighted, setHighlighted] = createSignal(false);
  onMount(() => {
    if (props.key === undefined || getHighlightedSetting() !== props.key) {
      return;
    }

    // wait for the page fade in
    const timeout = setTimeout(() => {
      ref?.scrollIntoView({ block: "center", behavior: "auto" });
      setHighlighted(true);
    }, 250);
    onCleanup(() => clearTimeout(timeout));
  });

  return (
    <div
      ref={(el) => (ref = el)}
      class={cn(
        "group grid gap-2",
        "-m-4 rounded-double p-4",
        // "animate-[ring-flash_4s_ease-in_forwards]",
        highlighted() && "settings-highlight",
        props.class,
      )}
      {...("key" in props && props.key !== undefined
        ? { "data-setting-key": props.key }
        : {})}
    >
      <div class="flex gap-2">
        <H3 text={props.title} fa={props.fa} class="pb-0" />
        <Show when={props.showDeepLink !== false}>
          <DeepLinkButton key={(props as { key: string }).key} />
        </Show>
      </div>

      <Show
        when={props.disabled === undefined || !props.disabled}
        fallback=<div>{props.disabledDescription}</div>
      >
        <div
          class={cn(
            "grid grid-cols-1 gap-2",
            breakpoints() === "normal" &&
              "md:grid-cols-[1fr_1fr] md:gap-x-8 lg:grid-cols-[1.5fr_1fr] xl:grid-cols-[2fr_1fr]",

            breakpoints() === "narrow" &&
              "md:gap-x-8 lg:grid lg:grid-cols-2 xl:grid-cols-[2fr_1fr]",

            inputs() === undefined &&
              breakpoints() === "normal" &&
              "grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1",
          )}
        >
          <Show when={description() !== ""}>
            <div>{description()}</div>
          </Show>
          <Show when={inputs() !== undefined}>
            <div>{inputs()}</div>
          </Show>
          <Show when={content()}>
            <div>{content()}</div>
          </Show>
        </div>

        <Show when={fullWidthInputs()}>{fullWidthInputs()}</Show>
      </Show>
    </div>
  );
}

function DeepLinkButton(props: { key: string }) {
  return (
    <Button
      class="-m-2 p-2 opacity-0 group-hover:opacity-100"
      variant="text"
      fa={{ icon: "fa-link" }}
      onClick={() => {
        settingsSearch.write({ highlight: props.key });

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
  );
}
