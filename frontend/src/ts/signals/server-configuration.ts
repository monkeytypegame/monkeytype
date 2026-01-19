import { Configuration } from "@monkeytype/schemas/configuration";
import { createLoadingStore } from "./util/loadingStore";
import Ape from "../ape";

export const serverConfiguration = createLoadingStore<Configuration>(
  "serverConfig",
  async () => {
    const response = await Ape.configuration.get();

    if (response.status !== 200) {
      throw new Error(response.body.message);
    }
    return response.body.data;
  },
  () => ({}) as Configuration,
);
