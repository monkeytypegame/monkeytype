import { JSXElement, Show } from "solid-js";

import { AnimeShow } from "../../common/anime";

export function FunboxTimer(props: {
  id: string;
  visible: boolean;
  text: string;
  animated?: boolean;
}): JSXElement {
  const content = () => {
    return (
      <div class="pointer-events-none absolute -top-24 left-1/2 w-max -translate-x-1/2 select-none">
        <div
          id={props.id}
          class="rounded-(--roundness) bg-main p-4 text-center text-base text-bg"
        >
          {props.text}
        </div>
      </div>
    );
  };

  return (
    <Show
      when={props.animated ?? true}
      fallback={<Show when={props.visible}>{content()}</Show>}
    >
      <AnimeShow when={props.visible}>{content()}</AnimeShow>
    </Show>
  );
}
