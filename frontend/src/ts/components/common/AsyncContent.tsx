import { UseQueryResult } from "@tanstack/solid-query";
import {
  createMemo,
  ErrorBoundary,
  JSXElement,
  Match,
  Resource,
  Show,
  Switch,
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
          alwaysShowContent: true;
          showLoader?: true;
          children: (data: T | undefined) => JSXElement;
        }
    ),
): JSXElement {
  const source = createMemo(() => {
    if (props.resource !== undefined) {
      return {
        value: props.resource,
        isLoading: () => props.resource.loading,
        isError: () => false,
      };
    }

    if (props.query !== undefined) {
      return {
        value: () => props.query.data,
        isLoading: () => props.query?.isLoading,
        isError: () => props.query.isError,
        error: () => props.query.error,
      };
    }
    throw new Error("missing source");
  });

  const value = () => {
    try {
      return source().value;
    } catch (err) {
      handleError(err);
      return undefined;
    }
  };
  const handleError = (err: unknown): string => {
    const message = createErrorMessage(
      err,
      props.errorMessage ?? "An error occurred",
    );
    console.error("AsyncContext failed", message, err);
    Notifications.add(message, -1);
    return message;
  };

  const loader = (
    <div class="preloader p-4 text-center text-2xl text-main">
      <Fa icon="fa-circle-notch" fixedWidth spin />
    </div>
  );

  const errorText = (err: unknown): JSXElement => (
    <div class="error">{handleError(err)}</div>
  );
  return (
    <ErrorBoundary fallback={errorText}>
      <Switch
        fallback={
          <>
            <Show when={source().isLoading() && !props.alwaysShowContent}>
              {loader}
            </Show>
            <Conditional
              if={props.alwaysShowContent === true}
              then={(() => {
                const p = props as {
                  children: (data: T | undefined) => JSXElement;
                };
                return <>{p.children(value()?.())}</>;
              })()}
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
          </>
        }
      >
        <Match when={source().isError()}>{errorText(source().error?.())}</Match>
        <Match when={source().isLoading() && !props.alwaysShowContent}>
          {loader}
        </Match>
      </Switch>
    </ErrorBoundary>
  );
}
