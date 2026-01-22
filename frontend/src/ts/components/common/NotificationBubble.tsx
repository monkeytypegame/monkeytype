import { Accessor, JSXElement, Show } from "solid-js";

export function NotificationBubble(props: {
  show: Accessor<boolean>;
}): JSXElement {
  return (
    <Show when={props.show()}>
      <div class="bg-main ring-bg absolute top-0 right-0 m-[0.375em] h-[0.5em] w-[0.5em] rounded-full ring-[0.25em]"></div>
    </Show>
  );
}
