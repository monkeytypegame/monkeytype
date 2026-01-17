import { Connection } from "@monkeytype/schemas/connections";
import { createResourceBackedStore } from "./util/resourceBackedStore";
import Ape from "../ape/";
import { createEffect } from "solid-js";
import { isAuthenticated } from "./user";

export const connections = createResourceBackedStore<Connection[]>(
  async () => {
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
  if (!authenticated) {
    connections.reset();
  }
});

createEffect(() => {
  const loading = connections.loading();
  const error = connections.error();

  console.log("#### change in resource: ", { loading, error });
});

//from legacy code
//await connections.ready;
