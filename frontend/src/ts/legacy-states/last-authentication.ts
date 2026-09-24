import { z } from "zod";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";

const LastAuthenticationStateSchema = z.object({
  isLoggedIn: z.boolean(),
  timestamp: z.number().safe().nonnegative(),
});
export type LastAuthenticationState = z.infer<
  typeof LastAuthenticationStateSchema
>;

export const lastAuthenticationState = new LocalStorageWithSchema({
  key: "lastAuthenticationState",
  schema: LastAuthenticationStateSchema,
  fallback: { isLoggedIn: false, timestamp: Date.now() },
});
