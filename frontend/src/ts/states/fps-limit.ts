import { z } from "zod";

import { createLocalStorageSignal } from "../hooks/createLocalStorageSignal";

export const fpsLimitSchema = z.number().int().min(15).max(1000);

// not part of the config schema on purpose - this is a local only preference
export const [getfpsLimit, setfpsLimit, resetFpsLimit] =
  createLocalStorageSignal({
    key: "fpsLimit",
    schema: fpsLimitSchema,
    fallback: 1000,
  });
