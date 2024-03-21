import Ape from "../ape";
import * as AccountController from "../controllers/account-controller";
import * as DB from "../db";
import * as UpdateConfig from "../config";
import * as Loader from "../elements/loader";
import * as Notifications from "../elements/notifications";
import * as Settings from "../pages/settings";
import * as ApeKeysPopup from "../popups/ape-keys-popup";
import * as ThemePicker from "../settings/theme-picker";
import * as CustomText from "../test/custom-text";
import * as SavedTextsPopup from "./saved-texts-popup";
import * as AccountButton from "../elements/account-button";
import { FirebaseError } from "firebase/app";
import { Auth, isAuthenticated, getAuthenticatedUser } from "../firebase";
import * as ConnectionState from "../states/connection";
import {
  EmailAuthProvider,
  User,
  linkWithCredential,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  unlink,
  updatePassword,
} from "firebase/auth";
import {
  createErrorMessage,
  isElementVisible,
  isDevEnvironment,
  isPasswordStrong,
  reloadAfter,
} from "../utils/misc";
import * as CustomTextState from "../states/custom-text-name";
import * as Skeleton from "../utils/skeleton";
import * as ThemeController from "../controllers/theme-controller";

const wrapperId = "simplePopupWrapper";

type Input = {
  placeholder?: string;
  type?: string;
  initVal: string;
  hidden?: boolean;
  disabled?: boolean;
  label?: string;
};

let activePopup: SimplePopup | null = null;

type ExecReturn = {
  status: 1 | 0 | -1;
  message: string;
  showNotification?: false;
  notificationOptions?: MonkeyTypes.AddNotificationOptions;
  afterHide?: () => void;
};

type PopupKey =
  | "updateEmail"
  | "updateName"
  | "updatePassword"
  | "removeGoogleAuth"
  | "addPasswordAuth"
  | "deleteAccount"
  | "resetAccount"
  | "clearTagPb"
  | "optOutOfLeaderboards"
  | "clearTagPb"
  | "applyCustomFont"
  | "resetPersonalBests"
  | "resetSettings"
  | "revokeAllTokens"
  | "unlinkDiscord"
  | "generateApeKey"
  | "viewApeKey"
  | "deleteApeKey"
  | "editApeKey"
  | "deleteCustomText"
  | "deleteCustomTextLong"
  | "resetProgressCustomTextLong"
  | "updateCustomTheme"
  | "deleteCustomTheme"
  | "forgotPassword";

const list: Record<PopupKey, SimplePopup | undefined> = {
  updateEmail: undefined,
  updateName: undefined,
  updatePassword: undefined,
  removeGoogleAuth: undefined,
  addPasswordAuth: undefined,
  deleteAccount: undefined,
  resetAccount: undefined,
  clearTagPb: undefined,
  optOutOfLeaderboards: undefined,
  applyCustomFont: undefined,
  resetPersonalBests: undefined,
  resetSettings: undefined,
  revokeAllTokens: undefined,
  unlinkDiscord: undefined,
  generateApeKey: undefined,
  viewApeKey: undefined,
  deleteApeKey: undefined,
  editApeKey: undefined,
  deleteCustomText: undefined,
  deleteCustomTextLong: undefined,
  resetProgressCustomTextLong: undefined,
  updateCustomTheme: undefined,
  deleteCustomTheme: undefined,
  forgotPassword: undefined,
};

type SimplePopupOptions = {
  id: string;
  type: string;
  title: string;
  inputs: Input[];
  text?: string;
  buttonText: string;
  execFn: (thisPopup: SimplePopup, ...params: string[]) => Promise<ExecReturn>;
  beforeInitFn: (thisPopup: SimplePopup) => void;
  beforeShowFn?: (thisPopup: SimplePopup) => void;
};

class SimplePopup {
  parameters: string[];
  wrapper: JQuery;
  element: JQuery;
  id: string;
  type: string;
  title: string;
  inputs: Input[];
  text?: string;
  buttonText: string;
  execFn: (thisPopup: SimplePopup, ...params: string[]) => Promise<ExecReturn>;
  beforeInitFn: (thisPopup: SimplePopup) => void;
  beforeShowFn: ((thisPopup: SimplePopup) => void) | undefined;
  canClose: boolean;
  private noAnimation: boolean;
  constructor(options: SimplePopupOptions) {
    this.parameters = [];
    this.id = options.id;
    this.type = options.type;
    this.execFn = options.execFn;
    this.title = options.title;
    this.inputs = options.inputs;
    this.text = options.text;
    this.wrapper = $("#simplePopupWrapper");
    this.element = $("#simplePopup");
    this.buttonText = options.buttonText;
    this.beforeInitFn = options.beforeInitFn;
    this.beforeShowFn = options.beforeShowFn;
    this.canClose = true;
    this.noAnimation = false;
  }
  reset(): void {
    this.element.html(`
    <form>
    <div class="title"></div>
    <div class="inputs"></div>
    <div class="text"></div>
    <button type="submit" class="submitButton"></button>
    </form>`);
  }

