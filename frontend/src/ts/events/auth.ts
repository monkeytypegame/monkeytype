import { createEvent } from "../hooks/createEvent";

export type AuthEvent =
  | {
      type: "authStateChanged";
      data: { isUserSignedIn: boolean; loadPromise: Promise<void> };
    }
  | { type: "snapshotUpdated"; data: { isInitial: boolean } }
  | { type: "authConfigUpdated"; data?: undefined };

export const authEvent = createEvent<AuthEvent>();
