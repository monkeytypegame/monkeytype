import Ape from "../ape";
import * as AccountController from "../auth";
import * as DB from "../db";
import { resetConfig, setConfig } from "../config";
import * as Notifications from "../elements/notifications";
import * as Settings from "../pages/settings";
import * as ThemePicker from "../elements/settings/theme-picker";
import * as CustomText from "../test/custom-text";
import { FirebaseError } from "firebase/app";
import {
  isAuthenticated,
  getAuthenticatedUser,
  isAuthAvailable,
} from "../firebase";
import {
  EmailAuthProvider,
  User,
  linkWithCredential,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  unlink,
} from "firebase/auth";
import {
  createErrorMessage,
  isDevEnvironment,
  reloadAfter,
} from "../utils/misc";
import * as CustomTextState from "../states/custom-text-name";
import * as ThemeController from "../controllers/theme-controller";
import * as AccountSettings from "../pages/account-settings";
import {
  ExecReturn,
  PasswordInput,
  SimpleModal,
  TextInput,
} from "../utils/simple-modal";

import { GenerateDataRequest } from "@monkeytype/contracts/dev";
import {
  PasswordSchema,
  UserEmailSchema,
  UserNameSchema,
} from "@monkeytype/schemas/users";
import { goToPage } from "../pages/leaderboards";
import FileStorage from "../utils/file-storage";
import { z } from "zod";
import { remoteValidation } from "../utils/remote-validation";
import { list, PopupKey, showPopup } from "./simple-modals-base";
import { getTheme } from "../signals/theme";

export { list, showPopup };
export type { PopupKey };

type AuthMethod = "password" | "github.com" | "google.com";

type ReauthSuccess = {
  status: 1;
  message: string;
  user: User;
};

type ReauthFailed = {
  status: -1 | 0;
  message: string;
};

type ReauthenticateOptions = {
  excludeMethod?: AuthMethod;
  password?: string;
};

function getPreferredAuthenticationMethod(
  exclude?: AuthMethod,
): AuthMethod | undefined {
  const authMethods = ["password", "github.com", "google.com"] as AuthMethod[];
  const filteredMethods = authMethods.filter((it) => it !== exclude);
  for (const method of filteredMethods) {
    if (isUsingAuthentication(method)) return method;
  }
  return undefined;
}

function isUsingPasswordAuthentication(): boolean {
  return isUsingAuthentication("password");
}

function isUsingGithubAuthentication(): boolean {
  return isUsingAuthentication("github.com");
}

function isUsingGoogleAuthentication(): boolean {
  return isUsingAuthentication("google.com");
}

function isUsingAuthentication(authProvider: AuthMethod): boolean {
  return (
    getAuthenticatedUser()?.providerData.some(
      (p) => p.providerId === authProvider,
    ) ?? false
  );
}

async function reauthenticate(
  options: ReauthenticateOptions,
): Promise<ReauthSuccess | ReauthFailed> {
  if (!isAuthAvailable()) {
    return {
      status: -1,
      message: "Authentication is not initialized",
    };
  }

  const user = getAuthenticatedUser();
  if (user === null) {
    return {
      status: -1,
      message: "User is not signed in",
    };
  }

  const authMethod = getPreferredAuthenticationMethod(options.excludeMethod);

  try {
    if (authMethod === undefined) {
      return {
        status: -1,
        message:
          "Failed to reauthenticate: there is no valid authentication present on the account.",
      };
    }

    if (authMethod === "password") {
      if (options.password === undefined) {
        return {
          status: -1,
          message: "Failed to reauthenticate using password: password missing.",
        };
      }
      const credential = EmailAuthProvider.credential(
        user.email as string,
        options.password,
      );
      await reauthenticateWithCredential(user, credential);
    } else {
      const authProvider =
        authMethod === "github.com"
          ? AccountController.githubProvider
          : AccountController.gmailProvider;
      await reauthenticateWithPopup(user, authProvider);
    }

    return {
      status: 1,
      message: "Reauthenticated",
      user,
    };
  } catch (e) {
    const typedError = e as FirebaseError;
    if (typedError.code === "auth/wrong-password") {
      return {
        status: 0,
        message: "Incorrect password",
      };
    } else if (typedError.code === "auth/invalid-credential") {
      return {
        status: 0,
        message:
          "Password is incorrect or your account does not have password authentication enabled.",
      };
    } else {
      return {
        status: -1,
        message:
          "Failed to reauthenticate: " +
          (typedError?.message ?? JSON.stringify(e)),
      };
    }
  }
}

