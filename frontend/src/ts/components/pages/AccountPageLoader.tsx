// temporal component, to be removed when page is converted to solid

import { createEffect, JSXElement } from "solid-js";
import { promiseWithResolvers } from "../../utils/misc";
import { createLoadingStore } from "../../signals/util/loadingStore";
import { ResultMinified } from "@monkeytype/schemas/results";
import Ape from "../../ape";
import { isAuthenticated } from "../../signals/user";
import Loader from "../common/Loader";
import { BlockingLoader } from "../common/BlockingLoader";
import { getUserResults } from "../../db";
import { getActivePage } from "../../signals/core";
import { unwrap } from "solid-js/store";

const { promise: acountPageDonePromise, resolve: loadDone } =
  promiseWithResolvers();

export { acountPageDonePromise };

export function AccountPageLoader(): JSXElement {
  const results = createLoadingStore<ResultMinified[]>(
    "results",
    async () => {
      const response = await Ape.results.get();
      if (response.status !== 200) {
        throw new Error(response.body.message);
      }
      return response.body.data;
    },
    () => [],
  );

  createEffect(() => {
    if (!isAuthenticated()) return;
    console.debug("AccountPageLoader: cleaning user data.");
    results.reset();
  });

  return (
    <Loader
      active={() => isAuthenticated() && getActivePage() === "account"}
      load={() => ({
        results: {
          store: results,
          keyframe: {
            percentage: 90,
            text: "Downloading results...",
          },
        },
      })}
      loader={(kf) => <BlockingLoader keyframe={kf} />}
      onComplete={isLoaded}
    />
  );
}

function isLoaded(stores: { results: ResultMinified[] }): void {
  void getUserResults(undefined, unwrap(stores.results)).then(() => loadDone());
}
