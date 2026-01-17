import { createSignal, createResource, createEffect } from "solid-js";
import { createStore, Store } from "solid-js/store";
import type { Accessor, Resource } from "solid-js";

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
   * resource to be used to get loading and error states
   */
  resource: Resource<T>;

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

  const [resource, { refetch, mutate }] = createResource(
    shouldLoad,
    async (load) => {
      if (!load) {
        throw new Error("Load not requested");
      }
      const result = await fetcher();

      //@ts-expect-error TODO
      mutate(result);

      return result;
    },
  );

  const [store, setStore] = createStore<T>(initialValue());
  let ready = createReadyPromise();

  createEffect(() => {
    console.log("watch resource", resource.state);
    if (resource.state === "pending") return;

    if (resource.error !== undefined) {
      //TODO figure out why this is causes logout
      //ready.reject(resource.error);
      //reset for next attempt
      ready = createReadyPromise();
      return;
    }

    const value = resource();
    if (value !== undefined) {
      setStore(value);
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

      // reset resource + store
      mutate(undefined);
      setStore(initialValue());

      // reject any waiters
      //TODO figure out why this is uncaught
      //ready.reject(new Error("Reset"));
      ready = createReadyPromise();
    },
    resource,
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