list.updateEmail = new SimpleModal({
  id: "updateEmail",
  title: "Update email",
  inputs: [
    {
      placeholder: "Password",
      type: "password",
      initVal: "",
    },
    {
      type: "text",
      placeholder: "New email",
      initVal: "",
      validation: {
        schema: UserEmailSchema,
      },
    },
    {
      type: "text",
      placeholder: "Confirm new email",
      initVal: "",
      validation: {
        schema: UserEmailSchema,
        isValid: async (currentValue, thisPopup) =>
          currentValue === thisPopup.inputs?.[1]?.currentValue() ||
          "Emails don't match",
        debounceDelay: 0,
      },
    },
  ],
  buttonText: "update",
  execFn: async (
    _thisPopup,
    password,
    email,
    emailConfirm,
  ): Promise<ExecReturn> => {
    if (email !== emailConfirm) {
      return {
        status: 0,
        message: "Emails don't match",
      };
    }

    const reauth = await reauthenticate({ password });
    if (reauth.status !== 1) {
      return {
        status: reauth.status,
        message: reauth.message,
      };
    }

    const response = await Ape.users.updateEmail({
      body: {
        newEmail: email,
        previousEmail: reauth.user.email as string,
      },
    });

    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to update email",
        notificationOptions: { response },
      };
    }

    AccountController.signOut();

    return {
      status: 1,
      message: "Email updated",
    };
  },
  beforeInitFn: (thisPopup): void => {
    if (!isAuthenticated()) return;
    if (!isUsingPasswordAuthentication()) {
      thisPopup.inputs = [];
      thisPopup.buttonText = "";
      thisPopup.text = "Password authentication is not enabled";
    }
  },
});

list.removeGoogleAuth = new SimpleModal({
  id: "removeGoogleAuth",
  title: "Remove Google authentication",
  inputs: [
    {
      placeholder: "Password",
      type: "password",
      initVal: "",
    },
  ],
  buttonText: "remove",
  execFn: async (_thisPopup, password): Promise<ExecReturn> => {
    const reauth = await reauthenticate({
      password,
      excludeMethod: "google.com",
    });
    if (reauth.status !== 1) {
      return {
        status: reauth.status,
        message: reauth.message,
      };
    }

    try {
      await unlink(reauth.user, "google.com");
    } catch (e) {
      const message = createErrorMessage(e, "Failed to unlink Google account");
      return {
        status: -1,
        message,
      };
    }

    AccountSettings.updateUI();

    reloadAfter(3);
    return {
      status: 1,
      message: "Google authentication removed",
    };
  },
  beforeInitFn: (thisPopup): void => {
    if (!isAuthenticated()) return;
    if (!isUsingPasswordAuthentication()) {
      thisPopup.inputs = [];
      if (!isUsingGithubAuthentication()) {
        thisPopup.buttonText = "";
        thisPopup.text = "Password or GitHub authentication is not enabled";
      }
    }
  },
});

list.removeGithubAuth = new SimpleModal({
  id: "removeGithubAuth",
  title: "Remove GitHub authentication",
  inputs: [
    {
      placeholder: "Password",
      type: "password",
      initVal: "",
    },
  ],
  buttonText: "remove",
  execFn: async (_thisPopup, password): Promise<ExecReturn> => {
    const reauth = await reauthenticate({
      password,
      excludeMethod: "github.com",
    });
    if (reauth.status !== 1) {
      return {
        status: reauth.status,
        message: reauth.message,
      };
    }

    try {
      await unlink(reauth.user, "github.com");
    } catch (e) {
      const message = createErrorMessage(e, "Failed to unlink GitHub account");
      return {
        status: -1,
        message,
      };
    }

    AccountSettings.updateUI();

    reloadAfter(3);
    return {
      status: 1,
      message: "GitHub authentication removed",
    };
  },
  beforeInitFn: (thisPopup): void => {
    if (!isAuthenticated()) return;
    if (!isUsingPasswordAuthentication()) {
      thisPopup.inputs = [];
      if (!isUsingGoogleAuthentication()) {
        thisPopup.buttonText = "";
        thisPopup.text = "Password or Google authentication is not enabled";
      }
    }
  },
});

