import {
  Accessor,
  createEffect,
  createMemo,
  JSXElement,
  Show,
  on,
} from "solid-js";
import { LoadError, LoadingStore } from "../../signals/util/loadingStore";
import { Keyframe } from "../../pages/page";
import { Store } from "solid-js/store";

type LoadingStoreAndKeyframe = {
  store: LoadingStore<unknown>;
  keyframe?: Keyframe;
};
type LoadShape = Record<string, LoadingStoreAndKeyframe>;
type ChildData<L extends LoadShape> = {
  [K in keyof L]: L[K]["store"] extends LoadingStore<infer D>
    ? Store<D>
    : never;
};

type LoaderProps<L extends LoadShape> = {
  active: true | Accessor<boolean>;
  load: L;
  loader?: (keyframe?: Keyframe) => JSXElement;
  error?: (error: LoadError) => JSXElement;
  onComplete?: (data: ChildData<L>) => void;
  children?: (data: ChildData<L>) => JSXElement;
};

export default function Loader<L extends LoadShape>(
  props: LoaderProps<L>,
): JSXElement {
  const loaders = createMemo<LoadingStoreAndKeyframe[]>(() =>
    Object.values(props.load),
  );

  if (props.active === true) {
    console.debug("Loader: load all stores");
    loaders().forEach((it) => it.store.load());
  } else {
    createEffect(
      on(
        props.active,
        (active) => {
          if (active) {
            console.debug("Loader: load all stores");
            loaders().forEach((it) => it.store.load());
          }
        },
        { defer: true },
      ),
    );
  }

  const stores = createMemo(
    () =>
      Object.fromEntries(
        Object.entries(props.load).map(([key, value]) => [
          key,
          value.store.store,
        ]),
      ) as {
        [K in keyof L]: L[K]["store"] extends LoadingStore<infer D>
          ? Store<D>
          : never;
      },
  );

  let completed = false;
  const allReady = createMemo(() =>
    loaders().every((it) => it.store.state().ready),
  );

  createEffect(() => {
    if (!completed && allReady()) {
      completed = true;
      props.onComplete?.(stores());
    }
  });

  const firstLoadingKeyframe = createMemo<Keyframe | undefined>(() => {
    let min: Keyframe | undefined;

    for (const { store, keyframe } of loaders()) {
      if (!keyframe || !store.state().loading) continue;
      if (!min || keyframe.percentage < min.percentage) {
        min = keyframe;
      }
    }

    return min;
  });

  const hasError = createMemo<LoadError | undefined>(
    () =>
      loaders()
        .map((it) => it.store.state())
        .find((it) => it.error !== undefined)?.error,
  );

  return (
    <Show
      when={firstLoadingKeyframe() === undefined}
      fallback={props.loader?.(firstLoadingKeyframe()) ?? undefined}
    >
      <Show
        when={hasError() === undefined}
        fallback={
          props.error !== undefined ? (
            // oxlint-disable-next-line typescript/no-non-null-assertion
            props.error(hasError()!)
          ) : (
            <p>Loading failed: {hasError()?.message}</p>
          )
        }
      >
        {props.children?.(stores())}
      </Show>
    </Show>
  );
}
