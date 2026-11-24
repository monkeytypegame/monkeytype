import { z } from "zod";

import { createLocalStorageSignal } from "../hooks/createLocalStorageSignal";

// not part of the config schema on purpose - this is a local only preference
export const [getGlarsesMode, setGlarsesMode, resetGlarsesMode] =
  createLocalStorageSignal({
    key: "glarsesMode",
    schema: z.boolean(),
    fallback: false,
  });
