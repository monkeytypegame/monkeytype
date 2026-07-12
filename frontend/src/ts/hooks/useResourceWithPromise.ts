import { Accessor, createEffect, createResource } from "solid-js";
import { promiseWithResolvers } from "../utils/misc";

export function useResourceWithPromise<TSource, TData>(
  source: Accessor<TSource>,
  loader: (source: TSource) => Promise<TData>,
): [() => TData | undefined, { promise: Promise<void>; reset: () => void }] {
  const [resource] = createResource(source, loader);
  const { promise, reset, resolve, reject } = promiseWithResolvers();

  createEffect(() => {
    const state = resource.state;
    reset();
    if (state === "ready") {
      resolve();
    }
    if (state === "errored") {
      reject(new Error("failed to fetch resource"));
    }
  });

  return [resource, { promise, reset }];
}
