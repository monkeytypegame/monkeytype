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
import { Auth } from "../firebase";
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
  isLocalhost,
  isPasswordStrong,
  reloadAfter,
} from "../utils/misc";
import * as CustomTextState from "../states/custom-text-name";
import * as Skeleton from "./skeleton";
import * as ThemeController from "../controllers/theme-controller";

const wrapperId = "simplePopupWrapper";

interface Input {
  placeholder?: string;
  type?: string;
  initVal: string;
  hidden?: boolean;
  disabled?: boolean;
  label?: string;
}

let activePopup: SimplePopup | null = null;

interface ExecReturn {
  status: 1 | 0 | -1;
  message: string;
  showNotification?: false;
  notificationOptions?: MonkeyTypes.AddNotificationOptions;
  afterHide?: () => void;
}

const list: { [key: string]: SimplePopup } = {};
class SimplePopup {
  parameters: string[];
  wrapper: JQuery;
  element: JQuery;
  id: string;
  type: string;
  title: string;
  inputs: Input[];
  text: string;
  buttonText: string;
  execFn: (thisPopup: SimplePopup, ...params: string[]) => Promise<ExecReturn>;
  beforeInitFn: (thisPopup: SimplePopup) => void;
  beforeShowFn: (thisPopup: SimplePopup) => void;
  canClose: boolean;
  private noAnimation: boolean;
  constructor(
    id: string,
    type: string,
    title: string,
    inputs: Input[] = [],
    text = "",
    buttonText = "Confirm",
    execFn: (
      thisPopup: SimplePopup,
      ...params: string[]
    ) => Promise<ExecReturn>,
    beforeInitFn: (thisPopup: SimplePopup) => void,
    beforeShowFn: (thisPopup: SimplePopup) => void
  ) {
    this.parameters = [];
    this.id = id;
    this.type = type;
    this.execFn = execFn;
    this.title = title;
    this.inputs = inputs;
    this.text = text;
    this.wrapper = $("#simplePopupWrapper");
    this.element = $("#simplePopup");
    this.buttonText = buttonText;
    this.beforeInitFn = (thisPopup): void => beforeInitFn(thisPopup);
    this.beforeShowFn = (thisPopup): void => beforeShowFn(thisPopup);
    this.canClose = true;
    this.noAnimation = false;
  }
  reset(): void {
    this.element.html(`
    <div class="title"></div>
    <div class="inputs"></div>
    <div class="text"></div>
    <div class="button"></div>`);
  }

