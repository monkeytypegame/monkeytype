import { JSXElement, Resource, Show } from "solid-js";
import { createErrorMessage } from "../utils/misc";
import * as Notifications from "../elements/notifications";

export default function AsyncContent2<T>(props: {
  resource: Resource<T | undefined>;
  errorMessage?: string;
  children: (data: T | undefined) => JSXElement;
}): JSXElement {
  const value = () => {
    try {
      return props.resource();
    } catch (err) {
      const message = createErrorMessage(
        err,
        props.errorMessage ?? "An error occured",
      );
      console.error("AsyncContent error:", message);
      Notifications.add(message, -1);
      return undefined;
    }
  };

  return (
    <>
      <Show when={props.resource.loading}>
        <div class="preloader">
          <i class="fas fa-fw fa-spin fa-circle-notch"></i>
        </div>
      </Show>

      {props.children(value())}
    </>
  );
}
