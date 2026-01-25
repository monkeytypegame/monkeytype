import type { Accessor } from "solid-js";
import { createEffect, createResource, createSignal } from "solid-js";
import { createStore, reconcile, Store } from "solid-js/store";
import { promiseWithResolvers } from "../utils/misc";

export type LoadError = Error | { message?: string };
type State =
  | {
      state: "unresolved";
      loading: false;
      ready: false;
      refreshing: false;
      error?: undefined;
    }
  | {
      state: "pending";
      loading: true;
      ready: false;
      refreshing: false;
      error?: undefined;
    }
  | {
      state: "ready";
      loading: false;
      ready: true;
      refreshing: false;
      error?: undefined;
    }
  | {
      state: "refreshing";
      loading: true;
      ready: true;
      refreshing: true;
      error?: undefined;
    }
  | {
      state: "errored";
      loading: false;
      ready: false;
      refreshing: false;
      error: LoadError;
    };

export type AsyncStore<T> = {
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
  store: Accessor<Store<T | undefined>>;

  /**
   * update store with the merged value
   */
  update: (value: Partial<T>) => void;

  /**
   * promise that resolves when the store is ready.
   * rejects if shouldLoad is false
   */
  ready: () => Promise<T>;
};

export function createAsyncStore<T extends object>({
  name,
  fetcher,
  persist,
  initialValue,
  autoLoad,
}: {
  name: string;
  fetcher: () => Promise<T>;
  persist?: (value: T) => Promise<void>;
  initialValue?: () => T;
  autoLoad?: boolean;
}): AsyncStore<T> {
  console.debug(`AsyncStore ${name}: created`);
  const [shouldLoad, setShouldLoad] = createSignal(autoLoad ?? false);
  const [getState, setState] = createSignal<State>({
    state: "unresolved",
    loading: false,
    ready: false,
    refreshing: false,
    error: undefined,
  });

  const [res, { refetch }] = createResource(shouldLoad, async (load) => {
    if (!load) return undefined as unknown as T;
    return fetcher();
  });

  const initVal = initialValue?.();
  const [store, setStore] = createStore<{
    available: boolean;
    value: T | undefined;
  }>({ available: initVal !== undefined, value: initVal });
  let ready = promiseWithResolvers<T>();

  const resetStore = (): void => {
    const fallbackValue = initialValue?.();
    setStore({
      available: fallbackValue !== undefined,
      value: fallbackValue,
    });
  };

  const updateState = (state: State["state"], error?: LoadError): void => {
    console.debug(`AsyncStore ${name}: update state to ${state}.`);
    setState({
      state,
      loading: state === "pending",
      ready: state === "ready",
      refreshing: state === "refreshing",
      error: error,
    } as State);
  };

  //TODO create effect on resource?
  createEffect(() => {
    if (!shouldLoad()) return;
    if (res.error !== undefined) {
      ready.reject(res.error);
      updateState(res.state, res.error as LoadError);
      resetStore();
      return;
    }

    const data = res();
    if (data) {
      updateState(res.state);
      setStore(reconcile({ available: true, value: data }));
      console.debug(`AsyncStore ${name}: updated store to`, store.value);
      ready.resolve(data);
    }
  });

  createEffect(() => {
    if (!shouldLoad()) {
      updateState("unresolved");
      return;
    }
    updateState("pending");
  });

  const load = (): void => {
    if (!shouldLoad()) setShouldLoad(true);
  };
  const refresh = (): void => {
    if (!shouldLoad()) {
      setShouldLoad(true);
    }
    ready.reset();
    updateState("refreshing");
    void refetch();
  };

  const reset = (): void => {
    setShouldLoad(false);
    resetStore();
    updateState("unresolved");

    // reject any waiters
    const oldReady = ready;
    ready = promiseWithResolvers<T>();
    oldReady.reject?.(new Error("Reset"));
  };

  return {
    load,
    refresh,
    reset,
    state: getState,
    store: () => store.value,
    update: (value): void => {
      if (!getState().ready) {
        throw new Error(
          `Store ${name} cannot update in state ${getState().state}`,
        );
      }
      setStore(
        reconcile(
          {
            available: value !== undefined,
            value: { ...store.value, ...value } as T,
          },
          { merge: true },
        ),
      );

      if (persist !== undefined && store.value !== undefined) {
        void persist(store.value).then(() =>
          console.debug(`Store ${name} persisted.`),
        );
      }
    },
    ready: async () => {
      load();
      return ready.promise;
    },
  };
}
