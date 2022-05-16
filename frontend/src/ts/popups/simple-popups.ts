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
import * as CustomTextPopup from "../popups/custom-text-popup";
import * as SavedTextsPopup from "./saved-texts-popup";
import { FirebaseError } from "firebase/app";
import { Auth } from "../firebase";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  updatePassword,
} from "firebase/auth";

type Input = {
  placeholder?: string;
  type?: string;
  initVal: string;
  hidden?: boolean;
  disabled?: boolean;
  label?: string;
};

let activePopup: SimplePopup | null = null;

export const list: { [key: string]: SimplePopup } = {};
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
  execFn: (thisPopup: SimplePopup, ...params: string[]) => void | Promise<void>;
  beforeInitFn: (thisPopup: SimplePopup) => void;
  beforeShowFn: (thisPopup: SimplePopup) => void;
  canClose: boolean;
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
    ) => void | Promise<void>,
    beforeInitFn: (thisPopup: SimplePopup) => void,
    beforeShowFn: (thisPopup: SimplePopup) => void
  ) {
    this.parameters = [];
    this.id = id;
    this.type = type;
    this.execFn = (thisPopup, ...vals): Promise<void> | void =>
      execFn(thisPopup, ...vals);
    this.title = title;
    this.inputs = inputs;
    this.text = text;
    this.wrapper = $("#simplePopupWrapper");
    this.element = $("#simplePopup");
    this.buttonText = buttonText;
    this.beforeInitFn = (thisPopup): void => beforeInitFn(thisPopup);
    this.beforeShowFn = (thisPopup): void => beforeShowFn(thisPopup);
    this.canClose = true;
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
    this.execFn(this, ...vals);
    this.hide();
  }

  show(parameters: string[] = []): void {
    activePopup = this;
    this.parameters = parameters;
    this.beforeInitFn(this);
    this.init();
    this.beforeShowFn(this);
    this.wrapper
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125, () => {
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
      .animate({ opacity: 0 }, 125, () => {
        this.wrapper.addClass("hidden");
      });
  }
}

export function hide(): void {
  if (activePopup) return activePopup.hide();
  $("#simplePopupWrapper")
    .stop(true, true)
    .css("opacity", 1)
    .removeClass("hidden")
    .animate({ opacity: 0 }, 125, () => {
      $("#simplePopupWrapper").addClass("hidden");
    });
}

