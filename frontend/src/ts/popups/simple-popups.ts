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
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  unlink,
  updatePassword,
} from "firebase/auth";
import { isElementVisible, isLocalhost, isPasswordStrong } from "../utils/misc";
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
  execFn: (thisPopup: SimplePopup, ...params: string[]) => Promise<boolean>;
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
    execFn: (thisPopup: SimplePopup, ...params: string[]) => Promise<boolean>,
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
    this.disableInputs();
    this.execFn(this, ...vals).then((res) => {
      if (res) {
        this.hide();
      }
      this.enableInputs();
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

  hide(): void {
    if (!this.canClose) return;
    activePopup = null;
    this.wrapper
      .stop(true, true)
      .css("opacity", 1)
      .removeClass("hidden")
      .animate({ opacity: 0 }, this.noAnimation ? 0 : 125, () => {
        this.wrapper.addClass("hidden");
        Skeleton.remove(wrapperId);
      });
  }
}

function hide(): void {
  if (activePopup) return activePopup.hide();
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
    try {
      const user = Auth?.currentUser;
      if (!Auth) return true;
      if (!user) return true;
      if (email !== emailConfirm) {
        Notifications.add("Emails don't match", 0);
        return false;
      }
      if (user.providerData.find((p) => p?.providerId === "password")) {
        const credential = EmailAuthProvider.credential(
          user.email as string,
          password
        );
        await reauthenticateWithCredential(user, credential);
      }

      Loader.show();
      const response = await Ape.users.updateEmail(email, user.email as string);
      Loader.hide();

      if (response.status !== 200) {
        Notifications.add("Failed to update email: " + response.message, -1);
        return false;
      }

      Notifications.add("Email updated", 1);
      AccountController.signOut();
    } catch (e) {
      const typedError = e as FirebaseError;
      if (typedError.code === "auth/wrong-password") {
        Notifications.add("Incorrect password", -1);
      } else {
        Notifications.add("Something went wrong: " + e, -1);
      }
      return false;
    }
    return true;
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
    try {
      const user = Auth?.currentUser;
      if (!user) return true;
      if (user.providerData.find((p) => p?.providerId === "password")) {
        const credential = EmailAuthProvider.credential(
          user.email as string,
          password
        );
        await reauthenticateWithCredential(user, credential);
      }
      Loader.show();
      unlink(user, "google.com")
        .then(() => {
          Loader.hide();
          Notifications.add("Google authentication removed", 1);
          Settings.updateAuthSections();
          return true;
        })
        .catch((error) => {
          Loader.hide();
          Notifications.add("Something went wrong: " + error.message, -1);
          return false;
        });
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (e) {
      const typedError = e as FirebaseError;
      if (typedError.code === "auth/wrong-password") {
        Notifications.add("Incorrect password", -1);
      } else {
        Notifications.add("Something went wrong: " + e, -1);
      }
      return false;
    }
    return true;
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
    try {
      const user = Auth?.currentUser;
      const snapshot = DB.getSnapshot();
      if (!user || !snapshot) return true;

      if (!pass || !newName) {
        Notifications.add("Please fill in all fields", 0);
        return false;
      }
      Loader.show();

      if (user.providerData.find((p) => p?.providerId === "password")) {
        const credential = EmailAuthProvider.credential(
          user.email as string,
          pass
        );
        await reauthenticateWithCredential(user, credential);
      } else {
        await reauthenticateWithPopup(user, AccountController.gmailProvider);
      }

      const checkNameResponse = await Ape.users.getNameAvailability(newName);
      if (checkNameResponse.status !== 200) {
        Loader.hide();
        Notifications.add(
          "Failed to check name: " + checkNameResponse.message,
          -1
        );
        return false;
      }

      const updateNameResponse = await Ape.users.updateName(newName);
      if (updateNameResponse.status !== 200) {
        Loader.hide();
        Notifications.add(
          "Failed to update name: " + updateNameResponse.message,
          -1
        );
        return false;
      }

      Notifications.add("Name updated", 1);
      snapshot.name = newName;
      $("#menu .textButton.account .text").text(newName);
      if (snapshot.needsToChangeName) {
        setTimeout(() => {
          location.reload();
        }, 1000);
      }
    } catch (e) {
      const typedError = e as FirebaseError;
      if (typedError.code === "auth/wrong-password") {
        Notifications.add("Incorrect password", -1);
      } else {
        Notifications.add("Something went wrong: " + e, -1);
      }
      Loader.hide();
      return false;
    }
    Loader.hide();
    return true;
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
    try {
      const user = Auth?.currentUser;
      if (!user) return true;
      const credential = EmailAuthProvider.credential(
        user.email as string,
        previousPass
      );
      if (newPass !== newPassConfirm) {
        Notifications.add("New passwords don't match", 0);
        return false;
      }
      if (!isLocalhost() && !isPasswordStrong(newPass)) {
        Notifications.add(
          "New password must contain at least one capital letter, number, a special character and must be between 8 and 64 characters long",
          0,
          {
            duration: 4,
          }
        );
        return false;
      }
      Loader.show();
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPass);
      Loader.hide();
      Notifications.add("Password updated", 1);
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      return true;
    } catch (e) {
      const typedError = e as FirebaseError;
      Loader.hide();
      if (typedError.code === "auth/wrong-password") {
        Notifications.add("Incorrect password", -1);
      } else {
        Notifications.add("Something went wrong: " + e, -1);
      }
      return false;
    }
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
      Notifications.add("Emails don't match", 0);
      return false;
    }

    if (pass !== passConfirm) {
      Notifications.add("Passwords don't match", 0);
      return false;
    }

    await AccountController.addPasswordAuth(email, pass);
    return true;
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
  async (_thisPopup, password: string) => {
    try {
      const user = Auth?.currentUser;
      if (!user) return true;
      if (user.providerData.find((p) => p?.providerId === "password")) {
        const credential = EmailAuthProvider.credential(
          user.email as string,
          password
        );
        await reauthenticateWithCredential(user, credential);
      } else {
        await reauthenticateWithPopup(user, AccountController.gmailProvider);
      }
      Loader.show();
      Notifications.add("Deleting stats...", 0);
      const usersResponse = await Ape.users.delete();
      Loader.hide();

      if (usersResponse.status !== 200) {
        Notifications.add(
          "Failed to delete user stats: " + usersResponse.message,
          -1
        );
        return false;
      }

      Loader.show();
      Notifications.add("Deleting results...", 0);
      const resultsResponse = await Ape.results.deleteAll();
      Loader.hide();

      if (resultsResponse.status !== 200) {
        Notifications.add(
          "Failed to delete user results: " + resultsResponse.message,
          -1
        );
        return false;
      }

      Notifications.add("Deleting login information...", 0);
      await Auth?.currentUser?.delete();

      Notifications.add("Goodbye", 1, {
        duration: 5,
      });

      setTimeout(() => {
        location.reload();
      }, 3000);
      return true;
    } catch (e) {
      const typedError = e as FirebaseError;
      Loader.hide();
      if (typedError.code === "auth/wrong-password") {
        Notifications.add("Incorrect password", -1);
      } else {
        Notifications.add("Something went wrong: " + e, -1);
      }
      return false;
    }
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
  async (_thisPopup, password: string) => {
    try {
      const user = Auth?.currentUser;
      if (!user) return true;
      if (user.providerData.find((p) => p?.providerId === "password")) {
        const credential = EmailAuthProvider.credential(
          user.email as string,
          password
        );
        await reauthenticateWithCredential(user, credential);
      } else {
        await reauthenticateWithPopup(user, AccountController.gmailProvider);
      }
      Notifications.add("Resetting settings...", 0);
      UpdateConfig.reset();
      Loader.show();
      Notifications.add("Resetting account...", 0);
      const response = await Ape.users.reset();

      if (response.status !== 200) {
        Loader.hide();
        Notifications.add(
          "There was an error resetting your account. Please try again.",
          -1
        );
        return false;
      }
      Loader.hide();
      Notifications.add("Reset complete", 1);
      setTimeout(() => {
        location.reload();
      }, 3000);
      return true;
    } catch (e) {
      const typedError = e as FirebaseError;
      Loader.hide();
      if (typedError.code === "auth/wrong-password") {
        Notifications.add("Incorrect password", -1);
      } else {
        Notifications.add("Something went wrong: " + e, -1);
      }
      return false;
    }
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
  async (_thisPopup, password: string) => {
    try {
      const user = Auth?.currentUser;
      if (!user) return true;
      if (user.providerData.find((p) => p?.providerId === "password")) {
        const credential = EmailAuthProvider.credential(
          user.email as string,
          password
        );
        await reauthenticateWithCredential(user, credential);
      } else {
        await reauthenticateWithPopup(user, AccountController.gmailProvider);
      }

      Loader.show();
      const response = await Ape.users.optOutOfLeaderboards();

      if (response.status !== 200) {
        Loader.hide();
        Notifications.add(
          `Failed to opt out of leaderboards: ${response.message}`,
          -1
        );
        return false;
      }
      Loader.hide();
      Notifications.add("Leaderboard opt out successful", 1);
      setTimeout(() => {
        location.reload();
      }, 3000);
      return true;
    } catch (e) {
      const typedError = e as FirebaseError;
      Loader.hide();
      if (typedError.code === "auth/wrong-password") {
        Notifications.add("Incorrect password", -1);
      } else {
        Notifications.add("Something went wrong: " + e, -1);
      }
      return false;
    }
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
    Loader.show();
    const response = await Ape.users.deleteTagPersonalBest(tagId);
    Loader.hide();

    if (response.status !== 200) {
      Notifications.add("Failed to delete tag's PB: " + response.message);
      return false;
    }

    if (response.data.resultCode === 1) {
      const tag = DB.getSnapshot()?.tags?.filter((t) => t._id === tagId)[0];

      if (tag === undefined) {
        Notifications.add("Something went wrong: tag not found", -1);
        return false;
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
      Notifications.add("Tag PB cleared.", 0);
      return true;
    } else {
      Notifications.add("Something went wrong: " + response.message, -1);
      return false;
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
  async (_thisPopup, fontName: string) => {
    if (fontName === "") {
      Notifications.add("Please enter a font name", 0);
      return false;
    }
    Settings.groups["fontFamily"]?.setValue(fontName.replace(/\s/g, "_"));
    return true;
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
  async (_thisPopup, password: string) => {
    try {
      const user = Auth?.currentUser;
      const snapshot = DB.getSnapshot();
      if (!user || !snapshot) return true;
      if (user.providerData.find((p) => p?.providerId === "password")) {
        const credential = EmailAuthProvider.credential(
          user.email as string,
          password
        );
        await reauthenticateWithCredential(user, credential);
      } else {
        await reauthenticateWithPopup(user, AccountController.gmailProvider);
      }
      Loader.show();
      const response = await Ape.users.deletePersonalBests();
      Loader.hide();

      if (response.status !== 200) {
        Notifications.add(
          "Failed to reset personal bests: " + response.message,
          -1
        );
        return false;
      }

      Notifications.add("Personal bests have been reset", 1);
      snapshot.personalBests = {
        time: {},
        words: {},
        quote: {},
        zen: {},
        custom: {},
      };
      return true;
    } catch (e) {
      Loader.hide();
      Notifications.add(e as string, -1);
      return false;
    }
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
    return true;
    // setTimeout(() => {
    //   location.reload();
    // }, 3000);
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
    try {
      const user = Auth?.currentUser;
      const snapshot = DB.getSnapshot();
      if (!user || !snapshot) return true;

      if (user.providerData.find((p) => p?.providerId === "password")) {
        const credential = EmailAuthProvider.credential(
          user.email as string,
          password
        );
        await reauthenticateWithCredential(user, credential);
      } else {
        await reauthenticateWithPopup(user, AccountController.gmailProvider);
      }
      Loader.show();
      const response = await Ape.users.revokeAllTokens();
      Loader.hide();

      if (response.status !== 200) {
        Notifications.add(
          "Failed to revoke all tokens: " + response.message,
          -1
        );
        return false;
      }

      Notifications.add("All tokens revoked", 1);
      setTimeout(() => {
        location.reload();
      }, 1000);
      return true;
    } catch (e) {
      Loader.hide();
      const typedError = e as FirebaseError;
      if (typedError.code === "auth/wrong-password") {
        Notifications.add("Incorrect password", -1);
      } else {
        Notifications.add("Something went wrong: " + e, -1);
      }
      return false;
    }
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
    if (!snap) return true;
    Loader.show();
    const response = await Ape.users.unlinkDiscord();
    Loader.hide();

    if (response.status !== 200) {
      Notifications.add("Failed to unlink Discord: " + response.message, -1);
      return false;
    }

    Notifications.add("Accounts unlinked", 1);
    snap.discordAvatar = undefined;
    snap.discordId = undefined;
    AccountButton.update();
    DB.setSnapshot(snap);
    Settings.updateDiscordSection();
    return true;
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
    Loader.show();
    const response = await Ape.apeKeys.generate(name, false);
    Loader.hide();

    if (response.status !== 200) {
      Notifications.add("Failed to generate key: " + response.message, -1);
      return false;
    } else {
      const data = response.data;
      list["viewApeKey"].show([data.apeKey]);
      return true;
    }
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
    return true;
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
    }, 3000);
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
    Loader.show();
    const response = await Ape.apeKeys.delete(_thisPopup.parameters[0]);
    Loader.hide();

    if (response.status !== 200) {
      Notifications.add("Failed to delete key: " + response.message, -1);
      return false;
    }

    Notifications.add("Key deleted", 1);
    ApeKeysPopup.show();
    return true;
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
    Loader.show();
    const response = await Ape.apeKeys.update(_thisPopup.parameters[0], {
      name: input,
    });
    Loader.hide();

    if (response.status !== 200) {
      Notifications.add("Failed to update key: " + response.message, -1);
      return false;
    }

    Notifications.add("Key updated", 1);
    ApeKeysPopup.show();
    return true;
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
    Notifications.add("Custom text deleted", 1);
    CustomTextState.setCustomTextName("", undefined);
    SavedTextsPopup.show(true);
    return true;
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
    Notifications.add("Custom text deleted", 1);
    CustomTextState.setCustomTextName("", undefined);
    SavedTextsPopup.show(true);
    return true;
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
    Notifications.add("Custom text progress reset", 1);
    SavedTextsPopup.show(true);
    CustomText.setPopupTextareaState(
      CustomText.getCustomText(_thisPopup.parameters[0], true).join(" ")
    );
    return true;
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
    if (!snapshot) return true;

    const customTheme = snapshot.customThemes.find(
      (t) => t._id === _thisPopup.parameters[0]
    );
    if (customTheme === undefined) {
      Notifications.add("Custom theme does not exist", -1);
      return false;
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
    Loader.show();
    const validation = await DB.editCustomTheme(customTheme._id, newTheme);
    Loader.hide();
    if (!validation) return true;
    UpdateConfig.setCustomThemeColors(newColors);
    Notifications.add("Custom theme updated", 1);
    ThemePicker.refreshButtons();
    return true;
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
    Loader.show();
    await DB.deleteCustomTheme(_thisPopup.parameters[0]);
    Loader.hide();
    Notifications.add("Custom theme deleted", 1);
    ThemePicker.refreshButtons();
    return true;
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
    Loader.show();
    const result = await Ape.users.forgotPasswordEmail(email.trim());
    if (result.status !== 200) {
      Loader.hide();
      Notifications.add(
        "Failed to request password reset email: " + result.message,
        5000
      );
      return false;
    } else {
      Loader.hide();
      Notifications.add("Password reset email sent", 1);
      return true;
    }
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
