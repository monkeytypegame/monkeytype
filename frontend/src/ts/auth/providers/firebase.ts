import {
  FirebaseApp,
  FirebaseError,
  FirebaseOptions,
  getApp,
  getApps,
  initializeApp,
} from "firebase/app";
import {
  getAuth,
  Auth as AuthType,
  User,
  AuthProvider as FirebaseAuthProvider,
  setPersistence as firebaseSetPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signInWithPopup as firebaseSignInWithPopup,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  getIdToken as firebaseGetIdToken,
  onAuthStateChanged,
  indexedDBLocalPersistence,
  getAdditionalUserInfo,
  EmailAuthProvider,
  GithubAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  linkWithPopup,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  unlink,
  updateEmail,
  updateProfile,
} from "firebase/auth";
import { createErrorMessage } from "../../utils/error";

import {
  Analytics as AnalyticsType,
  getAnalytics as firebaseGetAnalytics,
} from "firebase/analytics";
import { tryCatch } from "@monkeytype/util/trycatch";
import { typedKeys } from "@monkeytype/util/objects";
import {
  AuthError,
  AuthErrorCode,
  AuthMethod,
  AuthProvider,
  AuthUser,
  ThirdPartyAuthMethod,
} from "../provider";

let app: FirebaseApp | undefined;
let Auth: AuthType | undefined;

const popupProviders: Record<ThirdPartyAuthMethod, FirebaseAuthProvider> = {
  github: new GithubAuthProvider(),
  google: new GoogleAuthProvider(),
};

const providerIds: Record<AuthMethod, string> = {
  password: "password",
  github: popupProviders.github.providerId,
  google: popupProviders.google.providerId,
};

/** Firebase as the auth provider. */
export const firebaseAuthProvider: AuthProvider = {
  async init(onUserChange) {
    try {
      const { firebaseConfig } =
        (await import("../../constants/firebase-config")) as {
          firebaseConfig: FirebaseOptions;
        };

      app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      Auth = getAuth(app);

      const rememberMe =
        window.localStorage.getItem("firebasePersistence") === "LOCAL";
      await setPersistence(rememberMe, false);

      onAuthStateChanged(Auth, (user) => {
        onUserChange(user === null ? null : toAuthUser(user));
      });
    } catch (e) {
      app = undefined;
      Auth = undefined;
      throw e;
    }
  },

  getUser() {
    const user = Auth?.currentUser ?? null;
    return user === null ? null : toAuthUser(user);
  },

  async getToken() {
    const user = Auth?.currentUser ?? null;
    if (user === null) return null;
    return firebaseGetIdToken(user);
  },

  async signIn(options) {
    const auth = requireAuth();
    await setPersistence(options.rememberMe, true);

    const isPassword = options.method === "password";
    const { data: result, error } = await tryCatch(
      isPassword
        ? firebaseSignInWithEmailAndPassword(
            auth,
            options.email,
            options.password,
          )
        : firebaseSignInWithPopup(auth, popupProviders[options.method]),
    );
    if (error !== null) {
      console.error(error);
      throw translateSignInError(
        error,
        isPassword
          ? "Failed to sign in with email and password"
          : "Failed to sign in with popup",
      );
    }
    return {
      user: toAuthUser(result.user),
      isNewUser: getAdditionalUserInfo(result)?.isNewUser ?? false,
    };
  },

  async createUser({ email, password, name }) {
    const auth = requireAuth();
    const result = await wrapErrors(
      firebaseCreateUserWithEmailAndPassword(auth, email, password),
    );
    await wrapErrors(updateProfile(result.user, { displayName: name }));
    return toAuthUser(result.user);
  },

  async deleteUser() {
    await wrapErrors(requireUser().delete());
  },

  async signOut() {
    await Auth?.signOut();
  },

  async reauthenticate(options) {
    const user = requireUser();
    if (options.method === "password") {
      const credential = EmailAuthProvider.credential(
        user.email as string,
        options.password,
      );
      await wrapErrors(reauthenticateWithCredential(user, credential));
    } else {
      await wrapErrors(
        reauthenticateWithPopup(user, popupProviders[options.method]),
      );
    }
  },

  async linkPassword(email, password) {
    const user = requireUser();
    const credential = EmailAuthProvider.credential(email, password);
    await wrapErrors(linkWithCredential(user, credential));
    await wrapErrors(updateEmail(user, email));
  },

  async linkProvider(method) {
    await wrapErrors(linkWithPopup(requireUser(), popupProviders[method]));
  },

  async unlink(method) {
    await wrapErrors(unlink(requireUser(), providerIds[method]));
  },
};

export function getAnalytics(): AnalyticsType {
  return firebaseGetAnalytics(app);
}

function requireAuth(): AuthType {
  if (Auth === undefined) throw new Error("Authentication uninitialized");
  return Auth;
}

function requireUser(): User {
  const user = requireAuth().currentUser;
  if (user === null) throw new Error("User is not signed in");
  return user;
}

function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    emailVerified: user.emailVerified,
    methods: user.providerData.flatMap((info) => {
      const method = typedKeys(providerIds).find(
        (it) => providerIds[it] === info.providerId,
      );
      return method === undefined ? [] : [{ method, email: info.email }];
    }),
  };
}

async function setPersistence(
  rememberMe: boolean,
  store = false,
): Promise<void> {
  const persistence = rememberMe
    ? indexedDBLocalPersistence
    : browserSessionPersistence;

  if (store) {
    window.localStorage.setItem(
      "firebasePersistence",
      rememberMe ? "LOCAL" : "SESSION",
    );
  }

  await firebaseSetPersistence(requireAuth(), persistence);
}

function getErrorCode(error: unknown): AuthErrorCode {
  if (!(error instanceof FirebaseError)) return "unknown";
  switch (error.code) {
    case "auth/wrong-password":
      return "wrongPassword";
    case "auth/invalid-credential":
      return "invalidCredential";
    case "auth/email-already-in-use":
      return "emailInUse";
    default:
      return "unknown";
  }
}

/** Firebase errors become `AuthError`s, keeping their message. */
async function wrapErrors<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (e) {
    if (!(e instanceof FirebaseError)) throw e;
    throw new AuthError(getErrorCode(e), e.message, { cause: e });
  }
}

/** Sign in errors get a message ready to show. */
function translateSignInError(
  error: Error | FirebaseError,
  defaultMessage: string,
): AuthError {
  let message = createErrorMessage(error, defaultMessage);

  if (error instanceof FirebaseError) {
    if (error.code === "auth/wrong-password") {
      message = "Incorrect password";
    } else if (error.code === "auth/user-not-found") {
      message = "User not found";
    } else if (error.code === "auth/invalid-email") {
      message =
        "Invalid email format (make sure you are using your email to login - not your username)";
    } else if (error.code === "auth/invalid-credential") {
      message =
        "Email/password is incorrect or your account does not have password authentication enabled.";
    } else if (error.code === "auth/popup-closed-by-user") {
      message = "Popup closed by user";
    } else if (error.code === "auth/popup-blocked") {
      message =
        "Sign in popup was blocked by the browser. Check the address bar for a blocked popup icon, or update your browser settings to allow popups.";
    } else if (error.code === "auth/user-cancelled") {
      message = "Cancelled by user";
    } else if (error.code === "auth/account-exists-with-different-credential") {
      message =
        "Account already exists, but its using a different authentication method. Try signing in with a different method";
    } else {
      message = `Firebase error: ${error.code}`;
    }
  }

  return new AuthError(getErrorCode(error), message, { cause: error });
}
