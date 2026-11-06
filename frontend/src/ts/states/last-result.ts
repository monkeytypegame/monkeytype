import { Mode } from "@monkeytype/schemas/shared";
import { createSignal } from "solid-js";
import { SnapshotResult } from "../constants/default-snapshot";

/** The user's latest saved result. */
export const [getLastResult, setLastResult] = createSignal<
  SnapshotResult<Mode> | undefined
>(undefined);
