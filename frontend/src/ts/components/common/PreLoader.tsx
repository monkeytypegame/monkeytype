import { createEffect, JSXElement } from "solid-js";
import { createLoadingStore } from "../../signals/util/loadingStore";
import { PartialConfig } from "@monkeytype/schemas/configs";
import Ape from "../../ape";
import { isAuthenticated } from "../../signals/user";
import { Preset } from "@monkeytype/schemas/presets";
import Loader from "./Loader";
import { serverConfiguration } from "../../signals/server-configuration";
import { connections } from "../../signals/connections";
import { GetUserResponse } from "@monkeytype/contracts/users";
import { initSnapshot } from "../../db";
import { Connection } from "@monkeytype/schemas/connections";
import { promiseWithResolvers } from "../../utils/misc";

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

  createEffect(() => {
    if (!isAuthenticated()) return;

    console.debug("PreLoader: cleaning user data.");
    [partialConfig, user, presets].forEach((it) => it.reset());
  });

  return (
    <Loader
      active={() => isAuthenticated() && serverConfiguration.state().ready}
      onComplete={isLoaded}
      load={{
        userData: {
          store: user,
          keyframe: {
            percentage: 80,
            durationMs: 1,
            text: "Downloading user data...",
          },
        },
        configData: {
          store: partialConfig,
          keyframe: {
            percentage: 85,
            durationMs: 1,
            text: "Downloading user config...",
          },
        },
        presetsData: {
          store: presets,
          keyframe: {
            percentage: 90,
            durationMs: 1,
            text: "Downloading user presets...",
          },
        },
        connectionsData: {
          store: connections,
          keyframe: {
            percentage: 95,
            durationMs: 1,
            text: "Downloading friends...",
          },
        },
      }}
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
  void initSnapshot(stores);
  loadDone();
}
