import type { Accessor, Resource, Setter } from "solid-js";
import { createEffect, createResource, createSignal } from "solid-js";
import {
  createStore,
  produce,
  reconcile,
  SetStoreFunction,
  Store,
} from "solid-js/store";
import { promiseWithResolvers } from "../utils/misc";
import { createEffectOn } from "./effects";

export type LoadError = Error | { message?: string };

type ValueWrapper<T> = {
  available: boolean;
  value: T | undefined;
};

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

export type AsyncStorePropertries<T> = {
  name: string;
  fetcher: () => Promise<T | undefined>;
  persist?: (value: T) => Promise<void>;
  initialValue?: () => T;
  autoLoad?: Accessor<boolean>;
};

export function createAsyncStore<T extends object>(
  props: AsyncStorePropertries<T>,
): AsyncStore<T> {
  return new AsyncStore(props);
}

export function createAsyncArrayStore<T>(
  props: AsyncStorePropertries<T[]>,
): AsyncArrayStore<T> {
  return new AsyncArrayStore(props);
}

export class AsyncStore<T> {
  private name: string;
  private fetcher: () => Promise<T | undefined>;
  private persist?: (value: T) => Promise<void>;
  private initialValue?: () => T;

  private shouldLoad: Accessor<boolean>;
  private setShouldLoad: Setter<boolean>;

  private getState: Accessor<State>;
  private setState: Setter<State>;

  private res: Resource<T | undefined>;
  private refetch: () => void;

  protected _store: ValueWrapper<T>;
  protected setStore: SetStoreFunction<ValueWrapper<T>>;

  private readyPromise = promiseWithResolvers<T>();
  constructor({
    name,
    fetcher,
    persist,
    initialValue,
    autoLoad,
  }: AsyncStorePropertries<T>) {
    console.debug(`AsyncStore ${name}: created`);

    this.name = name;
    this.fetcher = fetcher;
    this.persist = persist;
    this.initialValue = initialValue;

    [this.shouldLoad, this.setShouldLoad] = createSignal(autoLoad?.() ?? false);

    [this.getState, this.setState] = createSignal<State>({
      state: "unresolved",
      loading: false,
      ready: false,
      refreshing: false,
      error: undefined,
    });

    [this.res, { refetch: this.refetch }] = createResource(
      this.shouldLoad,
      async (load) => {
        if (!load) return undefined as unknown as T;
        return this.fetcher();
      },
    );

    const initVal = this.initialValue?.();
    [this._store, this.setStore] = createStore<ValueWrapper<T>>({
      available: initVal !== undefined,
      value: initVal,
    });

    this.setupEffects(autoLoad);
  }

  /**
   * request store to be loaded
   */
  load(): void {
    if (!this.shouldLoad()) this.setShouldLoad(true);
  }

  /**
   * request store to be refreshed
   */
  refresh(): void {
    if (!this.shouldLoad()) {
      this.setShouldLoad(true);
    }
    this.readyPromise.reset();
    this.updateState("refreshing");
    this.refetch();
  }

  /**
   * reset the resource +  store
   */
  reset(): void {
    this.setShouldLoad(false);
    this.resetStore();
    this.updateState("unresolved");

    const oldReady = this.readyPromise;
    this.readyPromise = promiseWithResolvers<T>();
    oldReady.promise.catch(() => {
      /* */
    });
    oldReady.reject?.(new Error("Reset"));
  }

  /**
   * update store with the merged value
   */
  update(value: Partial<T>): void {
    this.checkReady();
    this.setStore(
      reconcile(
        {
          available: value !== undefined,
          value: { ...this._store.value, ...value } as T,
        },
        { merge: true },
      ),
    );
    this.doPersist();
  }

  /**
   * promise that resolves when the store is ready.
   * rejects if shouldLoad is false
   */
  async ready(): Promise<T> {
    this.load();
    return this.readyPromise.promise;
  }

  get store(): Store<T | undefined> {
    return this._store.value;
  }
  get state(): State {
    return this.getState();
  }

  get value(): Store<T | undefined> {
    return this._store.value;
  }

  private resetStore(): void {
    const fallbackValue = this.initialValue?.();
    this.setStore({
      available: fallbackValue !== undefined,
      value: fallbackValue,
    });
  }

  private updateState(state: State["state"], error?: LoadError): void {
    console.debug(`AsyncStore ${this.name}: update state to ${state}.`);
    this.setState({
      state,
      loading: state === "pending",
      ready: state === "ready",
      refreshing: state === "refreshing",
      error,
    } as State);
  }

  protected checkReady(): void {
    if (!this.getState().ready) {
      throw new Error(
        `Store ${this.name} cannot update in state ${this.getState().state}`,
      );
    }
  }

  protected doPersist(): void {
    if (this.persist && this._store.value !== undefined) {
      void this.persist(this._store.value)
        .then(() => console.debug(`Store ${this.name} persisted.`))
        .catch((error: unknown) => {
          console.debug(`AsyncStore ${this.name}: persist failed with`, error);
          this.refresh();
        });
    }
  }

  private setupEffects(autoLoad?: Accessor<boolean>): void {
    createEffect(() => {
      if (!this.shouldLoad()) return;

      if (this.res.error !== undefined) {
        this.readyPromise.reject(this.res.error);
        this.updateState(this.res.state, this.res.error as LoadError);
        this.resetStore();
        return;
      }

      const data = this.res();
      if (data !== undefined) {
        this.updateState(this.res.state);
        this.setStore(reconcile({ available: true, value: data }));
        console.debug(
          `AsyncStore ${this.name}: updated store to`,
          this._store.value,
        );
        this.readyPromise.resolve(data);
      }
    });

    createEffect(() => {
      if (!this.shouldLoad()) {
        this.updateState("unresolved");
        return;
      }
      this.updateState("pending");
    });

    if (autoLoad) {
      createEffectOn(autoLoad, (val) => {
        if (val !== undefined) this.setShouldLoad(val);
      });
    }
  }
}

class AsyncArrayStore<T> extends AsyncStore<T[]> {
  /**
   * add item to the end of the array
   * @param item
   */
  addItem(item: T): void {
    this.checkReady();
    this.setStore(
      "value",
      produce((items) => {
        items?.push(item);
      }),
    );
    this.doPersist();
  }

  /**
   * remove all items from the array matching the predicate
   * @param predicate
   */
  removeItem(predicate: (item: T) => boolean): void {
    this.checkReady();

    this.setStore(
      reconcile({
        available: true,
        value: this._store?.value?.filter((item) => !predicate(item)),
      }),
    );
    this.doPersist();
  }

  /**
   * update all items in the array matching the predicate
   * @param predicate
   * @param updater
   */
  updateItem(predicate: (item: T) => boolean, value: Partial<T>): void {
    this.checkReady();

    const items = this._store.value;
    if (!items) return;

    const index = items.findIndex(predicate);
    if (index === -1) return;

    this.setStore(
      "value",
      index,
      reconcile({ ...items[index], ...value } as T),
    );

    this.doPersist();
  }
}
