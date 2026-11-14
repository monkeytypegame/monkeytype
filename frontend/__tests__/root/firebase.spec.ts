import { beforeEach, describe, expect, it, vi } from "vitest";

// the real adapter over a fake Firebase SDK (setup mocks firebase.ts itself)
vi.unmock("../../src/ts/firebase");

const sdk = vi.hoisted(() => ({
  authStateListener: undefined as ((user: unknown) => void) | undefined,
  currentUser: null as unknown,
  signOut: vi.fn(async () => undefined),
  signInWithPopup: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  isNewUser: false,
}));

vi.mock("firebase/app", () => ({
  FirebaseError: class extends Error {},
  getApps: () => [],
  getApp: vi.fn(),
  initializeApp: vi.fn(() => ({})),
}));
vi.mock("firebase/auth", () => ({
  getAuth: () => ({
    signOut: sdk.signOut,
    get currentUser() {
      return sdk.currentUser;
    },
  }),
  setPersistence: vi.fn(async () => undefined),
  browserSessionPersistence: {},
  indexedDBLocalPersistence: {},
  onAuthStateChanged: (_auth: unknown, listener: (user: unknown) => void) => {
    sdk.authStateListener = listener;
  },
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: sdk.signInWithPopup,
  createUserWithEmailAndPassword: sdk.createUserWithEmailAndPassword,
  getIdToken: vi.fn(),
  getAdditionalUserInfo: () => ({ isNewUser: sdk.isNewUser }),
}));
vi.mock("firebase/analytics", () => ({ getAnalytics: vi.fn() }));
vi.mock("../../src/ts/constants/firebase-config", () => ({
  firebaseConfig: {},
}));
vi.mock("../../src/ts/states/google-sign-up", () => ({
  showGoogleSignUpModal: vi.fn(),
}));
vi.mock("../../src/ts/states/banners", () => ({ addBanner: vi.fn() }));

import type { AuthProvider, User } from "firebase/auth";

import {
  cancelSignUp,
  createUserWithEmailAndPassword,
  finishSignUp,
  initFirebase,
  signInWithPopup,
} from "../../src/ts/firebase";
import { getAuthState, getUserId } from "../../src/ts/states/core";
import { showGoogleSignUpModal } from "../../src/ts/states/google-sign-up";

const user = { uid: "uid", emailVerified: false } as User;
const provider = {} as AuthProvider;

// what Firebase does when a user signs in or out
function firebaseReports(reported: User | null): void {
  sdk.currentUser = reported;
  sdk.authStateListener?.(reported);
}

describe("firebase adapter", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    sdk.isNewUser = false;
    sdk.signInWithPopup.mockImplementation(async () => {
      firebaseReports(user);
      return { user };
    });
    sdk.createUserWithEmailAndPassword.mockImplementation(async () => {
      firebaseReports(user);
      return { user };
    });
    await initFirebase();
    // a previous test's sign up may have left the callback ignored
    await cancelSignUp();
    firebaseReports(null);
  });

  it("writes the auth signals from Firebase's auth state", () => {
    firebaseReports(user);
    expect(getUserId()).toBe("uid");
    expect(getAuthState()).toBe("signedIn");

    firebaseReports(null);
    expect(getUserId()).toBeNull();
    expect(getAuthState()).toBe("signedOut");
  });

  it("signs in an existing user from a provider popup", async () => {
    await signInWithPopup(provider, false);

    expect(getUserId()).toBe("uid");
    expect(showGoogleSignUpModal).not.toHaveBeenCalled();
  });

  // #8046: signing in before the backend user exists makes backend calls fail
  it("a new user from a provider popup stays signed out until the sign up finishes", async () => {
    sdk.isNewUser = true;
    await signInWithPopup(provider, false);

    expect(showGoogleSignUpModal).toHaveBeenCalled();
    expect(getUserId()).toBeNull();
    expect(getAuthState()).toBe("signedOut");

    finishSignUp();
    expect(getUserId()).toBe("uid");
    expect(getAuthState()).toBe("signedIn");
  });

  it("a new email user stays signed out until the sign up finishes", async () => {
    await createUserWithEmailAndPassword("a@b.c", "password");

    expect(getUserId()).toBeNull();

    finishSignUp();
    expect(getUserId()).toBe("uid");
  });

  it("a cancelled sign up signs out of Firebase and listens to it again", async () => {
    await createUserWithEmailAndPassword("a@b.c", "password");

    await cancelSignUp();

    expect(sdk.signOut).toHaveBeenCalled();
    expect(getUserId()).toBeNull();
    firebaseReports(user);
    expect(getUserId()).toBe("uid");
  });
});
