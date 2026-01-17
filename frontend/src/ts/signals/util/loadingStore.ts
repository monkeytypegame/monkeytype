import { createSignal, createResource, createEffect } from "solid-js";
import { createStore, Store } from "solid-js/store";
import type { Accessor, Resource } from "solid-js";
import { promiseWithResolvers } from "../../utils/misc";

type State = Pick<Resource<unknown>, "loading" | "error" | "state"> & {
  ready: boolean;
  refreshing: boolean;
};

export type LoadingStore<T> = {
  /**
   * request store to be loaded
   */
  load: () => void;

  /**
   * request store to be refreshed
   */
  refresh: () => void;

  /**
   * reset the resource +  store
   */
  reset: () => void;

  /**
   * store state
   */
  state: Accessor<State>;

  /**
   * the data store
   */
  store: Store<T>;

  /**
   * promise that resolves when the store is ready.
   * rejects if shouldLoad is false
   */
  ready: () => Promise<void>;
};

export function createLoadingStore<T extends object>(
  fetcher: () => Promise<T>,
  initialValue: () => T,
): LoadingStore<T> {
  const [shouldLoad, setShouldLoad] = createSignal(false);
  const [getState, setState] = createSignal<State>({
    state: "unresolved",
    loading: false,
    ready: false,
    refreshing: false,
    error: undefined,
  });

  const [resource, { refetch }] = createResource(
    () => (shouldLoad() ? true : null),
    async () => {
      return fetcher();
    },
  );

  const [store, setStore] = createStore<T>(initialValue());
  let ready = promiseWithResolvers();

  const updateState = (
    state: Resource<unknown>["state"],
    // oxlint-disable-next-line typescript/no-explicit-any
    error?: any,
  ): void => {
    setState({
      state,
      loading: state === "pending",
      ready: state === "ready",
      refreshing: state === "refreshing",
      // oxlint-disable-next-line typescript/no-explicit-any typescript/no-unsafe-assignment
      error: error,
    });
  };

  createEffect(() => {
    if (!shouldLoad()) {
      updateState("unresolved");
      return;
    }
    updateState("pending");

    if (resource.error !== undefined) {
      updateState("errored", resource.error);
      ready.reject(resource.error);
      ready = promiseWithResolvers();
      return;
    }

    const value = resource();
    if (value !== undefined) {
      setStore(value);
      updateState("ready");
      ready.resolve();
      ready = promiseWithResolvers();
    }
  });

  const load = (): void => {
    if (!shouldLoad()) setShouldLoad(true);
  };
  const refresh = (): void => {
    if (!shouldLoad()) {
      setShouldLoad(true);
    }
    ready = promiseWithResolvers();
    updateState("refreshing");
    void refetch();
  };

  const reset = (): void => {
    setShouldLoad(false);

    setStore(initialValue());

    // reject any waiters
    ready.reject(new Error("Reset"));
    ready = promiseWithResolvers();
  };

  return {
    load,
    refresh,
    reset,
    state: getState,
    store,
    ready: async () => {
      load();
      await ready.promise;
      return;
    },
  };
}