  init(): void {
    const el = this.element;
    el.find("input").val("");
    // if (el.attr("popupId") !== this.id) {
    this.reset();
    el.attr("popupId", this.id);
    el.find(".title").text(this.title);
    el.find(".text").text(this.text ?? "");

    this.initInputs();

    if (this.buttonText === "") {
      el.find(".submitButton").remove();
    } else {
      el.find(".submitButton").text(this.buttonText);
    }

    if (this.text === "") {
      el.find(".text").addClass("hidden");
    } else {
      el.find(".text").removeClass("hidden");
    }

    // }
  }

  initInputs(): void {
    const el = this.element;
    if (this.inputs.length > 0) {
      if (this.type === "number") {
        this.inputs.forEach((input) => {
          el.find(".inputs").append(`
            <input
              type="number"
              min="1"
              value="${input.initVal}"
              placeholder="${input.placeholder}"
              class="${input.hidden ? "hidden" : ""}"
              ${input.hidden ? "" : "required"}
              autocomplete="off"
            >
          `);
        });
      } else if (this.type === "text") {
        this.inputs.forEach((input) => {
          if (input.type !== undefined && input.type !== "") {
            if (input.type === "textarea") {
              el.find(".inputs").append(`
                <textarea
                  placeholder="${input.placeholder}"
                  class="${input.hidden ? "hidden" : ""}"
                  ${input.hidden ? "" : "required"}
                  ${input.disabled ? "disabled" : ""}
                  autocomplete="off"
                >${input.initVal}</textarea>
              `);
            } else if (input.type === "checkbox") {
              el.find(".inputs").append(`
              <label class="checkbox">
                <input type="checkbox" checked="">
                <div>${input.label}</div>
              </label>
              `);
            } else {
              el.find(".inputs").append(`
              <input
              type="${input.type}"
              value="${input.initVal}"
              placeholder="${input.placeholder}"
              class="${input.hidden ? "hidden" : ""}"
              ${input.hidden ? "" : "required"}
              ${input.disabled ? "disabled" : ""}
              autocomplete="off"
              >
              `);
            }
          } else {
            el.find(".inputs").append(`
              <input
                type="text"
                value="${input.initVal}"
                placeholder="${input.placeholder}"
                class="${input.hidden ? "hidden" : ""}"
                ${input.hidden ? "" : "required"}
                ${input.disabled ? "disabled" : ""}
                autocomplete="off"
              >
            `);
          }
        });
      }
      el.find(".inputs").removeClass("hidden");
    } else {
      el.find(".inputs").addClass("hidden");
    }
  }

  exec(): void {
    if (!this.canClose) return;
    const vals: string[] = [];
    for (const el of $("#simplePopup input, #simplePopup textarea")) {
      if ($(el).is(":checkbox")) {
        vals.push($(el).is(":checked") ? "true" : "false");
      } else {
        vals.push($(el).val() as string);
      }
    }

    const inputsWithCurrentValue = [];
    for (let i = 0; i < this.inputs.length; i++) {
      inputsWithCurrentValue.push({ ...this.inputs[i], currentValue: vals[i] });
    }

    if (
      inputsWithCurrentValue
        .filter((i) => !i.hidden)
        .some((v) => v.currentValue === undefined || v.currentValue === "")
    ) {
      Notifications.add("Please fill in all fields", 0);
      return;
    }

    this.disableInputs();
    Loader.show();
    void this.execFn(this, ...vals).then((res) => {
      Loader.hide();
      if (res.showNotification ?? true) {
        Notifications.add(res.message, res.status, res.notificationOptions);
      }
      if (res.status === 1) {
        void this.hide().then(() => {
          if (res.afterHide) {
            res.afterHide();
          }
        });
      } else {
        this.enableInputs();
        $($("#simplePopup").find("input")[0] as HTMLInputElement).trigger(
          "focus"
        );
      }
    });
  }

  disableInputs(): void {
    $("#simplePopup input").prop("disabled", true);
    $("#simplePopup button").prop("disabled", true);
    $("#simplePopup textarea").prop("disabled", true);
    $("#simplePopup .checkbox").addClass("disabled");
  }

  enableInputs(): void {
    $("#simplePopup input").prop("disabled", false);
    $("#simplePopup button").prop("disabled", false);
    $("#simplePopup textarea").prop("disabled", false);
    $("#simplePopup .checkbox").removeClass("disabled");
  }

  show(parameters: string[] = [], noAnimation = false): void {
    Skeleton.append(wrapperId, "popups");
    activePopup = this;
    this.noAnimation = noAnimation;
    this.parameters = parameters;
    this.beforeInitFn(this);
    this.init();
    this.beforeShowFn?.(this);
    this.wrapper
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, noAnimation ? 0 : 125, () => {
        if (this.inputs.length > 0) {
          $($("#simplePopup").find("input")[0] as HTMLInputElement).trigger(
            "focus"
          );
        } else {
          $("#simplePopup button").trigger("focus");
        }
      });
  }

  async hide(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.canClose) {
        reject(new Error("Cannot close popup"));
        return;
      }

      activePopup = null;

      this.wrapper
        .stop(true, true)
        .css("opacity", 1)
        .removeClass("hidden")
        .animate({ opacity: 0 }, this.noAnimation ? 0 : 125, () => {
          this.wrapper.addClass("hidden");
          Skeleton.remove(wrapperId);
          resolve();
        });
    });
  }
}