  init(): void {
    const el = this.element;
    el.find("input").val("");
    // if (el.attr("popupId") !== this.id) {
    this.reset();
    el.attr("popupId", this.id);
    el.find(".title").text(this.title);
    el.find(".text").text(this.text);

    this.initInputs();

    if (this.buttonText === "") {
      el.find(".button").remove();
    } else {
      el.find(".button").text(this.buttonText);
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
          if (input.type) {
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
                  <input type="checkbox">
                  <div class="customTextCheckbox">
                    <div class="check">
                      <i class="fas fa-fw fa-check"></i>
                    </div>
                  </div>
                  ${input.label}
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
    $.each($("#simplePopup input"), (_, el) => {
      if ($(el).is(":checkbox")) {
        vals.push($(el).is(":checked") ? "true" : "false");
      } else {
        vals.push($(el).val() as string);
      }
    });

    if (vals.some((v) => v === undefined || v === "")) {
      Notifications.add("Please fill in all fields", 0);
      return;
    }

    this.disableInputs();
    Loader.show();
    this.execFn(this, ...vals).then((res) => {
      Loader.hide();
      if (res.showNotification ?? true) {
        Notifications.add(res.message, res.status, res.notificationOptions);
      }
      if (res.status === 1) {
        this.hide().then(() => {
          if (res.afterHide) {
            res.afterHide();
          }
        });
      } else {
        this.enableInputs();
        $($("#simplePopup").find("input")[0]).trigger("focus");
      }
    });
  }

  disableInputs(): void {
    $("#simplePopup input").prop("disabled", true);
    $("#simplePopup textarea").prop("disabled", true);
    $("#simplePopup .checkbox").addClass("disabled");
    $("#simplePopup .button").addClass("disabled");
  }

  enableInputs(): void {
    $("#simplePopup input").prop("disabled", false);
    $("#simplePopup textarea").prop("disabled", false);
    $("#simplePopup .checkbox").removeClass("disabled");
    $("#simplePopup .button").removeClass("disabled");
  }

  show(parameters: string[] = [], noAnimation = false): void {
    Skeleton.append(wrapperId);
    activePopup = this;
    this.noAnimation = noAnimation;
    this.parameters = parameters;
    this.beforeInitFn(this);
    this.init();
    this.beforeShowFn(this);
    this.wrapper
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, noAnimation ? 0 : 125, () => {
        $($("#simplePopup").find("input")[0]).trigger("focus");
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
    activePopup.hide();
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
    if (activePopup) return activePopup.hide();
    $("#simplePopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .removeClass("hidden")
      .animate({ opacity: 0 }, 125, () => {
        $("#simplePopupWrapper").addClass("hidden");
      });
  }
});

$("#popups").on("click", "#simplePopupWrapper .button", () => {
  const id = $("#simplePopup").attr("popupId") ?? "";
  list[id].exec();
});

$("#popups").on("keyup", "#simplePopupWrapper input", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const id = $("#simplePopup").attr("popupId") ?? "";
    list[id].exec();
  }
});

type ReauthMethod = "passwordOnly" | "passwordFirst";

interface ReauthSuccess {
  status: 1;
  message: string;
  user: User;
}

interface ReauthFailed {
  status: -1 | 0;
  message: string;
}

async function reauthenticate(
  method: ReauthMethod,
  password: string
): Promise<ReauthSuccess | ReauthFailed> {
  if (!Auth) {
    return {
      status: -1,
      message: "Authentication is not initialized",
    };
  }
  const user = Auth.currentUser;
  if (!user) {
    return {
      status: -1,
      message: "User is not signed in",
    };
  }

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
          (typedError?.message || JSON.stringify(e)),
      };
    }
  }
}

