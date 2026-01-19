import { createEffect, createMemo, JSXElement } from "solid-js";
import { createLoadingStore } from "../../signals/util/loadingStore";
import { PartialConfig } from "@monkeytype/schemas/configs";
import Ape from "../../ape";
import { isAuthenticated } from "../../signals/user";
import { Preset } from "@monkeytype/schemas/presets";
import Loader from "./Loader";
import { serverConfiguration } from "../../signals/server-configuration";
import {
  connections,
  friends,
  pendingConnections,
} from "../../signals/connections";
import { GetUserResponse } from "@monkeytype/contracts/users";
import { initSnapshot } from "../../db";
import { Connection } from "@monkeytype/schemas/connections";
import { promiseWithResolvers } from "../../utils/misc";
import { BlockingLoader } from "./BlockingLoader";
import { unwrap } from "solid-js/store";
import { getActivePage } from "../../signals/core";
import { ResultMinified } from "@monkeytype/schemas/results";

const { promise: preloaderDonePromise, resolve: loadDone } =
  promiseWithResolvers();

export { preloaderDonePromise };

export function PreLoader(): JSXElement {
  const user = createLoadingStore<GetUserResponse["data"]>(
    "user",
    async () => {
      const response = await Ape.users.get();

      if (response.status !== 200) {
        throw new Error(response.body.message);
      }
      return response.body.data;
    },

    () => ({}) as GetUserResponse["data"],
  );
  const partialConfig = createLoadingStore<PartialConfig>(
    "userConfig",
    async () => {
      const response = await Ape.configs.get();

      if (response.status !== 200) {
        throw new Error(response.body.message);
      }
      return response.body.data as PartialConfig;
    },

    () => ({}) as PartialConfig,
  );
  const presets = createLoadingStore<Preset[]>(
    "presets",
    async () => {
      const response = await Ape.presets.get();

      if (response.status !== 200) {
        throw new Error(response.body.message);
      }
      return response.body.data;
    },

    () => [],
  );

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

    console.debug("PreLoader: cleaning user data.");
    [partialConfig, user, presets, results].forEach((it) => it.reset());
  });

  const load = createMemo(() => {
    const page = getActivePage();
    const stores = {
      userData: {
        store: user,
        keyframe: {
          percentage: 0,
          text: "Downloading user data...",
        },
      },
      configData: {
        store: partialConfig,
        keyframe: {
          percentage: 0,
          text: "Downloading user config...",
        },
      },
      presetsData: {
        store: presets,
        keyframe: {
          percentage: 0,
          text: "Downloading user presets...",
        },
      },
      connectionsData: {
        store: connections,
        keyframe: {
          percentage: 0,
          text: "Downloading connections...",
        },
      },
      ...(page === "friends" && {
        friends: {
          store: friends,
          keyframe: { percentage: 0, text: "Downloading friends..." },
        },
        pendingConnections: {
          store: pendingConnections,
          keyframe: {
            percentage: 0,

            text: "Downloading friend requests...",
          },
        },
      }),
      ...(page === "account" && {
        results: {
          store: results,
          keyframe: {
            percentage: 90,
            text: "Downloading results...",
          },
        },
      }),
    };
    const inc = Math.ceil(100 / Object.keys(stores).length);
    let percentage = inc;
    for (const store of Object.values(stores)) {
      store.keyframe["percentage"] = percentage;
      percentage += inc;
    }

    console.log("##### update load", stores);
    return stores;
  });

  return (
    <Loader
      active={() => isAuthenticated() && serverConfiguration.state().ready}
      loader={(kf) => <BlockingLoader keyframe={kf} />}
      onComplete={isLoaded}
      load={() => load()}
    />
  );
}

function isLoaded(stores: {
  userData: GetUserResponse["data"];
  configData: PartialConfig;
  presetsData: Preset[];
  connectionsData: Connection[];
}): void {
  console.log("preloader done loading", stores.userData.name);
  void initSnapshot({
    userData: unwrap(stores.userData),
    configData: unwrap(stores.configData),
    presetsData: unwrap(stores.presetsData),
    connectionsData: unwrap(stores.connectionsData),
  });
  loadDone();
}