function hide(): void {
  if (activePopup) {
    void activePopup.hide();
    return;
  }
  $("#simplePopupWrapper")
    .stop(true, true)
    .css("opacity", 1)
    .removeClass("hidden")
    .animate({ opacity: 0 }, 125, () => {
      $("#simplePopupWrapper").addClass("hidden");
    });
}

$("#simplePopupWrapper").on("mousedown", (e) => {
  if ($(e.target).attr("id") === "simplePopupWrapper") {
    if (activePopup) {
      void activePopup.hide();
      return;
    }
    $("#simplePopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .removeClass("hidden")
      .animate({ opacity: 0 }, 125, () => {
        $("#simplePopupWrapper").addClass("hidden");
      });
  }
});

$("#popups").on("submit", "#simplePopupWrapper form", (e) => {
  e.preventDefault();
  const id = $("#simplePopup").attr("popupId") as PopupKey;
  (list[id] as SimplePopup).exec();
});

type ReauthMethod = "passwordOnly" | "passwordFirst";

type ReauthSuccess = {
  status: 1;
  message: string;
  user: User;
};

type ReauthFailed = {
  status: -1 | 0;
  message: string;
};

async function reauthenticate(
  method: ReauthMethod,
  password: string
): Promise<ReauthSuccess | ReauthFailed> {
  if (Auth === undefined) {
    return {
      status: -1,
      message: "Authentication is not initialized",
    };
  }

  if (!isAuthenticated()) {
    return {
      status: -1,
      message: "User is not signed in",
    };
  }
  const user = getAuthenticatedUser();

  try {
    const passwordAuthEnabled = user.providerData.some(
      (p) => p?.providerId === "password"
    );

    if (!passwordAuthEnabled && method === "passwordOnly") {
      return {
        status: -1,
        message:
          "Failed to reauthenticate in password only mode: password authentication is not enabled on this account",
      };
    }

    if (passwordAuthEnabled) {
      const credential = EmailAuthProvider.credential(
        user.email as string,
        password
      );
      await reauthenticateWithCredential(user, credential);
    } else if (method === "passwordFirst") {
      await reauthenticateWithPopup(user, AccountController.gmailProvider);
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

list.updateEmail = new SimplePopup({
  id: "updateEmail",
  type: "text",
  title: "Update email",
  inputs: [
    {
      placeholder: "Password",
      type: "password",
      initVal: "",
    },
    {
      placeholder: "New email",
      initVal: "",
    },
    {
      placeholder: "Confirm new email",
      initVal: "",
    },
  ],
  buttonText: "update",
  execFn: async (
    _thisPopup,
    password,
    email,
    emailConfirm
  ): Promise<ExecReturn> => {
    if (email !== emailConfirm) {
      return {
        status: 0,
        message: "Emails don't match",
      };
    }

    const reauth = await reauthenticate("passwordOnly", password);
    if (reauth.status !== 1) {
      return {
        status: reauth.status,
        message: reauth.message,
      };
    }

    const response = await Ape.users.updateEmail(
      email,
      reauth.user.email as string
    );

    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to update email: " + response.message,
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

list.removeGoogleAuth = new SimplePopup({
  id: "removeGoogleAuth",
  type: "text",
  title: "Remove Google Authentication",
  inputs: [
    {
      placeholder: "Password",
      type: "password",
      initVal: "",
    },
  ],
  text: "",
  buttonText: "Remove",
  execFn: async (_thisPopup, password): Promise<ExecReturn> => {
    const reauth = await reauthenticate("passwordOnly", password);
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

    Settings.updateAuthSections();

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
      thisPopup.buttonText = "";
      thisPopup.text = "Password authentication is not enabled";
    }
  },
  beforeShowFn: (_thisPopup): void => {
    //
  },
});

list.updateName = new SimplePopup({
  id: "updateName",
  type: "text",
  title: "Update Name",
  inputs: [
    {
      placeholder: "Password",
      type: "password",
      initVal: "",
    },
    {
      placeholder: "New name",
      type: "text",
      initVal: "",
    },
  ],
  text: "",
  buttonText: "Update",
  execFn: async (_thisPopup, pass, newName): Promise<ExecReturn> => {
    const reauth = await reauthenticate("passwordFirst", pass);
    if (reauth.status !== 1) {
      return {
        status: reauth.status,
        message: reauth.message,
      };
    }

    const checkNameResponse = await Ape.users.getNameAvailability(newName);

    if (checkNameResponse.status === 409) {
      return {
        status: 0,
        message: "Name not available",
      };
    } else if (checkNameResponse.status !== 200) {
      return {
        status: -1,
        message: "Failed to check name: " + checkNameResponse.message,
      };
    }

    const updateNameResponse = await Ape.users.updateName(newName);
    if (updateNameResponse.status !== 200) {
      return {
        status: -1,
        message: "Failed to update name: " + updateNameResponse.message,
      };
    }

    const snapshot = DB.getSnapshot();
    if (snapshot) {
      snapshot.name = newName;
      if (snapshot.needsToChangeName) {
        reloadAfter(2);
      }
    }
    $("nav .textButton.account .text").text(newName);

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
      (thisPopup.inputs[0] as Input).hidden = true;
      thisPopup.buttonText = "Reauthenticate to update";
    }
    if (snapshot.needsToChangeName === true) {
      thisPopup.text =
        "You need to change your account name. This might be because you have a duplicate name, no account name or your name is not allowed (contains whitespace or invalid characters). Sorry for the inconvenience.";
    }
  },
  beforeShowFn: (_thisPopup): void => {
    //
  },
});

list.updatePassword = new SimplePopup({
  id: "updatePassword",
  type: "text",
  title: "Update Password",
  inputs: [
    {
      placeholder: "Password",
      type: "password",
      initVal: "",
    },
    {
      placeholder: "New password",
      type: "password",
      initVal: "",
    },
    {
      placeholder: "Confirm new password",
      type: "password",
      initVal: "",
    },
  ],
  text: "",
  buttonText: "Update",
  execFn: async (
    _thisPopup,
    previousPass,
    newPass,
    newPassConfirm
  ): Promise<ExecReturn> => {
    if (newPass !== newPassConfirm) {
      return {
        status: 0,
        message: "New passwords don't match",
      };
    }

    if (newPass === previousPass) {
      return {
        status: 0,
        message: "New password must be different from previous password",
      };
    }

    if (!isDevEnvironment() && !isPasswordStrong(newPass)) {
      return {
        status: 0,
        message:
          "New password must contain at least one capital letter, number, a special character and must be between 8 and 64 characters long",
      };
    }

    const reauth = await reauthenticate("passwordOnly", previousPass);
    if (reauth.status !== 1) {
      return {
        status: reauth.status,
        message: reauth.message,
      };
    }

    try {
      await updatePassword(reauth.user, newPass);
    } catch (e) {
      const message = createErrorMessage(e, "Failed to update password");
      return {
        status: -1,
        message,
      };
    }

    reloadAfter(3);

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
  beforeShowFn: (_thisPopup): void => {
    //
  },
});

list.addPasswordAuth = new SimplePopup({
  id: "addPasswordAuth",
  type: "text",
  title: "Add Password Authentication",
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
  text: "",
  buttonText: "Add",
  execFn: async (
    _thisPopup,
    email,
    emailConfirm,
    pass,
    passConfirm
  ): Promise<ExecReturn> => {
    if (email !== emailConfirm) {
      return {
        status: 0,
        message: "Emails don't match",
      };
    }

    if (pass !== passConfirm) {
      return {
        status: 0,
        message: "Passwords don't match",
      };
    }

    const reauth = await reauthenticate("passwordFirst", pass);
    if (reauth.status !== 1) {
      return {
        status: reauth.status,
        message: reauth.message,
      };
    }

    try {
      const credential = EmailAuthProvider.credential(email, pass);
      await linkWithCredential(reauth.user, credential);
    } catch (e) {
      const message = createErrorMessage(
        e,
        "Failed to add password authentication"
      );
      return {
        status: -1,
        message,
      };
    }

    const response = await Ape.users.updateEmail(
      email,
      reauth.user.email as string
    );
    if (response.status !== 200) {
      return {
        status: -1,
        message:
          "Password authentication added but updating the database email failed. This shouldn't happen, please contact support. Error: " +
          response.message,
      };
    }

    Settings.updateAuthSections();
    return {
      status: 1,
      message: "Password authentication added",
    };
  },
  beforeInitFn: (): void => {
    //
  },
  beforeShowFn: (_thisPopup): void => {
    //
  },
});

list.deleteAccount = new SimplePopup({
  id: "deleteAccount",
  type: "text",
  title: "Delete Account",
  inputs: [
    {
      placeholder: "Password",
      type: "password",
      initVal: "",
    },
  ],
  text: "This is the last time you can change your mind. After pressing the button everything is gone.",
  buttonText: "Delete",
  execFn: async (_thisPopup, password): Promise<ExecReturn> => {
    const reauth = await reauthenticate("passwordFirst", password);
    if (reauth.status !== 1) {
      return {
        status: reauth.status,
        message: reauth.message,
      };
    }

    Notifications.add("Deleting all data...", 0);
    const usersResponse = await Ape.users.delete();

    if (usersResponse.status !== 200) {
      return {
        status: -1,
        message: "Failed to delete user data: " + usersResponse.message,
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
      thisPopup.buttonText = "Reauthenticate to delete";
    }
  },
  beforeShowFn: (_thisPopup): void => {
    //
  },
});

list.resetAccount = new SimplePopup({
  id: "resetAccount",
  type: "text",
  title: "Reset Account",
  inputs: [
    {
      placeholder: "Password",
      type: "password",
      initVal: "",
    },
  ],
  text: "This is the last time you can change your mind. After pressing the button everything is gone.",
  buttonText: "Reset",
  execFn: async (_thisPopup, password): Promise<ExecReturn> => {
    const reauth = await reauthenticate("passwordFirst", password);
    if (reauth.status !== 1) {
      return {
        status: reauth.status,
        message: reauth.message,
      };
    }

    Notifications.add("Resetting settings...", 0);
    await UpdateConfig.reset();

    Notifications.add("Resetting account...", 0);
    const response = await Ape.users.reset();
    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to reset account: " + response.message,
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
      thisPopup.buttonText = "Reauthenticate to reset";
    }
  },
  beforeShowFn: (_thisPopup): void => {
    //
  },
});

list.optOutOfLeaderboards = new SimplePopup({
  id: "optOutOfLeaderboards",
  type: "text",
  title: "Opt out of leaderboards",
  inputs: [
    {
      placeholder: "Password",
      type: "password",
      initVal: "",
    },
  ],
  text: "Are you sure you want to opt out of leaderboards?",
  buttonText: "Opt out",
  execFn: async (_thisPopup, password): Promise<ExecReturn> => {
    const reauth = await reauthenticate("passwordFirst", password);
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
        message: "Failed to opt out: " + response.message,
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
      thisPopup.buttonText = "Reauthenticate to reset";
    }
  },
  beforeShowFn: (_thisPopup): void => {
    //
  },
});

list.clearTagPb = new SimplePopup({
  id: "clearTagPb",
  type: "text",
  title: "Clear Tag PB",
  inputs: [],
  text: "Are you sure you want to clear this tags PB?",
  buttonText: "Clear",
  execFn: async (thisPopup): Promise<ExecReturn> => {
    const tagId = thisPopup.parameters[0] as string;
    const response = await Ape.users.deleteTagPersonalBest(tagId);
    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to clear tag PB: " + response.message,
      };
    }

    const tag = DB.getSnapshot()?.tags?.filter((t) => t._id === tagId)[0];

    if (tag === undefined) {
      return {
        status: -1,
        message: "Tag not found",
      };
    }
    tag.personalBests = {
      time: {},
      words: {},
      quote: {},
      zen: {},
      custom: {},
    };
    $(
      `.pageSettings .section.tags .tagsList .tag[id="${tagId}"] .clearPbButton`
    ).attr("aria-label", "No PB found");
    return {
      status: 1,
      message: "Tag PB cleared",
    };
  },
  beforeInitFn: (thisPopup): void => {
    thisPopup.text = `Are you sure you want to clear PB for tag ${thisPopup.parameters[1]}?`;
  },
  beforeShowFn: (_thisPopup): void => {
    //
  },
});

list.applyCustomFont = new SimplePopup({
  id: "applyCustomFont",
  type: "text",
  title: "Custom font",
  inputs: [{ placeholder: "Font name", initVal: "" }],
  text: "Make sure you have the font installed on your computer before applying",
  buttonText: "Apply",
  execFn: async (_thisPopup, fontName): Promise<ExecReturn> => {
    Settings.groups["fontFamily"]?.setValue(fontName.replace(/\s/g, "_"));

    return {
      status: 1,
      message: "Font applied",
    };
  },
  beforeInitFn: (): void => {
    //
  },
  beforeShowFn: (_thisPopup): void => {
    //
  },
});

list.resetPersonalBests = new SimplePopup({
  id: "resetPersonalBests",
  type: "text",
  title: "Reset Personal Bests",
  inputs: [
    {
      placeholder: "Password",
      type: "password",
      initVal: "",
    },
  ],
  text: "",
  buttonText: "Reset",
  execFn: async (_thisPopup, password): Promise<ExecReturn> => {
    const reauth = await reauthenticate("passwordFirst", password);
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
        message: "Failed to reset personal bests: " + response.message,
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
      thisPopup.buttonText = "Reauthenticate to reset";
    }
  },
  beforeShowFn: (_thisPopup): void => {
    //
  },
});

list.resetSettings = new SimplePopup({
  id: "resetSettings",
  type: "text",
  title: "Reset Settings",
  inputs: [],
  text: "Are you sure you want to reset all your settings?",
  buttonText: "Reset",
  execFn: async (): Promise<ExecReturn> => {
    await UpdateConfig.reset();
    return {
      status: 1,
      message: "Settings reset",
    };
  },
  beforeInitFn: (): void => {
    //
  },
  beforeShowFn: (_thisPopup): void => {
    //
  },
});

list.revokeAllTokens = new SimplePopup({
  id: "revokeAllTokens",
  type: "text",
  title: "Revoke All Tokens",
  inputs: [
    {
      placeholder: "Password",
      type: "password",
      initVal: "",
    },
  ],
  text: "Are you sure you want to this? This will log you out of all devices.",
  buttonText: "revoke all",
  execFn: async (_thisPopup, password): Promise<ExecReturn> => {
    const reauth = await reauthenticate("passwordFirst", password);
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
        message: "Failed to revoke tokens: " + response.message,
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
      (thisPopup.inputs[0] as Input).hidden = true;
      thisPopup.buttonText = "reauthenticate to revoke all tokens";
    }
  },
  beforeShowFn: (_thisPopup): void => {
    //
  },
});

list.unlinkDiscord = new SimplePopup({
  id: "unlinkDiscord",
  type: "text",
  title: "Unlink Discord",
  inputs: [],
  text: "Are you sure you want to unlink your Discord account?",
  buttonText: "Unlink",
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
        message: "Failed to unlink Discord: " + response.message,
      };
    }

    snap.discordAvatar = undefined;
    snap.discordId = undefined;
    void AccountButton.update();
    DB.setSnapshot(snap);
    Settings.updateDiscordSection();

    return {
      status: 1,
      message: "Discord unlinked",
    };
  },
  beforeInitFn: (): void => {
    //
  },
  beforeShowFn: (_thisPopup): void => {
    //
  },
});