list["updateEmail"] = new SimplePopup(
  "updateEmail",
  "text",
  "Update Email",
  [
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
  "",
  "Update",
  async (_thisPopup, password, email, emailConfirm) => {
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
  (thisPopup) => {
    const user = Auth?.currentUser;
    if (!user) return;
    if (!user.providerData.find((p) => p?.providerId === "password")) {
      thisPopup.inputs = [];
      thisPopup.buttonText = "";
      thisPopup.text = "Password authentication is not enabled";
    }
  },
  (_thisPopup) => {
    //
  }
);

list["removeGoogleAuth"] = new SimplePopup(
  "removeGoogleAuth",
  "text",
  "Remove Google Authentication",
  [
    {
      placeholder: "Password",
      type: "password",
      initVal: "",
    },
  ],
  "",
  "Remove",
  async (_thisPopup, password) => {
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
  (thisPopup) => {
    const user = Auth?.currentUser;
    if (!user) return;
    if (!user.providerData.find((p) => p?.providerId === "password")) {
      thisPopup.inputs = [];
      thisPopup.buttonText = "";
      thisPopup.text = "Password authentication is not enabled";
    }
  },
  (_thisPopup) => {
    //
  }
);

list["updateName"] = new SimplePopup(
  "updateName",
  "text",
  "Update Name",
  [
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
  "",
  "Update",
  async (_thisPopup, pass, newName) => {
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
  (thisPopup) => {
    const user = Auth?.currentUser;
    const snapshot = DB.getSnapshot();
    if (!user || !snapshot) return;
    if (!user.providerData.find((p) => p?.providerId === "password")) {
      thisPopup.inputs[0].hidden = true;
      thisPopup.buttonText = "Reauthenticate to update";
    }
    if (snapshot.needsToChangeName === true) {
      thisPopup.text =
        "You need to change your account name. This might be because you have a duplicate name, no account name or your name is not allowed (contains whitespace or invalid characters). Sorry for the inconvenience.";
    }
  },
  (_thisPopup) => {
    //
  }
);

list["updatePassword"] = new SimplePopup(
  "updatePassword",
  "text",
  "Update Password",
  [
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
  "",
  "Update",
  async (_thisPopup, previousPass, newPass, newPassConfirm) => {
    if (newPass !== newPassConfirm) {
      Notifications.add("New passwords don't match", 0);
      return {
        status: 0,
        message: "New passwords don't match",
      };
    }

    if (!isLocalhost() && !isPasswordStrong(newPass)) {
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
  (thisPopup) => {
    const user = Auth?.currentUser;
    if (!user) return;
    if (!user.providerData.find((p) => p?.providerId === "password")) {
      thisPopup.inputs = [];
      thisPopup.buttonText = "";
      thisPopup.text = "Password authentication is not enabled";
    }
  },
  (_thisPopup) => {
    //
  }
);

list["addPasswordAuth"] = new SimplePopup(
  "addPasswordAuth",
  "text",
  "Add Password Authentication",
  [
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
  "",
  "Add",
  async (_thisPopup, email, emailConfirm, pass, passConfirm) => {
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
  () => {
    //
  },
  (_thisPopup) => {
    //
  }
);

list["deleteAccount"] = new SimplePopup(
  "deleteAccount",
  "text",
  "Delete Account",
  [
    {
      placeholder: "Password",
      type: "password",
      initVal: "",
    },
  ],
  "This is the last time you can change your mind. After pressing the button everything is gone.",
  "Delete",
  async (_thisPopup, password) => {
    const reauth = await reauthenticate("passwordFirst", password);
    if (reauth.status !== 1) {
      return {
        status: reauth.status,
        message: reauth.message,
      };
    }

    Notifications.add("Deleting stats...", 0);
    const usersResponse = await Ape.users.delete();

    if (usersResponse.status !== 200) {
      return {
        status: -1,
        message: "Failed to delete user stats: " + usersResponse.message,
      };
    }

    Notifications.add("Deleting results...", 0);
    const resultsResponse = await Ape.results.deleteAll();

    if (resultsResponse.status !== 200) {
      return {
        status: -1,
        message: "Failed to delete results: " + resultsResponse.message,
      };
    }

    Notifications.add("Deleting login information...", 0);
    try {
      await reauth.user.delete();
    } catch (e) {
      const message = createErrorMessage(e, "Failed to delete auth user");
      return {
        status: -1,
        message,
      };
    }

    reloadAfter(3);

    return {
      status: 1,
      message: "Account deleted, goodbye",
    };
  },
  (thisPopup) => {
    const user = Auth?.currentUser;
    if (!user) return;
    if (!user.providerData.find((p) => p?.providerId === "password")) {
      thisPopup.inputs = [];
      thisPopup.buttonText = "Reauthenticate to delete";
    }
  },
  (_thisPopup) => {
    //
  }
);

list["resetAccount"] = new SimplePopup(
  "resetAccount",
  "text",
  "Reset Account",
  [
    {
      placeholder: "Password",
      type: "password",
      initVal: "",
    },
  ],
  "This is the last time you can change your mind. After pressing the button everything is gone.",
  "Reset",
  async (_thisPopup, password) => {
    const reauth = await reauthenticate("passwordFirst", password);
    if (reauth.status !== 1) {
      return {
        status: reauth.status,
        message: reauth.message,
      };
    }

    Notifications.add("Resetting settings...", 0);
    UpdateConfig.reset();

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
  (thisPopup) => {
    const user = Auth?.currentUser;
    if (!user) return;
    if (!user.providerData.find((p) => p?.providerId === "password")) {
      thisPopup.inputs = [];
      thisPopup.buttonText = "Reauthenticate to reset";
    }
  },
  (_thisPopup) => {
    //
  }
);

list["optOutOfLeaderboards"] = new SimplePopup(
  "optOutOfLeaderboards",
  "text",
  "Opt out of leaderboards",
  [
    {
      placeholder: "Password",
      type: "password",
      initVal: "",
    },
  ],
  "Are you sure you want to opt out of leaderboards?",
  "Opt out",
  async (_thisPopup, password) => {
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
  (thisPopup) => {
    const user = Auth?.currentUser;
    if (!user) return;
    if (!user.providerData.find((p) => p?.providerId === "password")) {
      thisPopup.inputs = [];
      thisPopup.buttonText = "Reauthenticate to reset";
    }
  },
  (_thisPopup) => {
    //
  }
);

list["clearTagPb"] = new SimplePopup(
  "clearTagPb",
  "text",
  "Clear Tag PB",
  [],
  `Are you sure you want to clear this tags PB?`,
  "Clear",
  async (thisPopup) => {
    const tagId = thisPopup.parameters[0];
    const response = await Ape.users.deleteTagPersonalBest(tagId);
    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to clear tag PB: " + response.message,
      };
    }

    if (response.data.resultCode === 1) {
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
    } else {
      return {
        status: -1,
        message: "Failed to clear tag PB: " + response.data.message,
      };
    }
  },
  (thisPopup) => {
    thisPopup.text = `Are you sure you want to clear PB for tag ${thisPopup.parameters[1]}?`;
  },
  (_thisPopup) => {
    //
  }
);

list["applyCustomFont"] = new SimplePopup(
  "applyCustomFont",
  "text",
  "Custom font",
  [{ placeholder: "Font name", initVal: "" }],
  "Make sure you have the font installed on your computer before applying",
  "Apply",
  async (_thisPopup, fontName) => {
    Settings.groups["fontFamily"]?.setValue(fontName.replace(/\s/g, "_"));

    return {
      status: 1,
      message: "Font applied",
    };
  },
  () => {
    //
  },
  (_thisPopup) => {
    //
  }
);

list["resetPersonalBests"] = new SimplePopup(
  "resetPersonalBests",
  "text",
  "Reset Personal Bests",
  [
    {
      placeholder: "Password",
      type: "password",
      initVal: "",
    },
  ],
  "",
  "Reset",
  async (_thisPopup, password) => {
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
  (thisPopup) => {
    const user = Auth?.currentUser;
    if (!user) return;
    if (!user.providerData.find((p) => p?.providerId === "password")) {
      thisPopup.inputs = [];
      thisPopup.buttonText = "Reauthenticate to reset";
    }
  },
  (_thisPopup) => {
    //
  }
);

list["resetSettings"] = new SimplePopup(
  "resetSettings",
  "text",
  "Reset Settings",
  [],
  "Are you sure you want to reset all your settings?",
  "Reset",
  async () => {
    UpdateConfig.reset();
    return {
      status: 1,
      message: "Settings reset",
    };
  },
  () => {
    //
  },
  (_thisPopup) => {
    //
  }
);

list["revokeAllTokens"] = new SimplePopup(
  "revokeAllTokens",
  "text",
  "Revoke All Tokens",
  [
    {
      placeholder: "Password",
      type: "password",
      initVal: "",
    },
  ],
  "Are you sure you want to this? This will log you out of all devices.",
  "revoke all",
  async (_thisPopup, password) => {
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
  (thisPopup) => {
    const user = Auth?.currentUser;
    const snapshot = DB.getSnapshot();
    if (!user || !snapshot) return;
    if (!user.providerData.find((p) => p?.providerId === "password")) {
      thisPopup.inputs[0].hidden = true;
      thisPopup.buttonText = "reauthenticate to revoke all tokens";
    }
  },
  (_thisPopup) => {
    //
  }
);

list["unlinkDiscord"] = new SimplePopup(
  "unlinkDiscord",
  "text",
  "Unlink Discord",
  [],
  "Are you sure you want to unlink your Discord account?",
  "Unlink",
  async () => {
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
    AccountButton.update();
    DB.setSnapshot(snap);
    Settings.updateDiscordSection();

    return {
      status: 1,
      message: "Discord unlinked",
    };
  },
  () => {
    //
  },
  (_thisPopup) => {
    //
  }
);

list["generateApeKey"] = new SimplePopup(
  "generateApeKey",
  "text",
  "Generate new key",
  [
    {
      placeholder: "Name",
      initVal: "",
    },
  ],
  "",
  "Generate",
  async (_thisPopup, name) => {
    const response = await Ape.apeKeys.generate(name, false);
    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to generate key: " + response.message,
      };
    }

    const data = response.data;

    return {
      status: 1,
      message: "Key generated",
      afterHide: (): void => {
        list["viewApeKey"].show([data.apeKey]);
      },
    };
  },
  () => {
    //
  },
  (_thisPopup) => {
    //
  }
);

list["viewApeKey"] = new SimplePopup(
  "viewApeKey",
  "text",
  "Ape Key",
  [
    {
      type: "textarea",
      disabled: true,
      placeholder: "Key",
      initVal: "",
    },
  ],
  "This is your new Ape Key. Please keep it safe. You will only see it once!",
  "Close",
  async (_thisPopup) => {
    ApeKeysPopup.show();
    return {
      status: 1,
      message: "Key generated",
    };
  },
  (_thisPopup) => {
    _thisPopup.inputs[0].initVal = _thisPopup.parameters[0];
  },
  (_thisPopup) => {
    _thisPopup.canClose = false;
    $("#simplePopup textarea").css("height", "110px");
    $("#simplePopup .button").addClass("hidden");
    setTimeout(() => {
      _thisPopup.canClose = true;
      $("#simplePopup .button").removeClass("hidden");
    }, 5000);
  }
);

list["deleteApeKey"] = new SimplePopup(
  "deleteApeKey",
  "text",
  "Delete Ape Key",
  [],
  "Are you sure?",
  "Delete",
  async (_thisPopup) => {
    const response = await Ape.apeKeys.delete(_thisPopup.parameters[0]);
    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to delete key: " + response.message,
      };
    }

    ApeKeysPopup.show();

    return {
      status: 1,
      message: "Key deleted",
    };
  },
  (_thisPopup) => {
    //
  },
  (_thisPopup) => {
    //
  }
);

list["editApeKey"] = new SimplePopup(
  "editApeKey",
  "text",
  "Edit Ape Key",
  [
    {
      placeholder: "Name",
      initVal: "",
    },
  ],
  "",
  "Edit",
  async (_thisPopup, input) => {
    const response = await Ape.apeKeys.update(_thisPopup.parameters[0], {
      name: input,
    });
    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to update key: " + response.message,
      };
    }

    ApeKeysPopup.show();

    return {
      status: 1,
      message: "Key updated",
    };
  },
  (_thisPopup) => {
    //
  },
  (_thisPopup) => {
    //
  }
);

list["deleteCustomText"] = new SimplePopup(
  "deleteCustomText",
  "text",
  "Delete custom text",
  [],
  "Are you sure?",
  "Delete",
  async (_thisPopup) => {
    CustomText.deleteCustomText(_thisPopup.parameters[0]);
    CustomTextState.setCustomTextName("", undefined);
    SavedTextsPopup.show(true);

    return {
      status: 1,
      message: "Custom text deleted",
    };
  },
  (_thisPopup) => {
    _thisPopup.text = `Are you sure you want to delete custom text ${_thisPopup.parameters[0]}?`;
  },
  () => {
    //
  }
);

list["deleteCustomTextLong"] = new SimplePopup(
  "deleteCustomTextLong",
  "text",
  "Delete custom text",
  [],
  "Are you sure?",
  "Delete",
  async (_thisPopup) => {
    CustomText.deleteCustomText(_thisPopup.parameters[0], true);
    CustomTextState.setCustomTextName("", undefined);
    SavedTextsPopup.show(true);

    return {
      status: 1,
      message: "Custom text deleted",
    };
  },
  (_thisPopup) => {
    _thisPopup.text = `Are you sure you want to delete custom text ${_thisPopup.parameters[0]}?`;
  },
  () => {
    //
  }
);

list["resetProgressCustomTextLong"] = new SimplePopup(
  "resetProgressCustomTextLong",
  "text",
  "Reset progress for custom text",
  [],
  "Are you sure?",
  "Reset",
  async (_thisPopup) => {
    CustomText.setCustomTextLongProgress(_thisPopup.parameters[0], 0);
    SavedTextsPopup.show(true);
    CustomText.setPopupTextareaState(
      CustomText.getCustomText(_thisPopup.parameters[0], true).join(" ")
    );
    return {
      status: 1,
      message: "Custom text progress reset",
    };
  },
  (_thisPopup) => {
    _thisPopup.text = `Are you sure you want to reset your progress for custom text ${_thisPopup.parameters[0]}?`;
  },
  () => {
    //
  }
);

list["updateCustomTheme"] = new SimplePopup(
  "updateCustomTheme",
  "text",
  "Update Custom Theme",
  [
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
  "",
  "Update",
  async (_thisPopup, name, updateColors) => {
    const snapshot = DB.getSnapshot();
    if (!snapshot) {
      return {
        status: -1,
        message: "Failed to update custom theme: no snapshot",
      };
    }

    const customTheme = snapshot.customThemes.find(
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
    ThemePicker.refreshButtons();

    return {
      status: 1,
      message: "Custom theme updated",
    };
  },
  (_thisPopup) => {
    const snapshot = DB.getSnapshot();
    if (!snapshot) return;

    const customTheme = snapshot.customThemes.find(
      (t) => t._id === _thisPopup.parameters[0]
    );
    if (!customTheme) return;
    _thisPopup.inputs[0].initVal = customTheme.name;
  },
  (_thisPopup) => {
    //
  }
);

list["deleteCustomTheme"] = new SimplePopup(
  "deleteCustomTheme",
  "text",
  "Delete Custom Theme",
  [],
  "Are you sure?",
  "Delete",
  async (_thisPopup) => {
    await DB.deleteCustomTheme(_thisPopup.parameters[0]);
    ThemePicker.refreshButtons();

    return {
      status: 1,
      message: "Custom theme deleted",
    };
  },
  (_thisPopup) => {
    //
  },
  (_thisPopup) => {
    //
  }
);

list["forgotPassword"] = new SimplePopup(
  "forgotPassword",
  "text",
  "Forgot Password",
  [
    {
      type: "text",
      placeholder: "Email",
      initVal: "",
    },
  ],
  "",
  "Send",
  async (_thisPopup, email) => {
    const result = await Ape.users.forgotPasswordEmail(email.trim());
    if (result.status !== 200) {
      return {
        status: -1,
        message: "Failed to send password reset email: " + result.message,
      };
    }

    return {
      status: 1,
      message: "Password reset email sent",
    };
  },
  (thisPopup) => {
    const inputValue = $(
      `.pageLogin .login input[name="current-email"]`
    ).val() as string;
    if (inputValue) {
      thisPopup.inputs[0].initVal = inputValue;
      setTimeout(() => {
        $("#simplePopup").find("input")[0].select();
      }, 1);
    }
  },
  () => {
    //
  }
);

$(".pageLogin #forgotPasswordButton").on("click", () => {
  list["forgotPassword"].show();
});

$(".pageSettings .section.discordIntegration #unlinkDiscordButton").on(
  "click",
  () => {
    if (!ConnectionState.get()) {
      Notifications.add("You are offline", 0, { duration: 2 });
      return;
    }
    list["unlinkDiscord"].show();
  }
);

$(".pageSettings #removeGoogleAuth").on("click", () => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, { duration: 2 });
    return;
  }
  list["removeGoogleAuth"].show();
});

$("#resetSettingsButton").on("click", () => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, { duration: 2 });
    return;
  }
  list["resetSettings"].show();
});

$("#revokeAllTokens").on("click", () => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, { duration: 2 });
    return;
  }
  list["revokeAllTokens"].show();
});

