import { Connection } from "@monkeytype/schemas/connections";
import { createLoadingStore } from "./util/loadingStore";
import Ape from "../ape/";
import { createEffect } from "solid-js";
import { isAuthenticated } from "./user";
import { serverConfiguration } from "./server-configuration";

export const connections = createLoadingStore<Connection[]>(
  "connections",
  async () => {
    if (!serverConfiguration.store.connections.enabled) return [];
    const response = await Ape.connections.get();

    if (response.status !== 200) {
      throw new Error(response.body.message);
    }
    return response.body.data;
  },
  () => [],
);

createEffect(() => {
  const authenticated = isAuthenticated();
  console.log("### isAuthenticated: ", authenticated);
  //TODO check logout during refresh
  if (!authenticated && connections.state().ready) {
    connections.reset();
  }
});

//from legacy code
//await connections.ready;