list.removePasswordAuth = new SimpleModal({
  id: "removePaswordAuth",
  title: "Remove Password authentication",
  inputs: [
    {
      type: "checkbox",
      label: `I understand I will lose access to my Monkeytype account if my Google/GitHub account is lost or disabled.`,
    },
  ],
  buttonText: "reauthenticate to remove",
  execFn: async (_thisPopup): Promise<ExecReturn> => {
    const reauth = await reauthenticate({
      excludeMethod: "password",
    });
    if (reauth.status !== 1) {
      return {
        status: reauth.status,
        message: reauth.message,
      };
    }

    try {
      await unlink(reauth.user, "password");
    } catch (e) {
      const message = createErrorMessage(
        e,
        "Failed to remove password authentication",
      );
      return {
        status: -1,
        message,
      };
    }

    AccountSettings.updateUI();

    reloadAfter(3);
    return {
      status: 1,
      message: "Password authentication removed",
    };
  },
  beforeInitFn: (): void => {
    if (!isAuthenticated()) return;
  },
});

list.updateName = new SimpleModal({
  id: "updateName",
  title: "Update name",
  inputs: [
    {
      placeholder: "password",
      type: "password",
      initVal: "",
    },
    {
      placeholder: "new name",
      type: "text",
      initVal: "",
      validation: {
        schema: UserNameSchema,
        isValid: remoteValidation(
          async (name) => Ape.users.getNameAvailability({ params: { name } }),
          { check: (data) => data.available || "Name not available" },
        ),
        debounceDelay: 1000,
      },
    },
  ],
  buttonText: "update",
  execFn: async (_thisPopup, password, newName): Promise<ExecReturn> => {
    const reauth = await reauthenticate({ password });
    if (reauth.status !== 1) {
      return {
        status: reauth.status,
        message: reauth.message,
      };
    }

    const response = await Ape.users.updateName({
      body: { name: newName },
    });
    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to update name",
        notificationOptions: { response },
      };
    }

    const snapshot = DB.getSnapshot();
    if (snapshot) {
      snapshot.name = newName;
      DB.setSnapshot(snapshot);
      if (snapshot.needsToChangeName) {
        reloadAfter(2);
      }
    }

    return {
      status: 1,
      message: "Name updated",
    };
  },
  beforeInitFn: (thisPopup): void => {
    if (!isAuthenticated()) return;
    const snapshot = DB.getSnapshot();
    if (!snapshot) return;
    if (!isUsingPasswordAuthentication()) {
      (thisPopup.inputs[0] as PasswordInput).hidden = true;
      thisPopup.buttonText = "reauthenticate to update";
    }
    if (snapshot.needsToChangeName === true) {
      thisPopup.text =
        "You need to change your account name. This might be because you have a duplicate name, no account name or your name is not allowed (contains whitespace or invalid characters). Sorry for the inconvenience.";
    }
  },
});

list.updatePassword = new SimpleModal({
  id: "updatePassword",
  title: "Update password",
  inputs: [
    {
      placeholder: "current password",
      type: "password",
      initVal: "",
    },
    {
      placeholder: "new password",
      type: "password",
      initVal: "",
      validation: {
        schema: isDevEnvironment() ? z.string().min(6) : PasswordSchema,
      },
    },
    {
      placeholder: "confirm new password",
      type: "password",
      initVal: "",
    },
  ],
  buttonText: "update",
  execFn: async (
    _thisPopup,
    previousPass,
    newPassword,
    newPassConfirm,
  ): Promise<ExecReturn> => {
    if (newPassword !== newPassConfirm) {
      return {
        status: 0,
        message: "New passwords don't match",
      };
    }

    if (newPassword === previousPass) {
      return {
        status: 0,
        message: "New password must be different from previous password",
      };
    }

    const reauth = await reauthenticate({ password: previousPass });
    if (reauth.status !== 1) {
      return {
        status: reauth.status,
        message: reauth.message,
      };
    }

    const response = await Ape.users.updatePassword({
      body: { newPassword },
    });

    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to update password",
        notificationOptions: { response },
      };
    }

    AccountController.signOut();

    return {
      status: 1,
      message: "Password updated",
    };
  },
  beforeInitFn: (thisPopup): void => {
    if (!isAuthenticated()) return;
    if (!isUsingPasswordAuthentication()) {
      thisPopup.inputs = [];
      thisPopup.buttonText = "";
      thisPopup.text = "Password authentication is not enabled";
    }
  },
});

