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
import { createErrorMessage, typedKeys } from "../../utils/misc";

import { Conditional } from "./Conditional";
import { Fa } from "./Fa";

type AsyncEntry<T> = {
  value: () => T | undefined;
  isLoading: () => boolean;
  isError: () => boolean;
  error?: () => unknown;
};

type AsyncMap<T extends Record<string, unknown>> = {
  [K in keyof T]: AsyncEntry<T[K]>;
};

type BaseProps = {
  errorMessage?: string;
};

type ResourceProps<T extends Record<string, unknown>> = {
  query?: never;
  resource: { [K in keyof T]: Resource<T[K]> };
};

type QueryProps<T extends Record<string, unknown>> = {
  query: { [K in keyof T]: UseQueryResult<T[K]> };
  resource?: never;
};

type DeferredChildren<T extends Record<string, unknown>> = {
  alwaysShowContent?: false;
  children: (data: { [K in keyof T]: T[K] }) => JSXElement;
};

type EagerChildren<T extends Record<string, unknown>> = {
  alwaysShowContent: true;
  showLoader?: true;
  children: (data: { [K in keyof T]: T[K] | undefined }) => JSXElement;
};

type Props<T extends Record<string, unknown>> = BaseProps &
  (ResourceProps<T> | QueryProps<T>) &
  (DeferredChildren<T> | EagerChildren<T>);

export default function AsyncMultiContent<T extends Record<string, unknown>>(
  props: Props<T>,
): JSXElement {
  const source = createMemo<AsyncMap<T>>(() => {
    if (props.resource !== undefined) {
      return fromResources(props.resource);
    }
    if (props.query !== undefined) {
      return fromQueries(props.query);
    }
    throw new Error("missing source");
  });

  const handleError = (err: unknown): string => {
    const message = createErrorMessage(
      err,
      props.errorMessage ?? "An error occurred",
    );
    console.error("AsyncMultiContent failed", message, err);
    Notifications.add(message, -1);
    return message;
  };

  const value = (): { [K in keyof T]: T[K] } =>
    Object.fromEntries(
      typedKeys(source()).map((key) => [key, source()[key].value()]),
    ) as { [K in keyof T]: T[K] };

  function allResolved(
    data: ReturnType<typeof value>,
  ): data is { [K in keyof T]: T[K] } {
    return Object.values(data).every((v) => v !== undefined && v !== null);
  }

  const isLoading = (): boolean =>
    Object.values(source() as AsyncEntry<unknown>[]).some((s) => s.isLoading());

  const firstError = (): unknown | undefined =>
    Object.values(source() as AsyncEntry<unknown>[])
      .find((s) => s.isError())
      ?.error?.();

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
            <Show when={isLoading() && !props.alwaysShowContent}>{loader}</Show>

            <Conditional
              if={props.alwaysShowContent === true}
              then={<>{props.children(value())}</>}
              else={
                <Show when={allResolved(value())}>
                  {props.children(value())}
                </Show>
              }
            />
          </>
        }
      >
        <Match when={firstError() !== undefined}>
          {errorText(firstError())}
        </Match>

        <Match when={isLoading() && !props.alwaysShowContent}>{loader}</Match>
      </Switch>
    </ErrorBoundary>
  );
}

function fromResources<T extends Record<string, unknown>>(resources: {
  [K in keyof T]: Resource<T[K]>;
}): AsyncMap<T> {
  return typedKeys(resources).reduce((acc, key) => {
    const r = resources[key];
    acc[key] = {
      value: () => r(),
      isLoading: () => r.loading,
      isError: () => false,
    };
    return acc;
  }, {} as AsyncMap<T>);
}

function fromQueries<T extends Record<string, unknown>>(queries: {
  [K in keyof T]: UseQueryResult<T[K]>;
}): AsyncMap<T> {
  return typedKeys(queries).reduce((acc, key) => {
    const q = queries[key];
    acc[key] = {
      value: () => q.data,
      isLoading: () => q.isLoading,
      isError: () => q.isError,
      error: () => q.error,
    };
    return acc;
  }, {} as AsyncMap<T>);
}
