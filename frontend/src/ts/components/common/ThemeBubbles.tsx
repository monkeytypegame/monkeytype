import { ColorHexValue } from "@monkeytype/schemas/configs";
import { For } from "solid-js";

import { cn } from "../../utils/cn";

export function ThemeBubbles(props: {
  inset: boolean;
  colors: {
    bg: ColorHexValue;
    main: ColorHexValue;
    sub: ColorHexValue;
    text: ColorHexValue;
  };
  class?: string;
}) {
  const color = (key: string): string =>
    props.colors[key as keyof typeof props.colors];

  return (
    <div
      class={cn(
        "grid grid-flow-col place-content-center gap-1 rounded-full p-1",
        props.inset && "-my-1",
        props.class,
      )}
      style={{
        background: color("bg"),
      }}
    >
      <For each={["main", "sub", "text"]}>
        {(key) => (
          <div
            class="h-[1em] w-[1em] rounded-full"
            style={{ background: color(key) }}
          ></div>
        )}
      </For>
    </div>
  );
}