$("#simplePopupWrapper").mousedown((e) => {
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

$(document).on("click", "#simplePopupWrapper .button", () => {
  const id = $("#simplePopup").attr("popupId") ?? "";
  list[id].exec();
});

$(document).on("keyup", "#simplePopupWrapper input", (e) => {
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
      const user = Auth.currentUser;
      if (user === null) return;
      if (email !== emailConfirm) {
        Notifications.add("Emails don't match", 0);
        return;
      }
      if (user.providerData[0].providerId === "password") {
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
        return Notifications.add(
          "Failed to update email: " + response.message,
          -1
        );
      }

      Notifications.add("Email updated", 1);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (e) {
      const typedError = e as FirebaseError;
      if (typedError.code === "auth/wrong-password") {
        Notifications.add("Incorrect password", -1);
      } else {
        Notifications.add("Something went wrong: " + e, -1);
      }
    }
  },
  (thisPopup) => {
    const user = Auth.currentUser;
    if (user === null) return;
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
      const user = Auth.currentUser;
      if (user === null) return;
      if (user.providerData[0].providerId === "password") {
        const credential = EmailAuthProvider.credential(
          user.email as string,
          pass
        );
        await reauthenticateWithCredential(user, credential);
      } else if (user.providerData[0].providerId === "google.com") {
        await reauthenticateWithPopup(user, AccountController.gmailProvider);
      }
      Loader.show();

      const checkNameResponse = await Ape.users.getNameAvailability(newName);
      if (checkNameResponse.status !== 200) {
        Loader.hide();
        return Notifications.add(
          "Failed to check name: " + checkNameResponse.message,
          -1
        );
      }

      const updateNameResponse = await Ape.users.updateName(newName);
      if (updateNameResponse.status !== 200) {
        Loader.hide();
        return Notifications.add(
          "Failed to update name: " + updateNameResponse.message,
          -1
        );
      }

      Notifications.add("Name updated", 1);
      DB.getSnapshot().name = newName;
      $("#menu .text-button.account .text").text(newName);
      if (DB.getSnapshot().needsToChangeName) {
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
    }
    Loader.hide();
  },
  (thisPopup) => {
    const user = Auth.currentUser;
    if (user === null) return;
    if (user.providerData[0].providerId === "google.com") {
      thisPopup.inputs[0].hidden = true;
      thisPopup.buttonText = "Reauthenticate to update";
    }
    const snapshot = DB.getSnapshot();
    if (snapshot.needsToChangeName === true) {
      thisPopup.text =
        "We've recently identified several issues that allowed users to register with names that were already taken. Accounts which signed up earliest get to keep the duplicated name, and others are forced to change. Unique names are essential for smooth operation of upcoming features like public profiles, multiplayer, and more. Sorry for the inconvenience.";
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
      const user = Auth.currentUser;
      if (user === null) return;
      const credential = EmailAuthProvider.credential(
        user.email as string,
        previousPass
      );
      if (newPass !== newPassConfirm) {
        Notifications.add("New passwords don't match", 0);
        return;
      }
      Loader.show();
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPass);
      Loader.hide();
      Notifications.add("Password updated", 1);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (e) {
      const typedError = e as FirebaseError;
      Loader.hide();
      if (typedError.code === "auth/wrong-password") {
        Notifications.add("Incorrect password", -1);
      } else {
        Notifications.add("Something went wrong: " + e, -1);
      }
    }
  },
  (thisPopup) => {
    const user = Auth.currentUser;
    if (user === null) return;
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
      return;
    }

    if (pass !== passConfirm) {
      Notifications.add("Passwords don't match", 0);
      return;
    }

    await AccountController.addPasswordAuth(email, pass);
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
    //
    try {
      const user = Auth.currentUser;
      if (user === null) return;
      if (user.providerData[0].providerId === "password") {
        const credential = EmailAuthProvider.credential(
          user.email as string,
          password
        );
        await reauthenticateWithCredential(user, credential);
      } else if (user.providerData[0].providerId === "google.com") {
        await reauthenticateWithPopup(user, AccountController.gmailProvider);
      }
      Loader.show();
      Notifications.add("Deleting stats...", 0);
      const usersResponse = await Ape.users.delete();
      Loader.hide();

      if (usersResponse.status !== 200) {
        return Notifications.add(
          "Failed to delete user stats: " + usersResponse.message,
          -1
        );
      }

      Loader.show();
      Notifications.add("Deleting results...", 0);
      const resultsResponse = await Ape.results.deleteAll();
      Loader.hide();

      if (resultsResponse.status !== 200) {
        return Notifications.add(
          "Failed to delete user results: " + resultsResponse.message,
          -1
        );
      }

      Notifications.add("Deleting login information...", 0);
      await Auth.currentUser?.delete();

      Notifications.add("Goodbye", 1, 5);

      setTimeout(() => {
        location.reload();
      }, 3000);
    } catch (e) {
      const typedError = e as FirebaseError;
      Loader.hide();
      if (typedError.code === "auth/wrong-password") {
        Notifications.add("Incorrect password", -1);
      } else {
        Notifications.add("Something went wrong: " + e, -1);
      }
    }
  },
  (thisPopup) => {
    const user = Auth.currentUser;
    if (user === null) return;
    if (user.providerData[0].providerId === "google.com") {
      thisPopup.inputs = [];
      thisPopup.buttonText = "Reauthenticate to delete";
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
      return Notifications.add(
        "Failed to delete tag's PB: " + response.message
      );
    }

    if (response.data.resultCode === 1) {
      const tag = DB.getSnapshot().tags?.filter((t) => t._id === tagId)[0];

      if (tag === undefined) return;
      tag.personalBests = {
        time: {},
        words: {},
        zen: { zen: [] },
        quote: { custom: [] },
        custom: { custom: [] },
      };
      $(
        `.pageSettings .section.tags .tagsList .tag[id="${tagId}"] .clearPbButton`
      ).attr("aria-label", "No PB found");
      Notifications.add("Tag PB cleared.", 0);
    } else {
      Notifications.add("Something went wrong: " + response.message, -1);
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
  "Make sure you have the font installed on your computer before applying.",
  "Apply",
  (_thisPopup, fontName: string) => {
    if (fontName === "") return;
    Settings.groups["fontFamily"]?.setValue(fontName.replace(/\s/g, "_"));
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
      const user = Auth.currentUser;
      if (user === null) return;
      if (user.providerData[0].providerId === "password") {
        const credential = EmailAuthProvider.credential(
          user.email as string,
          password
        );
        await reauthenticateWithCredential(user, credential);
      } else if (user.providerData[0].providerId === "google.com") {
        await reauthenticateWithPopup(user, AccountController.gmailProvider);
      }
      Loader.show();
      const response = await Ape.users.deletePersonalBests();
      Loader.hide();

      if (response.status !== 200) {
        return Notifications.add(
          "Failed to reset personal bests: " + response.message,
          -1
        );
      }

      Notifications.add("Personal bests have been reset", 1);
      DB.getSnapshot().personalBests = {
        time: {},
        words: {},
        zen: { zen: [] },
        quote: { custom: [] },
        custom: { custom: [] },
      };
    } catch (e) {
      Loader.hide();
      Notifications.add(e as string, -1);
    }
  },
  (thisPopup) => {
    const user = Auth.currentUser;
    if (user === null) return;
    if (user.providerData[0].providerId === "google.com") {
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
  () => {
    UpdateConfig.reset();
    // setTimeout(() => {
    //   location.reload();
    // }, 1000);
  },
  () => {
    //
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
    Loader.show();
    const response = await Ape.users.unlinkDiscord();
    Loader.hide();

    if (response.status !== 200) {
      return Notifications.add(
        "Failed to unlink Discord: " + response.message,
        -1
      );
    }

    Notifications.add("Accounts unlinked", 1);
    DB.getSnapshot().discordId = undefined;
    Settings.updateDiscordSection();
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
      return Notifications.add(
        "Failed to generate key: " + response.message,
        -1
      );
    } else {
      const data = response.data;
      list["viewApeKey"].show([data.apeKey]);
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
  (_thisPopup) => {
    ApeKeysPopup.show();
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
      return Notifications.add("Failed to delete key: " + response.message, -1);
    }

    Notifications.add("Key deleted", 1);
    ApeKeysPopup.show();
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
      return Notifications.add("Failed to update key: " + response.message, -1);
    }

    Notifications.add("Key updated", 1);
    ApeKeysPopup.show();
  },
  (_thisPopup) => {
    //
  },
  (_thisPopup) => {
    //
  }
);

list["saveCustomText"] = new SimplePopup(
  "saveCustomText",
  "text",
  "Save custom text",
  [
    {
      placeholder: "Name",
      initVal: "",
    },
  ],
  "",
  "Save",
  (_thisPopup, input) => {
    const text = ($(`#customTextPopup textarea`).val() as string).normalize();
    CustomText.setCustomText(input, text);
    Notifications.add("Custom text saved", 1);
    CustomTextPopup.show();
  },
  () => {
    //
  },
  () => {
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
  (_thisPopup) => {
    CustomText.deleteCustomText(_thisPopup.parameters[0]);
    Notifications.add("Custom text deleted", 1);
    SavedTextsPopup.show();
  },
  (_thisPopup) => {
    _thisPopup.text = `Are you sure you want to delete custom text ${_thisPopup.parameters[0]}?`;
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

    const customTheme = snapshot.customThemes.find(
      (t) => t._id === _thisPopup.parameters[0]
    );
    if (customTheme === undefined) {
      Notifications.add("Custom theme does not exist!", -1);
      return;
    }

    let newColors: string[] = [];
    if (updateColors === "true") {
      $.each(
        $(".pageSettings .customTheme .customThemeEdit [type='color']"),
        (_index, element) => {
          newColors.push($(element).attr("value") as string);
        }
      );
    } else {
      newColors = customTheme.colors;
    }

    const newTheme = {
      name: name,
      colors: newColors,
    };
    Loader.show();
    await DB.editCustomTheme(customTheme._id, newTheme);
    Loader.hide();
    UpdateConfig.setCustomThemeColors(newColors);
    Notifications.add("Custom theme updated", 1);
    ThemePicker.refreshButtons();
  },
  (_thisPopup) => {
    const snapshot = DB.getSnapshot();

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
  },
  (_thisPopup) => {
    //
  },
  (_thisPopup) => {
    //
  }
);

$(".pageSettings .section.discordIntegration #unlinkDiscordButton").on(
  "click",
  () => {
    list["unlinkDiscord"].show();
  }
);

$("#resetSettingsButton").on("click", () => {
  list["resetSettings"].show();
});

$(".pageSettings #resetPersonalBestsButton").on("click", () => {
  list["resetPersonalBests"].show();
});

$(".pageSettings #updateAccountName").on("click", () => {
  list["updateName"].show();
});

$(document).on("click", "#bannerCenter .banner .text .openNameChange", () => {
  list["updateName"].show();
});

$(".pageSettings #addPasswordAuth").on("click", () => {
  list["addPasswordAuth"].show();
});

$(".pageSettings #emailPasswordAuth").on("click", () => {
  list["updateEmail"].show();
});

$(".pageSettings #passPasswordAuth").on("click", () => {
  list["updatePassword"].show();
});

$(".pageSettings #deleteAccount").on("click", () => {
  list["deleteAccount"].show();
});

$("#apeKeysPopup .generateApeKey").on("click", () => {
  list["generateApeKey"].show();
});

$(`#customTextPopup .buttonsTop .saveCustomText`).on("click", () => {
  list["saveCustomText"].show();
});

$(document).on(
  "click",
  ".pageSettings .section.themes .customTheme .delButton",
  (e) => {
    const $parentElement = $(e.currentTarget).parent(".customTheme.button");
    const customThemeId = $parentElement.attr("customThemeId") as string;
    list["deleteCustomTheme"].show([customThemeId]);
  }
);

$(document).on(
  "click",
  ".pageSettings .section.themes .customTheme .editButton",
  (e) => {
    const $parentElement = $(e.currentTarget).parent(".customTheme.button");
    const customThemeId = $parentElement.attr("customThemeId") as string;
    list["updateCustomTheme"].show([customThemeId]);
  }
);

$(document).on(
  "click",
  `#savedTextsPopupWrapper .list .savedText .button.delete`,
  (e) => {
    const name = $(e.target).siblings(".button.name").text();
    list["deleteCustomText"].show([name]);
  }
);

$(document).on("click", "#apeKeysPopup table tbody tr .button.delete", (e) => {
  const keyId = $(e.target).closest("tr").attr("keyId") as string;
  list["deleteApeKey"].show([keyId]);
});

$(document).on("click", "#apeKeysPopup table tbody tr .button.edit", (e) => {
  const keyId = $(e.target).closest("tr").attr("keyId") as string;
  list["editApeKey"].show([keyId]);
});

$(document).on(
  "click",
  ".pageSettings .section.fontFamily .button.custom",
  () => {
    list["applyCustomFont"].show([]);
  }
);

$(document).on("keydown", (event) => {
  if (event.key === "Escape" && !$("#simplePopupWrapper").hasClass("hidden")) {
    hide();
    event.preventDefault();
  }
});
