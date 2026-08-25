import { ParentProps, Show } from "solid-js";

import { PageName } from "../../pages/page";
import { getActivePage, isAuthenticated } from "../../states/core";

export function Page(
  props: {
    id: PageName;
    needsAuthentication?: boolean;
  } & ParentProps,
) {
  const isOpen = () => getActivePage() === props.id;
  const isAllowed = () => !props.needsAuthentication || isAuthenticated();

  return <Show when={isOpen() && isAllowed()}>{props.children}</Show>;
}