list.generateApeKey = new SimplePopup({
  id: "generateApeKey",
  type: "text",
  title: "Generate new key",
  inputs: [
    {
      placeholder: "Name",
      initVal: "",
    },
  ],
  text: "",
  buttonText: "Generate",
  execFn: async (_thisPopup, name): Promise<ExecReturn> => {
    const response = await Ape.apeKeys.generate(name, false);
    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to generate key: " + response.message,
      };
    }

    //if response is 200 data is guaranteed to not be null
    const data = response.data as Ape.ApeKeys.GenerateApeKey;

    return {
      status: 1,
      message: "Key generated",
      afterHide: (): void => {
        showPopup("viewApeKey", [data.apeKey]);
      },
    };
  },
  beforeInitFn: (): void => {
    //
  },
  beforeShowFn: (_thisPopup): void => {
    //
  },
});

list.viewApeKey = new SimplePopup({
  id: "viewApeKey",
  type: "text",
  title: "Ape Key",
  inputs: [
    {
      type: "textarea",
      disabled: true,
      placeholder: "Key",
      initVal: "",
    },
  ],
  text: "This is your new Ape Key. Please keep it safe. You will only see it once!",
  buttonText: "Close",
  execFn: async (_thisPopup): Promise<ExecReturn> => {
    void ApeKeysPopup.show();
    return {
      status: 1,
      message: "Key generated",
    };
  },
  beforeInitFn: (_thisPopup): void => {
    (_thisPopup.inputs[0] as Input).initVal = _thisPopup
      .parameters[0] as string;
  },
  beforeShowFn: (_thisPopup): void => {
    _thisPopup.canClose = false;
    $("#simplePopup textarea").css("height", "110px");
    $("#simplePopup .submitButton").addClass("hidden");
    setTimeout(() => {
      _thisPopup.canClose = true;
      $("#simplePopup .submitButton").removeClass("hidden");
    }, 5000);
  },
});

