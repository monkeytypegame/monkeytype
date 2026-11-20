import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// the real provider over a fake Firebase SDK (setup mocks firebase.ts itself)
vi.unmock("../../../src/ts/auth/providers/firebase");

const sdk = vi.hoisted(() => ({
  FirebaseError: class extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
  authStateListener: undefined as ((user: unknown) => void) | undefined,
  currentUser: null as unknown,
  signInWithPopup: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  reauthenticateWithCredential: vi.fn(),
  isNewUser: false,
}));

vi.mock("firebase/app", () => ({
  FirebaseError: sdk.FirebaseError,
  getApps: () => [],
  getApp: vi.fn(),
  initializeApp: vi.fn(() => ({})),
}));
vi.mock("firebase/auth", () => ({
  getAuth: () => ({
    signOut: vi.fn(),
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
  reauthenticateWithCredential: sdk.reauthenticateWithCredential,
  EmailAuthProvider: { credential: vi.fn() },
  GithubAuthProvider: class {
    providerId = "github.com";
  },
  GoogleAuthProvider: class {
    providerId = "google.com";
  },
  updateProfile: vi.fn(),
  getIdToken: vi.fn(),
  getAdditionalUserInfo: () => ({ isNewUser: sdk.isNewUser }),
}));
vi.mock("firebase/analytics", () => ({ getAnalytics: vi.fn() }));
vi.mock("../../../src/ts/constants/firebase-config", () => ({
  firebaseConfig: {},
}));

import { AuthError, AuthUser } from "../../../src/ts/auth/providers/types";
import { firebaseAuthProvider } from "../../../src/ts/auth/providers/firebase";

const firebaseUser = {
  uid: "uid",
  email: "a@b.c",
  emailVerified: true,
  providerData: [
    { providerId: "password", email: "a@b.c" },
    { providerId: "google.com", email: "g@b.c" },
    { providerId: "twitter.com", email: null },
  ],
};
const authUser: AuthUser = {
  uid: "uid",
  email: "a@b.c",
  emailVerified: true,
  methods: [
    { id: "password", email: "a@b.c" },
    { id: "google", email: "g@b.c" },
  ],
};

describe("firebase auth provider", () => {
  const onUserChange = vi.fn();

  beforeAll(async () => {
    await firebaseAuthProvider.init(onUserChange);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    sdk.isNewUser = false;
    sdk.currentUser = firebaseUser;
  });

  it("reports Firebase's users as auth users, keeping known auth methods", () => {
    sdk.authStateListener?.(firebaseUser);
    expect(onUserChange).toHaveBeenCalledWith(authUser);

    sdk.authStateListener?.(null);
    expect(onUserChange).toHaveBeenLastCalledWith(null);

    expect(firebaseAuthProvider.getUser()).toEqual(authUser);
  });

  it("tells a new popup user from an existing one", async () => {
    sdk.signInWithPopup.mockResolvedValue({ user: firebaseUser });

    sdk.isNewUser = true;
    expect(
      await firebaseAuthProvider.signIn({
        method: "google",
        rememberMe: false,
      }),
    ).toEqual({ user: authUser, isNewUser: true });

    sdk.isNewUser = false;
    expect(
      (
        await firebaseAuthProvider.signIn({
          method: "google",
          rememberMe: false,
        })
      ).isNewUser,
    ).toBe(false);
  });

  it("sign in errors get a message to show", async () => {
    sdk.signInWithPopup.mockRejectedValue(
      new sdk.FirebaseError("auth/popup-closed-by-user", "Firebase: Error"),
    );
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(
      firebaseAuthProvider.signIn({
        method: "github",
        rememberMe: false,
      }),
    ).rejects.toThrow(new AuthError("unknown", "Popup closed by user"));
  });

  it("errors the UI branches on carry a code and keep their message", async () => {
    sdk.createUserWithEmailAndPassword.mockRejectedValue(
      new sdk.FirebaseError("auth/email-already-in-use", "in use"),
    );
    sdk.reauthenticateWithCredential.mockRejectedValue(
      new sdk.FirebaseError("auth/wrong-password", "wrong"),
    );

    await expect(
      firebaseAuthProvider.createUser({
        email: "a@b.c",
        password: "password",
        name: "a",
      }),
    ).rejects.toMatchObject({ code: "emailInUse", message: "in use" });
    await expect(
      firebaseAuthProvider.reauthenticate({
        method: "password",
        password: "x",
      }),
    ).rejects.toMatchObject({ code: "wrongPassword", message: "wrong" });
  });
});
