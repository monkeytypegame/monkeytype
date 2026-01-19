import { Connection } from "@monkeytype/schemas/connections";
import { createLoadingStore } from "./util/loadingStore";
import Ape from "../ape/";
import { createEffect } from "solid-js";
import { isAuthenticated } from "./user";
import { serverConfiguration } from "./server-configuration";
import { Friend } from "@monkeytype/schemas/users";

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

export const friends = createLoadingStore<Friend[]>(
  "friends",
  async () => {
    const response = await Ape.users.getFriends();
    if (response.status !== 200) {
      throw new Error(response.body.message);
    }
    return response.body.data;
  },
  () => [],
);

export const pendingConnections = createLoadingStore<Connection[]>(
  "pendingConnections",
  async () => {
    const response = await Ape.connections.get({
      query: { status: "pending", type: "incoming" },
    });
    if (response.status !== 200) {
      throw new Error(response.body.message);
    }
    return response.body.data;
  },
  () => [],
);

createEffect(() => {
  const authenticated = isAuthenticated();
  console.debug("Connections: clear user data");
  //TODO check logout during refresh
  if (!authenticated) {
    [connections, friends, pendingConnections].forEach((it) => it.reset());
  }
});

//from legacy code
//await connections.ready;
