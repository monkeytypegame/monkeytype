import { createSignal, createResource, createEffect } from "solid-js";
import { createStore, Store } from "solid-js/store";
import type { Accessor, Resource } from "solid-js";
import { promiseWithResolvers } from "../../utils/misc";

export type LoadError = Error | { message?: string };
type State = Pick<Resource<unknown>, "loading" | "state"> & {
  error?: LoadError;
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
  name: string,
  fetcher: () => Promise<T>,
  initialValue: () => T,
): LoadingStore<T> {
  console.debug(`LoadingStore ${name}: created`);
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
    error?: LoadError,
  ): void => {
    console.debug(`LoadingStore ${name}: update state to ${state}`);
    setState({
      state,
      loading: state === "pending",
      ready: state === "ready",
      refreshing: state === "refreshing",
      error: error,
    });
  };

  createEffect(() => {
    if (!shouldLoad()) {
      updateState("unresolved");
      return;
    }
    updateState("pending");
    console.log("res:", resource.state);

    if (resource.error !== undefined) {
      updateState("errored", resource.error as LoadError);
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
    //TODO figue out why this in unhandled
    //ready.reject(new Error("Reset"));
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
