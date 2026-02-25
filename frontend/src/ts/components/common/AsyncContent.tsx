import { UseQueryResult } from "@tanstack/solid-query";
import {
  createMemo,
  ErrorBoundary,
  JSXElement,
  Match,
  Show,
  Switch,
} from "solid-js";

import * as Notifications from "../../elements/notifications";
import { createErrorMessage, typedKeys } from "../../utils/misc";
import { Conditional } from "./Conditional";
import { LoadingCircle } from "./LoadingCircle";

type AsyncEntry<T> = {
  value: () => T | undefined;
  isLoading: () => boolean;
  isError: () => boolean;
  error?: () => unknown;
};

type QueryMapping = Record<string, unknown> | unknown;
type AsyncMap<T extends QueryMapping> = {
  [K in keyof T]: AsyncEntry<T[K]>;
};

type BaseProps = {
  errorMessage?: string;
  ignoreError?: true;
  loader?: JSXElement;
};

type QueryProps<T extends QueryMapping> = {
  queries: { [K in keyof T]: UseQueryResult<T[K]> };
  query?: never;
};

type SingleQueryProps<T> = {
  query: UseQueryResult<T>;
  queries?: never;
};

type DeferredChildren<T extends QueryMapping> = {
  alwaysShowContent?: false;
  children: (data: { [K in keyof T]: T[K] }) => JSXElement;
};

type EagerChildren<T extends QueryMapping> = {
  alwaysShowContent: true;
  showLoader?: true;
  children: (data: { [K in keyof T]: T[K] | undefined }) => JSXElement;
};

export type Props<T extends QueryMapping> = BaseProps &
  (QueryProps<T> | SingleQueryProps<T>) &
  (DeferredChildren<T> | EagerChildren<T>);

export default function AsyncContent<T extends QueryMapping>(
  props: Props<T>,
): JSXElement {
  //@ts-expect-error this is fine
  const source = createMemo<AsyncMap<T>>(() => {
    if (props.query !== undefined) {
      return fromQueries({ defaultQuery: props.query });
    } else {
      return fromQueries(props.queries);
    }
  });

  const value = (): T => {
    if ("defaultQuery" in source()) {
      //@ts-expect-error we know the property is present
      // oxlint-disable-next-line typescript/no-unsafe-call typescript/no-unsafe-member-access
      return source().defaultQuery.value() as T;
    } else {
      return Object.fromEntries(
        typedKeys(source()).map((key) => [key, source()[key].value()]),
      ) as T; // For multiple queries
    }
  };

  const handleError = (err: unknown): string => {
    const message = createErrorMessage(
      err,
      props.errorMessage ?? "An error occurred",
    );
    console.error("AsyncMultiContent failed", message, err);

    Notifications.add(message, -1);

    return message;
  };

  function allResolved(
    data: ReturnType<typeof value>,
  ): data is { [K in keyof T]: T[K] } {
    //single query
    if (data === undefined || data === null) {
      return false;
    }

    return Object.values(data).every((v) => v !== undefined && v !== null);
  }

  const isLoading = (): boolean =>
    Object.values(source() as AsyncEntry<unknown>[]).some((s) => s.isLoading());

  const firstError = (): unknown | undefined =>
    Object.values(source() as AsyncEntry<unknown>[])
      .find((s) => s.isError())
      ?.error?.();

  const loader = (): JSXElement =>
    props.loader ?? <LoadingCircle class="p-4 text-center text-2xl" />;

  const errorText = (err: unknown): JSXElement | undefined =>
    props.ignoreError ? undefined : <div class="error">{handleError(err)}</div>;

  return (
    <ErrorBoundary fallback={props.ignoreError ? undefined : errorText}>
      <Switch
        fallback={
          <>
            <Show when={isLoading() && !props.alwaysShowContent}>
              {loader()}
            </Show>

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
        <Match when={!props.ignoreError && firstError() !== undefined}>
          {errorText(firstError())}
        </Match>

        <Match when={isLoading() && !props.alwaysShowContent}>{loader()}</Match>
      </Switch>
    </ErrorBoundary>
  );
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