list.addPasswordAuth = new SimpleModal({
  id: "addPasswordAuth",
  title: "Add password authentication",
  inputs: [
    {
      placeholder: "email",
      type: "email",
      initVal: "",
    },
    {
      placeholder: "confirm email",
      type: "email",
      initVal: "",
    },
    {
      placeholder: "new password",
      type: "password",
      initVal: "",
    },
    {
      placeholder: "confirm new password",
      type: "password",
      initVal: "",
    },
  ],
  buttonText: "reauthenticate to add",
  execFn: async (
    _thisPopup,
    email,
    emailConfirm,
    password,
    passConfirm,
  ): Promise<ExecReturn> => {
    if (email !== emailConfirm) {
      return {
        status: 0,
        message: "Emails don't match",
      };
    }

    if (password !== passConfirm) {
      return {
        status: 0,
        message: "Passwords don't match",
      };
    }

    const reauth = await reauthenticate({ password });
    if (reauth.status !== 1) {
      return {
        status: reauth.status,
        message: reauth.message,
      };
    }

    try {
      const credential = EmailAuthProvider.credential(email, password);
      await linkWithCredential(reauth.user, credential);
    } catch (e) {
      const message = createErrorMessage(
        e,
        "Failed to add password authentication",
      );
      return {
        status: -1,
        message,
      };
    }

    const response = await Ape.users.updateEmail({
      body: {
        newEmail: email,
        previousEmail: reauth.user.email as string,
      },
    });
    if (response.status !== 200) {
      return {
        status: -1,
        message:
          "Password authentication added but updating the database email failed. This shouldn't happen, please contact support. Error",
        notificationOptions: { response },
      };
    }

    AccountSettings.updateUI();
    return {
      status: 1,
      message: "Password authentication added",
    };
  },
});

list.deleteAccount = new SimpleModal({
  id: "deleteAccount",
  title: "Delete account",
  inputs: [
    {
      placeholder: "password",
      type: "password",
      initVal: "",
    },
  ],
  text: "This is the last time you can change your mind. After pressing the button everything is gone.",
  buttonText: "delete",
  execFn: async (_thisPopup, password): Promise<ExecReturn> => {
    const reauth = await reauthenticate({ password });
    if (reauth.status !== 1) {
      return {
        status: reauth.status,
        message: reauth.message,
      };
    }

    Notifications.add("Deleting all data...", 0);
    const response = await Ape.users.delete();

    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to delete user data",
        notificationOptions: { response },
      };
    }

    reloadAfter(3);

    return {
      status: 1,
      message: "Account deleted, goodbye",
    };
  },
  beforeInitFn: (thisPopup): void => {
    if (!isAuthenticated()) return;
    if (!isUsingPasswordAuthentication()) {
      thisPopup.inputs = [];
      thisPopup.buttonText = "reauthenticate to delete";
    }
  },
});

list.resetAccount = new SimpleModal({
  id: "resetAccount",
  title: "Reset account",
  inputs: [
    {
      placeholder: "password",
      type: "password",
      initVal: "",
    },
  ],
  text: "This is the last time you can change your mind. After pressing the button everything is gone.",
  buttonText: "reset",
  execFn: async (_thisPopup, password): Promise<ExecReturn> => {
    const reauth = await reauthenticate({ password });
    if (reauth.status !== 1) {
      return {
        status: reauth.status,
        message: reauth.message,
      };
    }

    Notifications.add("Resetting settings...", 0);
    await resetConfig();
    await FileStorage.deleteFile("LocalBackgroundFile");

    Notifications.add("Resetting account...", 0);
    const response = await Ape.users.reset();
    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to reset account",
        notificationOptions: { response },
      };
    }

    reloadAfter(3);

    return {
      status: 1,
      message: "Account reset",
    };
  },
  beforeInitFn: (thisPopup): void => {
    if (!isAuthenticated()) return;
    if (!isUsingPasswordAuthentication()) {
      thisPopup.inputs = [];
      thisPopup.buttonText = "reauthenticate to reset";
    }
  },
});

