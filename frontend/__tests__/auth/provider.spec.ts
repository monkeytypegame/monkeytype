import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/ts/states/google-sign-up", () => ({
  showGoogleSignUpModal: vi.fn(),
}));
vi.mock("../../src/ts/states/banners", () => ({ addBanner: vi.fn() }));

import {
  AuthProvider,
  AuthUser,
  cancelSignUp,
  createUser,
  finishSignUp,
  getAuthenticatedUser,
  initAuth,
  isAuthAvailable,
  signInWithProvider,
} from "../../src/ts/auth/provider";
import { getAuthState, getUserId } from "../../src/ts/auth/state";
import { showGoogleSignUpModal } from "../../src/ts/states/google-sign-up";

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
  init: vi.fn(async (onUserChange) => {
    fake.onUserChange = onUserChange;
  }),
  getUser: () => fake.currentUser,
  signOut: vi.fn(async () => providerReports(null)),
  signInWithProvider: vi.fn(async () => {
    providerReports(user);
    return { user, isNewUser: fake.isNewUser };
  }),
  createUser: vi.fn(async () => {
    providerReports(user);
    return user;
  }),
} as Partial<AuthProvider> as AuthProvider;

describe("auth provider", () => {
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
    expect(getAuthenticatedUser()).toBe(user);

    providerReports(null);
    expect(getUserId()).toBeNull();
    expect(getAuthState()).toBe("signedOut");
  });

  it("signs in an existing user from a provider popup", async () => {
    await signInWithProvider("github", false);

    expect(getUserId()).toBe("uid");
    expect(showGoogleSignUpModal).not.toHaveBeenCalled();
  });

  // #8046: signing in before the backend user exists makes backend calls fail
  it("a new user from a provider popup stays signed out until the sign up finishes", async () => {
    fake.isNewUser = true;
    await signInWithProvider("google", false);

    expect(showGoogleSignUpModal).toHaveBeenCalledWith(user);
    expect(getUserId()).toBeNull();
    expect(getAuthState()).toBe("signedOut");

    finishSignUp();
    expect(getUserId()).toBe("uid");
    expect(getAuthState()).toBe("signedIn");
  });

  it("a failed popup listens to user changes again", async () => {
    vi.mocked(provider.signInWithProvider).mockRejectedValueOnce(
      new Error("Popup closed by user"),
    );
    await expect(signInWithProvider("google", false)).rejects.toThrow(
      "Popup closed by user",
    );

    providerReports(user);
    expect(getUserId()).toBe("uid");
  });

  it("a new user returning from a redirect stays signed out until the sign up finishes", () => {
    fake.currentUser = user;
    fake.onUserChange?.(user, { isNewUser: true });

    expect(showGoogleSignUpModal).toHaveBeenCalledWith(user);
    expect(getUserId()).toBeNull();
    // the provider repeating the user changes nothing until then
    providerReports(user);
    expect(getUserId()).toBeNull();

    finishSignUp();
    expect(getUserId()).toBe("uid");
  });

  it("a new email user stays signed out until the sign up finishes", async () => {
    await createUser({ email: "a@b.c", password: "password", name: "a" });

    expect(getUserId()).toBeNull();

    finishSignUp();
    expect(getUserId()).toBe("uid");
  });

  it("a cancelled sign up signs out of the provider and listens to it again", async () => {
    await createUser({ email: "a@b.c", password: "password", name: "a" });

    await cancelSignUp();

    expect(provider.signOut).toHaveBeenCalled();
    expect(getUserId()).toBeNull();
    providerReports(user);
    expect(getUserId()).toBe("uid");
  });
});

describe("auth provider failing to start", () => {
  it("leaves auth unavailable and signed out", async () => {
    const failing = {
      init: vi.fn(async () => {
        throw new Error("no config");
      }),
    } as Partial<AuthProvider> as AuthProvider;
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await initAuth(failing);

    expect(isAuthAvailable()).toBe(false);
    expect(getAuthenticatedUser()).toBeNull();
    expect(getAuthState()).toBe("signedOut");
  });
});