list.deleteApeKey = new SimplePopup({
  id: "deleteApeKey",
  type: "text",
  title: "Delete Ape Key",
  inputs: [],
  text: "Are you sure?",
  buttonText: "Delete",
  execFn: async (_thisPopup): Promise<ExecReturn> => {
    const response = await Ape.apeKeys.delete(_thisPopup.parameters[0] ?? "");
    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to delete key: " + response.message,
      };
    }

    void ApeKeysPopup.show();

    return {
      status: 1,
      message: "Key deleted",
    };
  },
  beforeInitFn: (_thisPopup): void => {
    //
  },
  beforeShowFn: (_thisPopup): void => {
    //
  },
});

list.editApeKey = new SimplePopup({
  id: "editApeKey",
  type: "text",
  title: "Edit Ape Key",
  inputs: [
    {
      placeholder: "Name",
      initVal: "",
    },
  ],
  text: "",
  buttonText: "Edit",
  execFn: async (_thisPopup, input): Promise<ExecReturn> => {
    const response = await Ape.apeKeys.update(_thisPopup.parameters[0] ?? "", {
      name: input,
    });
    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to update key: " + response.message,
      };
    }

    void ApeKeysPopup.show();

    return {
      status: 1,
      message: "Key updated",
    };
  },
  beforeInitFn: (_thisPopup): void => {
    //
  },
  beforeShowFn: (_thisPopup): void => {
    //
  },
});

