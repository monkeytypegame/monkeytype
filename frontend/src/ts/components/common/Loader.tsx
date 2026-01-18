import { JSXElement } from "solid-js";
import { LoadingStore } from "../../signals/util/loadingStore";
import { Keyframe } from "../../pages/page";
import { Store } from "solid-js/store";

export default function Loader<T extends string>(props: {
  load: Record<T, { store: LoadingStore<any>; keyframe?: Keyframe }>;
  showLoader?: boolean;
  errorMessage?: string;
  children: (data: Record<T, Store<any>>) => JSXElement;
}): JSXElement {
  return (
    <>
      <div> Loading stores ...</div>
      {props.children(
        Object.fromEntries(
          Object.entries(props.load).map(([key, value]) => [
            key,
            value.store.store,
          ]),
        ),
      )}
    </>
  );
}
