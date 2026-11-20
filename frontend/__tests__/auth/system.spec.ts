import { createEffect, createRoot } from "solid-js";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/ts/states/banners", () => ({ addBanner: vi.fn() }));

import { AuthProvider, AuthUser } from "../../src/ts/auth/providers/types";
import {
  cancelSignUp,
  createProviderUser,
  finishSignUp,
  getProviderUser,
  initAuth,
  linkMethod,
  signInToProvider,
} from "../../src/ts/auth/system";
import {
  getAuthUser,
  getAuthState,
  getPendingSignUpUser,
  getUserId,
  isAuthAvailable,
  isUsingAuthMethod,
} from "../../src/ts/auth/state";

const user: AuthUser = {
  uid: "uid",
  email: "a@b.c",
  emailVerified: false,
  methods: [],
};

const fake = {
  onUserChange: undefined as Parameters<AuthProvider["init"]>[0] | undefined,
  currentUser: null as AuthUser | null,
  isNewUser: false,
};

// what the provider does when a user signs in or out
function providerReports(reported: AuthUser | null): void {
  fake.currentUser = reported;
  fake.onUserChange?.(reported);
}

const provider = {
  methods: [{ id: "password", display: "Password", fa: { icon: "fa-lock" } }],
  init: vi.fn(async (onUserChange) => {
    fake.onUserChange = onUserChange;
  }),
  getUser: () => fake.currentUser,
  signOut: vi.fn(async () => providerReports(null)),
  signIn: vi.fn(async () => {
    providerReports(user);
    return { user, isNewUser: fake.isNewUser };
  }),
  addMethod: vi.fn(async ({ method }) => {
    fake.currentUser = {
      ...user,
      methods: [...user.methods, { id: method, email: null }],
    };
  }),
  createUser: vi.fn(async () => {
    providerReports(user);
    return user;
  }),
} as Partial<AuthProvider> as AuthProvider;

describe("auth system", () => {
  beforeAll(async () => {
    await initAuth(provider);
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    fake.isNewUser = false;
    // a previous test's sign up may have left user changes held back
    await cancelSignUp();
    providerReports(null);
  });

  it("writes the auth signals from the provider's user changes", () => {
    providerReports(user);
    expect(getUserId()).toBe("uid");
    expect(getAuthState()).toBe("signedIn");
    expect(getProviderUser()).toBe(user);

    providerReports(null);
    expect(getUserId()).toBeNull();
    expect(getAuthState()).toBe("signedOut");
  });

  it("signs in an existing user from a provider popup", async () => {
    await signInToProvider({ method: "github", rememberMe: false });

    expect(getUserId()).toBe("uid");
    expect(getPendingSignUpUser()).toBeUndefined();
  });

  // #8046: signing in before the backend user exists makes backend calls fail
  it("a new user from a provider popup stays signed out until the sign up finishes", async () => {
    fake.isNewUser = true;
    await signInToProvider({ method: "google", rememberMe: false });

    expect(getPendingSignUpUser()).toBe(user);
    expect(getUserId()).toBeNull();
    expect(getAuthState()).toBe("signedOut");

    finishSignUp();
    expect(getUserId()).toBe("uid");
    expect(getAuthState()).toBe("signedIn");
    expect(getPendingSignUpUser()).toBeUndefined();
  });

  it("a failed popup listens to user changes again", async () => {
    vi.mocked(provider.signIn).mockRejectedValueOnce(
      new Error("Popup closed by user"),
    );
    await expect(
      signInToProvider({ method: "google", rememberMe: false }),
    ).rejects.toThrow("Popup closed by user");

    providerReports(user);
    expect(getUserId()).toBe("uid");
  });

  it("a new user returning from a redirect stays signed out until the sign up finishes", () => {
    fake.currentUser = user;
    fake.onUserChange?.(user, { isNewUser: true });

    expect(getPendingSignUpUser()).toBe(user);
    expect(getUserId()).toBeNull();
    // the provider repeating the user changes nothing until then
    providerReports(user);
    expect(getUserId()).toBeNull();

    finishSignUp();
    expect(getUserId()).toBe("uid");
  });

  it("a new email user stays signed out until the sign up finishes", async () => {
    await createProviderUser({
      email: "a@b.c",
      password: "password",
      name: "a",
    });

    expect(getUserId()).toBeNull();

    finishSignUp();
    expect(getUserId()).toBe("uid");
  });

  it("a cancelled sign up signs out of the provider and listens to it again", async () => {
    await createProviderUser({
      email: "a@b.c",
      password: "password",
      name: "a",
    });

    await cancelSignUp();

    expect(provider.signOut).toHaveBeenCalled();
    expect(getPendingSignUpUser()).toBeUndefined();
    expect(getUserId()).toBeNull();
    providerReports(user);
    expect(getUserId()).toBe("uid");
  });
  it("a linked method updates the user but not its id", async () => {
    providerReports(user);
    let idRuns = 0;
    const dispose = createRoot((dispose) => {
      createEffect(() => {
        getUserId();
        idRuns++;
      });
      return dispose;
    });
    const runsBefore = idRuns;

    await linkMethod({ method: "github" });

    expect(isUsingAuthMethod("github")).toBe(true);
    expect(idRuns).toBe(runsBefore);
    dispose();
  });

  it("adding a method updates the auth methods signal", async () => {
    providerReports(user);
    expect(getAuthUser()?.methods ?? []).toEqual([]);

    await linkMethod({ method: "github" });
    expect(getAuthUser()?.methods ?? []).toEqual([
      { id: "github", email: null },
    ]);

    providerReports(null);
    expect(getAuthUser()?.methods ?? []).toEqual([]);
  });
});

describe("auth provider failing to start", () => {
  it("leaves auth unavailable and signed out", async () => {
    const failing = {
      methods: [
        { id: "password", display: "Password", fa: { icon: "fa-lock" } },
      ],
      init: vi.fn(async () => {
        throw new Error("no config");
      }),
    } as Partial<AuthProvider> as AuthProvider;
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await initAuth(failing);

    expect(isAuthAvailable()).toBe(false);
    expect(getProviderUser()).toBeNull();
    expect(getAuthState()).toBe("signedOut");
  });

  it("fails to start without auth methods", async () => {
    const noMethods = {
      methods: [],
      init: vi.fn(async () => undefined),
    } as Partial<AuthProvider> as AuthProvider;
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await initAuth(noMethods);

    expect(noMethods.init).not.toHaveBeenCalled();
    expect(isAuthAvailable()).toBe(false);
  });
});