list.deleteCustomText = new SimplePopup({
  id: "deleteCustomText",
  type: "text",
  title: "Delete custom text",
  inputs: [],
  text: "Are you sure?",
  buttonText: "Delete",
  execFn: async (_thisPopup): Promise<ExecReturn> => {
    CustomText.deleteCustomText(_thisPopup.parameters[0] as string, false);
    CustomTextState.setCustomTextName("", undefined);
    void SavedTextsPopup.show(true);

    return {
      status: 1,
      message: "Custom text deleted",
    };
  },
  beforeInitFn: (_thisPopup): void => {
    _thisPopup.text = `Are you sure you want to delete custom text ${_thisPopup.parameters[0]}?`;
  },
  beforeShowFn: (): void => {
    //
  },
});

list.deleteCustomTextLong = new SimplePopup({
  id: "deleteCustomTextLong",
  type: "text",
  title: "Delete custom text",
  inputs: [],
  text: "Are you sure?",
  buttonText: "Delete",
  execFn: async (_thisPopup): Promise<ExecReturn> => {
    CustomText.deleteCustomText(_thisPopup.parameters[0] as string, true);
    CustomTextState.setCustomTextName("", undefined);
    void SavedTextsPopup.show(true);

    return {
      status: 1,
      message: "Custom text deleted",
    };
  },
  beforeInitFn: (_thisPopup): void => {
    _thisPopup.text = `Are you sure you want to delete custom text ${_thisPopup.parameters[0]}?`;
  },
  beforeShowFn: (): void => {
    //
  },
});

