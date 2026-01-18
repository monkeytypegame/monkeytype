import { ErrorBoundary, JSXElement, Resource, Show, Suspense } from "solid-js";
import { createErrorMessage } from "../../utils/misc";
import * as Notifications from "../../elements/notifications";
import { Conditional } from "./Conditional";
import { LoadingStore } from "../../signals/util/loadingStore";

export default function AsyncContent<T>(
  props: {
    errorMessage?: string;
  } & (
    | {
        resource: Resource<T | undefined>;
        loadingStore?: never;
      }
    | {
        loadingStore: LoadingStore<T | undefined>;
        resource?: never;
      }
  ) &
    (
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
  const source =
    props.resource !== undefined
      ? {
          value: () => props.resource(),
          loading: () => props.resource.loading,
        }
      : {
          value: () => props.loadingStore.store,
          loading: () => props.loadingStore.state().loading,
        };

  const value = () => {
    try {
      return source.value();
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
            <Show when={p.showLoader && source.loading()}>
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
              when={source.value() !== null && source.value() !== undefined}
            >
              {props.children(source.value() as T)}
            </Show>
          </Suspense>
        </ErrorBoundary>
      }
    />
  );
}
