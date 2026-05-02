import { UseQueryResult } from "@tanstack/solid-query";
import {
  Accessor,
  createMemo,
  ErrorBoundary,
  JSXElement,
  Match,
  Show,
  Switch,
} from "solid-js";

import { showErrorNotification } from "../../states/notifications";
import { createErrorMessage } from "../../utils/error";
import { typedKeys } from "../../utils/misc";
import { LoadingCircle } from "./LoadingCircle";

type AsyncEntry<T> = {
  value: () => T | undefined;
  isLoading: () => boolean;
  isError: () => boolean;
  error?: () => unknown;
};

type Collection<T> = Accessor<T> & {
  isLoading: boolean;
  isError: boolean;
};

type QueryMapping = Record<string, unknown> | unknown;
type AsyncMap<T extends QueryMapping> = {
  [K in keyof T]: AsyncEntry<T[K]>;
};

type BaseProps = {
  errorMessage?: string;
  ignoreError?: true;
  loader?: JSXElement;
  errorClass?: string;
};

type QueryProps<T extends QueryMapping> = {
  queries: { [K in keyof T]: UseQueryResult<T[K]> };
};

type SingleQueryProps<T> = {
  query: UseQueryResult<T>;
};

type CollectionProps<T extends QueryMapping> = {
  collections: { [K in keyof T]: Collection<T[K]> };
};

type SingleCollectionProps<T> = {
  collection: Collection<T>;
};

type AccessorMap<T> = { [K in keyof T]: Accessor<T[K]> };

type DeferredChildren<T extends QueryMapping> = {
  alwaysShowContent?: false;
  children: (data: Accessor<{ [K in keyof T]: T[K] }>) => JSXElement;
};

type EagerChildren<T extends QueryMapping> = {
  alwaysShowContent: true;
  showLoader?: true;
  children: (
    data: Accessor<{ [K in keyof T]: T[K] } | undefined>,
  ) => JSXElement;
};

type MultiDeferredChildren<T extends QueryMapping> = {
  alwaysShowContent?: false;
  children: (data: AccessorMap<{ [K in keyof T]: T[K] }>) => JSXElement;
};

type MultiEagerChildren<T extends QueryMapping> = {
  alwaysShowContent: true;
  showLoader?: true;
  children: (
    data: AccessorMap<{ [K in keyof T]: T[K] | undefined }>,
  ) => JSXElement;
};

type SingleSource<T> = SingleQueryProps<T> | SingleCollectionProps<T>;
type MultiSource<T extends QueryMapping> = QueryProps<T> | CollectionProps<T>;
type SingleChildren<T> = DeferredChildren<T> | EagerChildren<T>;
type MultiChildren<T extends QueryMapping> =
  | MultiDeferredChildren<T>
  | MultiEagerChildren<T>;

export type Props<T extends QueryMapping> = BaseProps &
  (SingleSource<T> | MultiSource<T>) &
  (SingleChildren<T> | MultiChildren<T>);

// Single query/collection overloads
function AsyncContent<T>(
  props: BaseProps & SingleSource<T> & SingleChildren<T>,
): JSXElement;
// Multi query/collection overloads
function AsyncContent<T extends Record<string, unknown>>(
  props: BaseProps & MultiSource<T> & MultiChildren<T>,
): JSXElement;
function AsyncContent<T extends QueryMapping>(props: Props<T>): JSXElement {
  //@ts-expect-error this is fine
  const source = createMemo<AsyncMap<T>>(() => {
    if ("query" in props) {
      return fromQueries({ defaultQuery: props.query });
    } else if ("queries" in props) {
      return fromQueries(props.queries);
    } else if ("collection" in props) {
      return fromCollections({ defaultQuery: props.collection });
    } else if ("collections" in props) {
      return fromCollections(props.collections);
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

    showErrorNotification(props.errorMessage ?? "An error occurred", {
      error: err,
    });

    return message;
  };

  const allResolved = (
    data: ReturnType<typeof value>,
  ): data is { [K in keyof T]: T[K] } => {
    //single query
    if (data === undefined || data === null) {
      return false;
    }
    if ("defaultQuery" in source()) return true;

    return Object.values(data).every((v) => v !== undefined && v !== null);
  };

  const isLoading = (): boolean =>
    Object.values(source() as AsyncEntry<unknown>[]).some((s) => s.isLoading());

  const firstError = (): unknown | undefined =>
    Object.values(source() as AsyncEntry<unknown>[])
      .find((s) => s.isError())
      ?.error?.();

  // Keep the last resolved value so deferred children stay mounted during
  // transient loading states (e.g. navigating away and back).
  const lastResolvedValue = createMemo<T | undefined>((prev) => {
    const current = value();
    return allResolved(current) ? current : prev;
  });

  const hasResolved = createMemo<boolean>(
    (prev) => prev || lastResolvedValue() !== undefined,
    false,
  );

  // Keys are stable for the component lifetime; per-key closures track
  // reactivity internally via value()/lastResolvedValue().
  // oxlint-disable solid/reactivity
  const multi = !("defaultQuery" in source());

  const eagerAccessorMap = multi
    ? (Object.fromEntries(
        typedKeys(source()).map((key) => [key, () => value()?.[key]]),
      ) as AccessorMap<{ [K in keyof T]: T[K] | undefined }>)
    : undefined;

  const deferredAccessorMap = multi
    ? (Object.fromEntries(
        typedKeys(source()).map((key) => [
          key,
          () => lastResolvedValue()?.[key],
        ]),
      ) as AccessorMap<{ [K in keyof T]: T[K] }>)
    : undefined;
  // oxlint-enable solid/reactivity

  const loader = (): JSXElement =>
    props.loader ?? <LoadingCircle class="p-4 text-center text-2xl" />;

  const errorText = (err: unknown): JSXElement | undefined =>
    props.ignoreError ? undefined : (
      <div class={props.errorClass}>{handleError(err)}</div>
    );

  // Only show loader on initial load, not on refetches
  const showLoader = (): boolean =>
    isLoading() &&
    !props.alwaysShowContent &&
    lastResolvedValue() === undefined;

  return (
    <ErrorBoundary fallback={props.ignoreError ? undefined : errorText}>
      <Switch
        fallback={
          <>
            <Show when={showLoader()}>{loader()}</Show>
            <Show
              when={props.alwaysShowContent === true}
              fallback={
                <Show when={hasResolved()}>
                  {(_) =>
                    // oxlint-disable-next-line typescript/no-explicit-any
                    (props.children as (data: any) => JSXElement)(
                      multi ? deferredAccessorMap : lastResolvedValue,
                    )
                  }
                </Show>
              }
            >
              {/* oxlint-disable-next-line typescript/no-explicit-any */}
              {(props.children as (data: any) => JSXElement)(
                multi ? eagerAccessorMap : value,
              )}
            </Show>
          </>
        }
      >
        <Match when={!props.ignoreError && firstError() !== undefined}>
          {errorText(firstError())}
        </Match>

        <Match when={showLoader()}>{loader()}</Match>
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

function fromCollections<T extends Record<string, unknown>>(collections: {
  [K in keyof T]: Collection<T[K]>;
}): AsyncMap<T> {
  return typedKeys(collections).reduce((acc, key) => {
    const q = collections[key];
    acc[key] = {
      value: () => q(),
      isLoading: () => q.isLoading,
      isError: () => q.isError,
    };
    return acc;
  }, {} as AsyncMap<T>);
}

export default AsyncContent;