list.resetProgressCustomTextLong = new SimplePopup({
  id: "resetProgressCustomTextLong",
  type: "text",
  title: "Reset progress for custom text",
  inputs: [],
  text: "Are you sure?",
  buttonText: "Reset",
  execFn: async (_thisPopup): Promise<ExecReturn> => {
    CustomText.setCustomTextLongProgress(_thisPopup.parameters[0] as string, 0);
    void SavedTextsPopup.show(true);
    CustomText.setPopupTextareaState(
      CustomText.getCustomText(_thisPopup.parameters[0] as string, true).join(
        " "
      )
    );
    return {
      status: 1,
      message: "Custom text progress reset",
    };
  },
  beforeInitFn: (_thisPopup): void => {
    _thisPopup.text = `Are you sure you want to reset your progress for custom text ${_thisPopup.parameters[0]}?`;
  },
  beforeShowFn: (): void => {
    //
  },
});

list.updateCustomTheme = new SimplePopup({
  id: "updateCustomTheme",
  type: "text",
  title: "Update custom theme",
  inputs: [
    {
      type: "text",
      placeholder: "Name",
      initVal: "",
    },
    {
      type: "checkbox",
      initVal: "false",
      label: "Update custom theme to current colors",
    },
  ],
  text: "",
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
      (t) => t._id === _thisPopup.parameters[0]
    );
    if (customTheme === undefined) {
      return {
        status: -1,
        message: "Failed to update custom theme: theme not found",
      };
    }

    let newColors: string[] = [];
    if (updateColors === "true") {
      for (const color of ThemeController.colorVars) {
        newColors.push(
          $(
            `.pageSettings .customTheme .customThemeEdit #${color}[type='color']`
          ).attr("value") as string
        );
      }
    } else {
      newColors = customTheme.colors;
    }

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
    UpdateConfig.setCustomThemeColors(newColors);
    void ThemePicker.refreshButtons();

    return {
      status: 1,
      message: "Custom theme updated",
    };
  },
  beforeInitFn: (_thisPopup): void => {
    const snapshot = DB.getSnapshot();
    if (!snapshot) return;

    const customTheme = snapshot.customThemes?.find(
      (t) => t._id === _thisPopup.parameters[0]
    );
    if (!customTheme) return;
    (_thisPopup.inputs[0] as Input).initVal = customTheme.name;
  },
  beforeShowFn: (_thisPopup): void => {
    //
  },
});

list.deleteCustomTheme = new SimplePopup({
  id: "deleteCustomTheme",
  type: "text",
  title: "Delete Custom Theme",
  inputs: [],
  text: "Are you sure?",
  buttonText: "Delete",
  execFn: async (_thisPopup): Promise<ExecReturn> => {
    await DB.deleteCustomTheme(_thisPopup.parameters[0] as string);
    void ThemePicker.refreshButtons();

    return {
      status: 1,
      message: "Custom theme deleted",
    };
  },
  beforeInitFn: (_thisPopup): void => {
    //
  },
  beforeShowFn: (_thisPopup): void => {
    //
  },
});

list.forgotPassword = new SimplePopup({
  id: "forgotPassword",
  type: "text",
  title: "Forgot Password",
  inputs: [
    {
      type: "text",
      placeholder: "Email",
      initVal: "",
    },
  ],
  text: "",
  buttonText: "Send",
  execFn: async (_thisPopup, email): Promise<ExecReturn> => {
    const result = await Ape.users.forgotPasswordEmail(email.trim());
    if (result.status !== 200) {
      return {
        status: -1,
        message: "Failed to send password reset email: " + result.message,
      };
    }

    return {
      status: 1,
      message: result.message,
      notificationOptions: {
        duration: 8,
      },
    };
  },
  beforeInitFn: (thisPopup): void => {
    const inputValue = $(
      `.pageLogin .login input[name="current-email"]`
    ).val() as string;
    if (inputValue) {
      (thisPopup.inputs[0] as Input).initVal = inputValue;
      setTimeout(() => {
        ($("#simplePopup").find("input")[0] as HTMLInputElement).select();
      }, 1);
    }
  },
  beforeShowFn: (): void => {
    //
  },
});

function showPopup(
  key: PopupKey,
  showParams = [] as string[],
  noAnimation = false
): void {
  const popup = list[key];
  if (popup === undefined) {
    Notifications.add("Failed to show popup - popup is not defined", -1);
    return;
  }
  popup.show(showParams, noAnimation);
}