$(".pageSettings #resetPersonalBestsButton").on("click", () => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, { duration: 2 });
    return;
  }
  list["resetPersonalBests"].show();
});

$(".pageSettings #updateAccountName").on("click", () => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, { duration: 2 });
    return;
  }
  list["updateName"].show();
});

$("#bannerCenter").on("click", ".banner .text .openNameChange", () => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, { duration: 2 });
    return;
  }
  list["updateName"].show();
});

$(".pageSettings #addPasswordAuth").on("click", () => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, { duration: 2 });
    return;
  }
  list["addPasswordAuth"].show();
});

$(".pageSettings #emailPasswordAuth").on("click", () => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, { duration: 2 });
    return;
  }
  list["updateEmail"].show();
});

$(".pageSettings #passPasswordAuth").on("click", () => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, { duration: 2 });
    return;
  }
  list["updatePassword"].show();
});

$(".pageSettings #deleteAccount").on("click", () => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, { duration: 2 });
    return;
  }
  list["deleteAccount"].show();
});

$(".pageSettings #resetAccount").on("click", () => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, { duration: 2 });
    return;
  }
  list["resetAccount"].show();
});

$(".pageSettings #optOutOfLeaderboardsButton").on("click", () => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, { duration: 2 });
    return;
  }
  list["optOutOfLeaderboards"].show();
});