list.optOutOfLeaderboards = new SimpleModal({
  id: "optOutOfLeaderboards",
  title: "Opt out of leaderboards",
  inputs: [
    {
      placeholder: "password",
      type: "password",
      initVal: "",
    },
  ],
  text: "Are you sure you want to opt out of leaderboards?",
  buttonText: "opt out",
  execFn: async (_thisPopup, password): Promise<ExecReturn> => {
    const reauth = await reauthenticate({ password });
    if (reauth.status !== 1) {
      return {
        status: reauth.status,
        message: reauth.message,
      };
    }

    const response = await Ape.users.optOutOfLeaderboards();
    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to opt out",
        notificationOptions: { response },
      };
    }

    reloadAfter(3);

    return {
      status: 1,
      message: "Leaderboards opt out successful",
    };
  },
  beforeInitFn: (thisPopup): void => {
    if (!isAuthenticated()) return;
    if (!isUsingPasswordAuthentication()) {
      thisPopup.inputs = [];
      thisPopup.buttonText = "reauthenticate to opt out";
    }
  },
});

list.applyCustomFont = new SimpleModal({
  id: "applyCustomFont",
  title: "Custom font",
  inputs: [{ type: "text", placeholder: "Font name", initVal: "" }],
  text: "Make sure you have the font installed on your computer before applying",
  buttonText: "apply",
  execFn: async (_thisPopup, fontName): Promise<ExecReturn> => {
    Settings.groups["fontFamily"]?.setValue(fontName.replace(/\s/g, "_"));

    return {
      status: 1,
      message: "Font applied",
    };
  },
});

list.resetPersonalBests = new SimpleModal({
  id: "resetPersonalBests",
  title: "Reset personal bests",
  inputs: [
    {
      placeholder: "password",
      type: "password",
      initVal: "",
    },
  ],
  buttonText: "reset",
  execFn: async (_thisPopup, password): Promise<ExecReturn> => {
    const reauth = await reauthenticate({ password });
    if (reauth.status !== 1) {
      return {
        status: reauth.status,
        message: reauth.message,
      };
    }

    const response = await Ape.users.deletePersonalBests();
    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to reset personal bests",
        notificationOptions: { response },
      };
    }

    const snapshot = DB.getSnapshot();
    if (!snapshot) {
      return {
        status: -1,
        message: "Failed to reset personal bests: no snapshot",
      };
    }

    snapshot.personalBests = {
      time: {},
      words: {},
      quote: {},
      zen: {},
      custom: {},
    };

    return {
      status: 1,
      message: "Personal bests reset",
    };
  },
  beforeInitFn: (thisPopup): void => {
    if (!isAuthenticated()) return;
    if (!isUsingPasswordAuthentication()) {
      thisPopup.inputs = [];
      thisPopup.buttonText = "reauthenticate to reset";
    }
  },
});

list.resetSettings = new SimpleModal({
  id: "resetSettings",
  title: "Reset settings",
  text: "Are you sure you want to reset all your settings?",
  buttonText: "reset",
  execFn: async (): Promise<ExecReturn> => {
    await resetConfig();
    await FileStorage.deleteFile("LocalBackgroundFile");
    return {
      status: 1,
      message: "Settings reset",
    };
  },
});

list.revokeAllTokens = new SimpleModal({
  id: "revokeAllTokens",
  title: "Revoke all tokens",
  inputs: [
    {
      placeholder: "password",
      type: "password",
      initVal: "",
    },
  ],
  text: "Are you sure you want to do this? This will log you out of all devices.",
  buttonText: "revoke all",
  execFn: async (_thisPopup, password): Promise<ExecReturn> => {
    const reauth = await reauthenticate({ password });
    if (reauth.status !== 1) {
      return {
        status: reauth.status,
        message: reauth.message,
      };
    }

    const response = await Ape.users.revokeAllTokens();
    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to revoke tokens",
        notificationOptions: { response },
      };
    }

    reloadAfter(3);

    return {
      status: 1,
      message: "Tokens revoked",
    };
  },
  beforeInitFn: (thisPopup): void => {
    if (!isAuthenticated()) return;
    const snapshot = DB.getSnapshot();
    if (!snapshot) return;
    if (!isUsingPasswordAuthentication()) {
      (thisPopup.inputs[0] as PasswordInput).hidden = true;
      thisPopup.buttonText = "reauthenticate to revoke all tokens";
    }
  },
});

