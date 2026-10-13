import { ColorHexValue } from "@monkeytype/schemas/configs";

import { cn } from "../../utils/cn";

// rendered for every theme on the settings page - colors are passed down as
// css vars in a single style binding so the bubbles themselves stay static
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
  return (
    <div
      class={cn(
        "grid grid-flow-col place-content-center gap-1 rounded-full bg-(--bubble-bg) p-1",
        props.inset && "-my-1",
        props.class,
      )}
      style={{
        "--bubble-bg": props.colors.bg,
        "--bubble-main": props.colors.main,
        "--bubble-sub": props.colors.sub,
        "--bubble-text": props.colors.text,
      }}
    >
      <div class="size-[1em] rounded-full bg-(--bubble-main)"></div>
      <div class="size-[1em] rounded-full bg-(--bubble-sub)"></div>
      <div class="size-[1em] rounded-full bg-(--bubble-text)"></div>
    </div>
  );
}
