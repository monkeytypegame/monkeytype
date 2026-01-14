import { ErrorBoundary, JSXElement, Resource, Show, Suspense } from "solid-js";
import { createErrorMessage } from "../utils/misc";
import * as Notifications from "../elements/notifications";
import { Conditional } from "./Conditional";

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
        props.errorMessage ?? "An error occured",
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
              <div class="preloader">
                <i class="fas fa-fw fa-spin fa-circle-notch"></i>
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
              <div class="preloader">
                <i class="fas fa-fw fa-spin fa-circle-notch"></i>
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
