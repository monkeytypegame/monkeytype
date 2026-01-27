import {
  createMemo,
  ErrorBoundary,
  JSXElement,
  Resource,
  Show,
} from "solid-js";

import * as Notifications from "../../elements/notifications";
import { AsyncStore } from "../../hooks/asyncStore";
import { createErrorMessage } from "../../utils/misc";

import { Conditional } from "./Conditional";
import { LoadingCircle } from "./Loader";

export default function AsyncContent<T>(
  props: {
    errorMessage?: string;
  } & (
    | {
        resource: Resource<T | undefined>;
        asyncStore?: never;
      }
    | {
        asyncStore: AsyncStore<T>;
        resource?: never;
      }
  ) &
    (
      | {
          alwaysShowContent?: never;
          children: (data: T) => JSXElement;
        }
      | {
          alwaysShowContent: boolean;
          showLoader?: true;
          children: (data: T | undefined) => JSXElement;
        }
    ),
): JSXElement {
  const source = createMemo(() =>
    props.resource !== undefined
      ? {
          value: props.resource,
          loading: () => props.resource.loading,
        }
      : {
          value: () => props.asyncStore.store,
          loading: () => props.asyncStore.state.loading,
        },
  );

  const value = () => {
    try {
      return source().value;
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
    console.error("AsyncContext failed", err);
    return createErrorMessage(err, props.errorMessage ?? "An error occurred");
  };

  const loader = <LoadingCircle />;

  const errorText = (err: unknown): JSXElement => (
    <div class="error">{handleError(err)}</div>
  );
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
            <Show when={p.showLoader && source().loading()}>{loader}</Show>
            {p.children(value()?.())}
          </>
        );
      })()}
      else={
        <ErrorBoundary fallback={errorText}>
          <Show when={props.asyncStore?.state.error !== undefined}>
            {errorText(props.asyncStore?.state.error)}
          </Show>

          <Conditional
            if={source().loading()}
            then={loader}
            else={
              <Show
                when={
                  source().value() !== null && source().value() !== undefined
                }
              >
                {props.children(source().value() as T)}
              </Show>
            }
          />
        </ErrorBoundary>
      }
    />
  );
}
