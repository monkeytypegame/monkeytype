import { createSignal, createResource, createEffect } from "solid-js";
import { createStore, Store } from "solid-js/store";
import type { Accessor } from "solid-js";

export type ResourceBackedStore<T> = {
  /**
   * signal
   */
  shouldLoad: Accessor<boolean>;

  /**
   * request store to be loaded
   */
  load: () => void;

  /**
   * request store to be reloaded
   */
  reload: () => void;

  /**
   * reset the resource +  store
   */
  reset: () => void;

  /**
   * store is loading
   */
  loading: Accessor<boolean>;

  /**
   * loading error
   */
  error: Accessor<unknown | undefined>;

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

type ReadyPromise = {
  promise: Promise<void>;
  resolve: () => void;
  reject: (err?: unknown) => void;
};

export function createResourceBackedStore<T extends object>(
  fetcher: () => Promise<T>,
  initialValue: () => T,
): ResourceBackedStore<T> {
  const [shouldLoad, setShouldLoad] = createSignal(false);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<unknown>(undefined);

  const [resource, { refetch }] = createResource(
    () => (shouldLoad() ? true : null),
    async () => {
      return fetcher();
    },
  );

  const [store, setStore] = createStore<T>(initialValue());
  let ready = createReadyPromise();

  createEffect(() => {
    if (!shouldLoad()) {
      setLoading(false);
      setError(undefined);
      return;
    }

    setLoading(resource.loading);

    if (resource.error !== undefined) {
      setError(resource.error);
      //reset store?
      ready = createReadyPromise();
      return;
    }

    const value = resource();
    if (value !== undefined) {
      setStore(value);
      setError(undefined);
      ready.resolve();
    }
  });

  return {
    shouldLoad,
    load: () => setShouldLoad(true),
    reload: () => {
      if (!shouldLoad()) {
        setShouldLoad(true);
      }
      //TODO figure out why this is causes logout
      //ready.reject(new Error("Reloading"));
      ready = createReadyPromise();
      void refetch();
    },
    reset: () => {
      console.log("### reset");
      setShouldLoad(false);
      setLoading(false);
      setError(undefined);

      setStore(initialValue());

      // reject any waiters
      //TODO figure out why this is uncaught
      //ready.reject(new Error("Reset"));
      ready = createReadyPromise();
    },
    loading,
    error,
    store,
    ready: async () => ready.promise,
  };
}

function createReadyPromise(): ReadyPromise {
  let resolve!: () => void;
  let reject!: (err?: unknown) => void;

  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}