$(".pageLogin #forgotPasswordButton").on("click", () => {
  showPopup("forgotPassword");
});

$(".pageSettings .section.discordIntegration #unlinkDiscordButton").on(
  "click",
  () => {
    if (!ConnectionState.get()) {
      Notifications.add("You are offline", 0, { duration: 2 });
      return;
    }
    showPopup("unlinkDiscord");
  }
);

$(".pageSettings #removeGoogleAuth").on("click", () => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, { duration: 2 });
    return;
  }
  showPopup("removeGoogleAuth");
});

$("#resetSettingsButton").on("click", () => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, { duration: 2 });
    return;
  }
  showPopup("resetSettings");
});

$("#revokeAllTokens").on("click", () => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, { duration: 2 });
    return;
  }
  showPopup("revokeAllTokens");
});

$(".pageSettings #resetPersonalBestsButton").on("click", () => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, { duration: 2 });
    return;
  }
  showPopup("resetPersonalBests");
});

$(".pageSettings #updateAccountName").on("click", () => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, { duration: 2 });
    return;
  }
  showPopup("updateName");
});

$("#bannerCenter").on("click", ".banner .text .openNameChange", () => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, { duration: 2 });
    return;
  }
  showPopup("updateName");
});

$(".pageSettings #addPasswordAuth").on("click", () => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, { duration: 2 });
    return;
  }
  showPopup("addPasswordAuth");
});

$(".pageSettings #emailPasswordAuth").on("click", () => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, { duration: 2 });
    return;
  }
  showPopup("updateEmail");
});

$(".pageSettings #passPasswordAuth").on("click", () => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, { duration: 2 });
    return;
  }
  showPopup("updatePassword");
});

$(".pageSettings #deleteAccount").on("click", () => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, { duration: 2 });
    return;
  }
  showPopup("deleteAccount");
});

$(".pageSettings #resetAccount").on("click", () => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, { duration: 2 });
    return;
  }
  showPopup("resetAccount");
});

$(".pageSettings #optOutOfLeaderboardsButton").on("click", () => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, { duration: 2 });
    return;
  }
  showPopup("optOutOfLeaderboards");
});

$("#popups").on("click", "#apeKeysPopup .generateApeKey", () => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, { duration: 2 });
    return;
  }
  showPopup("generateApeKey");
});

$(".pageSettings").on(
  "click",
  ".section.themes .customTheme .delButton",
  (e) => {
    if (!ConnectionState.get()) {
      Notifications.add("You are offline", 0, { duration: 2 });
      return;
    }
    const $parentElement = $(e.currentTarget).parent(".customTheme.button");
    const customThemeId = $parentElement.attr("customThemeId") as string;
    showPopup("deleteCustomTheme", [customThemeId]);
  }
);

$(".pageSettings").on(
  "click",
  ".section.themes .customTheme .editButton",
  (e) => {
    if (!ConnectionState.get()) {
      Notifications.add("You are offline", 0, { duration: 2 });
      return;
    }
    const $parentElement = $(e.currentTarget).parent(".customTheme.button");
    const customThemeId = $parentElement.attr("customThemeId") as string;
    showPopup("updateCustomTheme", [customThemeId]);
  }
);

$("#popups").on(
  "click",
  `#savedTextsPopupWrapper .list .savedText .button.delete`,
  (e) => {
    const name = $(e.target).siblings(".button.name").text();
    showPopup("deleteCustomText", [name], true);
  }
);

$("#popups").on(
  "click",
  `#savedTextsPopupWrapper .listLong .savedText .button.delete`,
  (e) => {
    const name = $(e.target).siblings(".button.name").text();
    showPopup("deleteCustomTextLong", [name], true);
  }
);

$("#popups").on(
  "click",
  `#savedTextsPopupWrapper .listLong .savedText .button.resetProgress`,
  (e) => {
    const name = $(e.target).siblings(".button.name").text();
    showPopup("resetProgressCustomTextLong", [name], true);
  }
);

$("#popups").on("click", "#apeKeysPopup table tbody tr .button.delete", (e) => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, { duration: 2 });
    return;
  }
  const keyId = $(e.target).closest("tr").attr("keyId") as string;
  showPopup("deleteApeKey", [keyId]);
});

$("#popups").on("click", "#apeKeysPopup table tbody tr .button.edit", (e) => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, { duration: 2 });
    return;
  }
  const keyId = $(e.target).closest("tr").attr("keyId") as string;
  showPopup("editApeKey", [keyId]);
});

$(".pageSettings").on(
  "click",
  ".section[data-config-name='fontFamily'] button[data-config-value='custom']",
  () => {
    showPopup("applyCustomFont", []);
  }
);

$(document).on("keydown", (event) => {
  if (event.key === "Escape" && isElementVisible("#simplePopupWrapper")) {
    hide();
    event.preventDefault();
  }
});

Skeleton.save(wrapperId);

console.log(list);

function isUsingPasswordAuthentication(): boolean {
  return (
    Auth?.currentUser?.providerData.find(
      (p) => p?.providerId === "password"
    ) !== undefined
  );
}
