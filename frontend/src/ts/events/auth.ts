import { createEvent } from "../hooks/createEvent";

type AuthEvent =
  | {
      type: "authStateChanged";
      data: {
        isUserSignedIn: boolean;
        loadPromise: Promise<void>;
        /** Downloads the user data again, eg. after `loadPromise` failed. */
        reloadUserData: () => Promise<void>;
      };
    }
  | { type: "userDataLoaded"; data: { isInitial: boolean } };

export const authEvent = createEvent<AuthEvent>();
