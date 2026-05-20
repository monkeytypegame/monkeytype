import { ParentProps, Show } from "solid-js";

import { PageName } from "../../pages/page";
import { getActivePage } from "../../states/core";

export function Page(
  props: {
    id: PageName;
  } & ParentProps,
) {
  const isOpen = () => getActivePage() === props.id;
  return (
    <Show when={isOpen()} fallback="page not active">
      {props.children}
    </Show>
  );
}
