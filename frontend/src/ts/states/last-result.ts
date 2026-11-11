import { Mode } from "@monkeytype/schemas/shared";
import { createSignal } from "solid-js";
import type { NormalizedLocalResult } from "../collections/results";

/** The user's latest saved result. */
export const [getLastResult, setLastResult] = createSignal<
  NormalizedLocalResult<Mode> | undefined
>(undefined);
