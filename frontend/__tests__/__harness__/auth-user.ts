import { setAuthUser } from "../../src/ts/auth/state";

/** Signs a fake user in (or out, with `null`) in the auth state, without a provider. */
export function setTestUserId(uid: string | null): void {
  setAuthUser(
    uid === null
      ? null
      : { uid, email: null, emailVerified: false, methods: [] },
  );
}