$("#popups").on("click", "#apeKeysPopup .generateApeKey", () => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, { duration: 2 });
    return;
  }
  list["generateApeKey"].show();
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
    list["deleteCustomTheme"].show([customThemeId]);
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
    list["updateCustomTheme"].show([customThemeId]);
  }
);

$("#popups").on(
  "click",
  `#savedTextsPopupWrapper .list .savedText .button.delete`,
  (e) => {
    const name = $(e.target).siblings(".button.name").text();
    list["deleteCustomText"].show([name], true);
  }
);

$("#popups").on(
  "click",
  `#savedTextsPopupWrapper .listLong .savedText .button.delete`,
  (e) => {
    const name = $(e.target).siblings(".button.name").text();
    list["deleteCustomTextLong"].show([name], true);
  }
);

$("#popups").on(
  "click",
  `#savedTextsPopupWrapper .listLong .savedText .button.resetProgress`,
  (e) => {
    const name = $(e.target).siblings(".button.name").text();
    list["resetProgressCustomTextLong"].show([name], true);
  }
);

$("#popups").on("click", "#apeKeysPopup table tbody tr .button.delete", (e) => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, { duration: 2 });
    return;
  }
  const keyId = $(e.target).closest("tr").attr("keyId") as string;
  list["deleteApeKey"].show([keyId]);
});

$("#popups").on("click", "#apeKeysPopup table tbody tr .button.edit", (e) => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, { duration: 2 });
    return;
  }
  const keyId = $(e.target).closest("tr").attr("keyId") as string;
  list["editApeKey"].show([keyId]);
});

$(".pageSettings").on("click", ".section.fontFamily .button.custom", () => {
  list["applyCustomFont"].show([]);
});

$(document).on("keydown", (event) => {
  if (event.key === "Escape" && isElementVisible("#simplePopupWrapper")) {
    hide();
    event.preventDefault();
  }
});

Skeleton.save(wrapperId);
