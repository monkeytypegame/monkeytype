import { UseQueryResult } from "@tanstack/solid-query";
import {
  createMemo,
  ErrorBoundary,
  JSXElement,
  Resource,
  Show,
} from "solid-js";

import * as Notifications from "../../elements/notifications";
import { createErrorMessage } from "../../utils/misc";

import { Conditional } from "./Conditional";
import { Fa } from "./Fa";

export default function AsyncContent<T>(
  props: {
    errorMessage?: string;
  } & (
    | {
        resource: Resource<T | undefined>;
        query?: never;
      }
    | {
        resource?: never;
        query: UseQueryResult<T>;
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
  const source = createMemo(() => {
    if (props.resource !== undefined) {
      return {
        value: props.resource,
        loading: () => props.resource.loading,
      };
    }

    if (props.query !== undefined) {
      return {
        value: () => props.query.data,
        loading: () => props.query?.isLoading,
      };
    }
    throw new Error("missing source");
  });

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

  const loader = (
    <div class="preloader text-main p-4 text-center text-2xl">
      <Fa icon="fa-circle-notch" fixedWidth spin />
    </div>
  );

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
