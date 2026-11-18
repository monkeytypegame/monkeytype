import { UserProfile } from "@monkeytype/schemas/users";
import { createSignal } from "solid-js";

import { DeepReadonly } from "../utils/types";

export const [getUserToReport, setUserToReport] =
  createSignal<DeepReadonly<UserProfile> | null>(null);