list.unlinkDiscord = new SimpleModal({
  id: "unlinkDiscord",
  title: "Unlink Discord",
  text: "Are you sure you want to unlink your Discord account?",
  buttonText: "unlink",
  execFn: async (): Promise<ExecReturn> => {
    const snap = DB.getSnapshot();
    if (!snap) {
      return {
        status: -1,
        message: "Failed to unlink Discord: no snapshot",
      };
    }

    const response = await Ape.users.unlinkDiscord();
    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to unlink Discord",
        notificationOptions: { response },
      };
    }

    snap.discordAvatar = undefined;
    snap.discordId = undefined;
    DB.setSnapshot(snap);
    AccountSettings.updateUI();

    return {
      status: 1,
      message: "Discord unlinked",
    };
  },
});

list.deleteCustomText = new SimpleModal({
  id: "deleteCustomText",
  title: "Delete custom text",
  text: "Are you sure?",
  buttonText: "delete",
  execFn: async (_thisPopup): Promise<ExecReturn> => {
    CustomText.deleteCustomText(_thisPopup.parameters[0] as string, false);
    CustomTextState.setCustomTextName("", undefined);

    return {
      status: 1,
      message: "Custom text deleted",
    };
  },
  beforeInitFn: (_thisPopup): void => {
    _thisPopup.text = `Are you sure you want to delete custom text ${_thisPopup.parameters[0]}?`;
  },
});

list.deleteCustomTextLong = new SimpleModal({
  id: "deleteCustomTextLong",
  title: "Delete custom text",
  text: "Are you sure?",
  buttonText: "delete",
  execFn: async (_thisPopup): Promise<ExecReturn> => {
    CustomText.deleteCustomText(_thisPopup.parameters[0] as string, true);
    CustomTextState.setCustomTextName("", undefined);

    return {
      status: 1,
      message: "Custom text deleted",
    };
  },
  beforeInitFn: (_thisPopup): void => {
    _thisPopup.text = `Are you sure you want to delete custom text ${_thisPopup.parameters[0]}?`;
  },
});

list.resetProgressCustomTextLong = new SimpleModal({
  id: "resetProgressCustomTextLong",
  title: "Reset progress for custom text",
  text: "Are you sure?",
  buttonText: "reset",
  execFn: async (_thisPopup): Promise<ExecReturn> => {
    CustomText.setCustomTextLongProgress(_thisPopup.parameters[0] as string, 0);
    const text = CustomText.getCustomText(
      _thisPopup.parameters[0] as string,
      true,
    );
    CustomText.setText(text);
    return {
      status: 1,
      message: "Custom text progress reset",
    };
  },
  beforeInitFn: (_thisPopup): void => {
    _thisPopup.text = `Are you sure you want to reset your progress for custom text ${_thisPopup.parameters[0]}?`;
  },
});

list.updateCustomTheme = new SimpleModal({
  id: "updateCustomTheme",
  title: "Update custom theme",
  inputs: [
    {
      type: "text",
      placeholder: "name",
      initVal: "",
    },
    {
      type: "checkbox",
      initVal: false,
      label: "Update custom theme to current colors",
      optional: true,
    },
  ],
  buttonText: "update",
  execFn: async (_thisPopup, name, updateColors): Promise<ExecReturn> => {
    const snapshot = DB.getSnapshot();
    if (!snapshot) {
      return {
        status: -1,
        message: "Failed to update custom theme: no snapshot",
      };
    }

    const customTheme = snapshot.customThemes?.find(
      (t) => t._id === _thisPopup.parameters[0],
    );
    if (customTheme === undefined) {
      return {
        status: -1,
        message: "Failed to update custom theme: theme not found",
      };
    }

    let newColors =
      updateColors === "true"
        ? ThemeController.convertThemeToCustomColors(getTheme())
        : customTheme.colors;

    const newTheme = {
      name: name.replaceAll(" ", "_"),
      colors: newColors,
    };
    const validation = await DB.editCustomTheme(customTheme._id, newTheme);
    if (!validation) {
      return {
        status: -1,
        message: "Failed to update custom theme",
      };
    }
    setConfig("customThemeColors", newColors);
    void ThemePicker.fillCustomButtons();

    return {
      status: 1,
      message: "Custom theme updated",
    };
  },
  beforeInitFn: (_thisPopup): void => {
    const snapshot = DB.getSnapshot();
    if (!snapshot) return;

    const customTheme = snapshot.customThemes?.find(
      (t) => t._id === _thisPopup.parameters[0],
    );
    if (!customTheme) return;
    (_thisPopup.inputs[0] as TextInput).initVal = customTheme.name;
  },
});

