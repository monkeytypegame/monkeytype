import {
  beforeEach,
  describe,
  expect,
  it,
  type MockInstance,
  vi,
} from "vitest";

import * as sessionCollection from "../../src/ts/collections/utils/session-collection";
import { queryClient } from "../../src/ts/queries/index";
import { setUserId } from "../../src/ts/states/core";

/**
 * The auth effect in `queries/index.ts` drives the session (sign out clears
 * the user queries and session collections, sign in downloads them again).
 * The effect is module-level, so the test drives the real `isAuthenticated`
 * signal and spies on the session functions (`session-collection.spec.ts`
 * covers what they do).
 */

type SignOutSpy = MockInstance<typeof sessionCollection.signOutSession>;
type SignInSpy = MockInstance<typeof sessionCollection.signInSession>;

/** Lets a queued effect update run (a set signal flushes on the next turn). */
async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("session on auth state change", () => {
  let signOut: SignOutSpy;
  let signIn: SignInSpy;

  beforeEach(async () => {
    setUserId(null);
    await flush();
    signOut = vi
      .spyOn(sessionCollection, "signOutSession")
      .mockImplementation(async () => undefined);
    signIn = vi
      .spyOn(sessionCollection, "signInSession")
      .mockImplementation(() => undefined);
  });

  it("signs the session out on sign out", async () => {
    setUserId("uid");
    await flush();
    signOut.mockClear();
    signIn.mockClear();

    setUserId(null);
    await flush();

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledWith(queryClient);
    expect(signIn).not.toHaveBeenCalled();
  });

  it("signs the session in on sign in", async () => {
    setUserId(null);
    await flush();
    signOut.mockClear();
    signIn.mockClear();

    setUserId("uid");
    await flush();

    expect(signIn).toHaveBeenCalledTimes(1);
    expect(signOut).not.toHaveBeenCalled();
  });
});
