import { ErrorBoundary, JSXElement, Resource, Show, Suspense } from "solid-js";

import * as Notifications from "../../elements/notifications";
import { createErrorMessage } from "../../utils/misc";

import { Conditional } from "./Conditional";
import { Fa } from "./Fa";

export default function AsyncContent<T>(
  props: {
    resource: Resource<T | undefined>;
    errorMessage?: string;
  } & (
    | {
        alwaysShowContent?: never;
        children: (data: T) => JSXElement;
      }
    | {
        alwaysShowContent: true;
        showLoader?: true;
        children: (data: T | undefined) => JSXElement;
      }
  ),
): JSXElement {
  const value = () => {
    try {
      return props.resource();
    } catch (err) {
      const message = createErrorMessage(
        err,
        props.errorMessage ?? "An error occurred",
      );
      console.error("AsyncContent error:", message);
      Notifications.add(message, -1);
      return undefined;
    }
  };
  const handleError = (err: unknown): string => {
    console.error(err);
    return createErrorMessage(err, props.errorMessage ?? "An error occurred");
  };

  return (
    <Conditional
      if={props.alwaysShowContent === true}
      then={(() => {
        const p = props as {
          showLoader?: true;
          children: (data: T | undefined) => JSXElement;
        };
        return (
          <>
            <Show when={p.showLoader && props.resource.loading}>
              <div class="preloader text-main p-4 text-center text-2xl">
                <Fa icon="fa-circle-notch" fixedWidth spin />
              </div>
            </Show>
            {p.children(value())}
          </>
        );
      })()}
      else={
        <ErrorBoundary
          fallback={(err) => <div class="error">{handleError(err)}</div>}
        >
          <Suspense
            fallback={
              <div class="preloader text-main p-4 text-center text-2xl">
                <Fa icon="fa-circle-notch" fixedWidth spin />
              </div>
            }
          >
            <Show
              when={props.resource() !== null && props.resource() !== undefined}
            >
              {props.children(props.resource() as T)}
            </Show>
          </Suspense>
        </ErrorBoundary>
      }
    />
  );
}