list.deleteCustomTheme = new SimpleModal({
  id: "deleteCustomTheme",
  title: "Delete custom theme",
  text: "Are you sure?",
  buttonText: "delete",
  execFn: async (_thisPopup): Promise<ExecReturn> => {
    await DB.deleteCustomTheme(_thisPopup.parameters[0] as string);
    void ThemePicker.fillCustomButtons();

    return {
      status: 1,
      message: "Custom theme deleted",
    };
  },
});

list.devGenerateData = new SimpleModal({
  id: "devGenerateData",
  title: "Generate data",
  showLabels: true,
  inputs: [
    {
      type: "text",
      label: "username",
      placeholder: "username",
      oninput: (event): void => {
        const target = event.target as HTMLInputElement;
        const span = document.querySelector(
          "#devGenerateData_1 + span",
        ) as HTMLInputElement;
        span.innerText = `if checked, user will be created with ${target.value}@example.com and password: password`;
        return;
      },
      validation: {
        schema: UserNameSchema,
      },
    },
    {
      type: "checkbox",
      label: "create user",
      description:
        "if checked, user will be created with {username}@example.com and password: password",
      optional: true,
    },
    {
      type: "date",
      label: "first test",
      optional: true,
    },
    {
      type: "date",
      label: "last test",
      max: new Date(),
      optional: true,
    },
    {
      type: "range",
      label: "min tests per day",
      initVal: 0,
      min: 0,
      max: 200,
      step: 10,
    },
    {
      type: "range",
      label: "max tests per day",
      initVal: 50,
      min: 0,
      max: 200,
      step: 10,
    },
  ],
  buttonText: "generate (might take a while)",
  execFn: async (
    _thisPopup,
    username,
    createUser,
    firstTestTimestamp,
    lastTestTimestamp,
    minTestsPerDay,
    maxTestsPerDay,
  ): Promise<ExecReturn> => {
    const request: GenerateDataRequest = {
      username,
      createUser: createUser === "true",
    };
    if (firstTestTimestamp !== undefined && firstTestTimestamp.length > 0) {
      request.firstTestTimestamp = Date.parse(firstTestTimestamp);
    }
    if (lastTestTimestamp !== undefined && lastTestTimestamp.length > 0) {
      request.lastTestTimestamp = Date.parse(lastTestTimestamp);
    }
    if (minTestsPerDay !== undefined && minTestsPerDay.length > 0) {
      request.minTestsPerDay = Number.parseInt(minTestsPerDay);
    }
    if (maxTestsPerDay !== undefined && maxTestsPerDay.length > 0) {
      request.maxTestsPerDay = Number.parseInt(maxTestsPerDay);
    }

    const result = await Ape.dev.generateData({ body: request });

    return {
      status: result.status === 200 ? 1 : -1,
      message: result.body.message,
      hideOptions: {
        clearModalChain: true,
      },
    };
  },
});

list.lbGoToPage = new SimpleModal({
  id: "lbGoToPage",
  title: "Go to page",
  inputs: [
    {
      type: "number",
      placeholder: "Page number",
    },
  ],
  buttonText: "Go",
  execFn: async (_thisPopup, pageNumber): Promise<ExecReturn> => {
    const page = parseInt(pageNumber, 10);
    if (isNaN(page) || page < 1) {
      return {
        status: 0,
        message: "Invalid page number",
      };
    }

    goToPage(page - 1);

    return {
      status: 1,
      message: "Navigating to page " + page,
      showNotification: false,
    };
  },
});
