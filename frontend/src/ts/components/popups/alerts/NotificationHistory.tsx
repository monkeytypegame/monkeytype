import { JSXElement } from "solid-js";

import { H2 } from "../../common/Headers";

export function NotificationHistory(): JSXElement {
  return (
    <>
      <H2
        fa={{ icon: "fa-comment-alt" }}
        text="Notifications"
        class="text-lg"
      />
      Nothing to show
    </>
  );
}
