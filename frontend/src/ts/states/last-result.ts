import { Mode } from "@monkeytype/schemas/shared";
import { createSignal } from "solid-js";
import { UserResult } from "../constants/user-data";

/** The user's latest saved result. */
export const [getLastResult, setLastResult] = createSignal<
  UserResult<Mode> | undefined
>(undefined);
