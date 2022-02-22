import * as AccountController from "../controllers/account-controller";
import * as DB from "../db";
import * as UpdateConfig from "../config";
import * as Loader from "../elements/loader";
import * as Notifications from "../elements/notifications";
import axiosInstance from "../axios-instance";
import * as Settings from "../pages/settings";
import { AxiosError } from "axios";

type Input = {
  placeholder: string;
  type?: string;
  initVal: string;
  hidden?: boolean;
};

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
  execFn: any;
  beforeShowFn: (thisPopup: SimplePopup) => void;
  constructor(
    id: string,
    type: string,
    title: string,
    inputs: Input[] = [],
    text = "",
    buttonText = "Confirm",
    execFn: any,
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
    this.beforeShowFn = (): void => beforeShowFn(this);
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
              val="${input.initVal}"
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
            el.find(".inputs").append(`
              <input
                type="${input.type}"
                val="${input.initVal}"
                placeholder="${input.placeholder}"
                class="${input.hidden ? "hidden" : ""}"
                ${input.hidden ? "" : "required"}
                autocomplete="off"
              >
            `);
          } else {
            el.find(".inputs").append(`
              <input
                type="text"
                val="${input.initVal}"
                placeholder="${input.placeholder}"
                class="${input.hidden ? "hidden" : ""}"
                ${input.hidden ? "" : "required"}
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
    const vals: string[] = [];
    $.each($("#simplePopup input"), (_, el) => {
      vals.push($(el).val() as string);
    });
    // @ts-ignore todo remove
    this.execFn(...vals);
    this.hide();
  }

  show(parameters: string[] = []): void {
    this.parameters = parameters;
    this.beforeShowFn(this);
    this.init();
    this.wrapper
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125, () => {
        $($("#simplePopup").find("input")[0]).focus();
      });
  }

  hide(): void {
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
  async (password: string, email: string, emailConfirm: string) => {
    try {
      const user = firebase.auth().currentUser;
      if (email !== emailConfirm) {
        Notifications.add("Emails don't match", 0);
        return;
      }
      if (user.providerData[0].providerId === "password") {
        const credential = firebase.auth.EmailAuthProvider.credential(
          user.email,
          password
        );
        await user.reauthenticateWithCredential(credential);
      }
      Loader.show();
      let response;
      try {
        response = await axiosInstance.patch("/user/email", {
          uid: user.uid,
          previousEmail: user.email,
          newEmail: email,
        });
      } catch (error) {
        const e = error as AxiosError;
        Loader.hide();
        const msg = e?.response?.data?.message ?? e.message;
        Notifications.add("Failed to update email: " + msg, -1);
        return;
      }
      Loader.hide();
      if (response.status !== 200) {
        Notifications.add(response.data.message);
        return;
      } else {
        Notifications.add("Email updated", 1);
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (e) {
      // @ts-ignore todo help
      if (e.code == "auth/wrong-password") {
        Notifications.add("Incorrect password", -1);
      } else {
        Notifications.add("Something went wrong: " + e, -1);
      }
    }
  },
  (thisPopup) => {
    const user = firebase.auth().currentUser;
    // @ts-ignore todo remove ignore once firebase is initialised with code
    if (!user.providerData.find((p) => p.providerId === "password")) {
      thisPopup.inputs = [];
      thisPopup.buttonText = "";
      thisPopup.text = "Password authentication is not enabled";
    }
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
  async (pass: string, newName: string) => {
    try {
      const user = firebase.auth().currentUser;
      if (user.providerData[0].providerId === "password") {
        const credential = firebase.auth.EmailAuthProvider.credential(
          user.email,
          pass
        );
        await user.reauthenticateWithCredential(credential);
      } else if (user.providerData[0].providerId === "google.com") {
        await user.reauthenticateWithPopup(AccountController.gmailProvider);
      }
      Loader.show();

      let response;
      try {
        response = await axiosInstance.get(`/user/checkName/${newName}`);
      } catch (error) {
        const e = error as AxiosError;
        Loader.hide();
        const msg = e?.response?.data?.message ?? e.message;
        Notifications.add("Failed to check name: " + msg, -1);
        return;
      }
      Loader.hide();
      if (response.status !== 200) {
        Notifications.add(response.data.message);
        return;
      }
      try {
        response = await axiosInstance.patch("/user/name", {
          name: newName,
        });
      } catch (error) {
        const e = error as AxiosError;
        Loader.hide();
        const msg = e?.response?.data?.message ?? e.message;
        Notifications.add("Failed to update name: " + msg, -1);
        return;
      }
      Loader.hide();
      if (response.status !== 200) {
        Notifications.add(response.data.message);
        return;
      } else {
        Notifications.add("Name updated", 1);
        DB.getSnapshot().name = newName;
        $("#menu .icon-button.account .text").text(newName);
      }
    } catch (e) {
      Loader.hide();
      // @ts-ignore todo remove ignore
      if (e.code == "auth/wrong-password") {
        Notifications.add("Incorrect password", -1);
      } else {
        Notifications.add("Something went wrong: " + e, -1);
      }
    }
  },
  (thisPopup) => {
    const user = firebase.auth().currentUser;
    if (user.providerData[0].providerId === "google.com") {
      thisPopup.inputs[0].hidden = true;
      thisPopup.buttonText = "Reauthenticate to update";
    }
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
  async (previousPass: string, newPass: string, newPassConfirm: string) => {
    try {
      const user = firebase.auth().currentUser;
      const credential = firebase.auth.EmailAuthProvider.credential(
        user.email,
        previousPass
      );
      if (newPass !== newPassConfirm) {
        Notifications.add("New passwords don't match", 0);
        return;
      }
      Loader.show();
      await user.reauthenticateWithCredential(credential);
      await user.updatePassword(newPass);
      Loader.hide();
      Notifications.add("Password updated", 1);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (e) {
      Loader.hide();
      // @ts-ignore todo remove ignore
      if (e.code == "auth/wrong-password") {
        Notifications.add("Incorrect password", -1);
      } else {
        Notifications.add("Something went wrong: " + e, -1);
      }
    }
  },
  (thisPopup) => {
    const user = firebase.auth().currentUser;
    // @ts-ignore todo remove ignore
    if (!user.providerData.find((p) => p.providerId === "password")) {
      thisPopup.inputs = [];
      thisPopup.buttonText = "";
      thisPopup.text = "Password authentication is not enabled";
    }
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
  async (
    email: string,
    emailConfirm: string,
    pass: string,
    passConfirm: string
  ) => {
    if (email !== emailConfirm) {
      Notifications.add("Emails don't match", 0);
      return;
    }

    if (pass !== passConfirm) {
      Notifications.add("Passwords don't match", 0);
      return;
    }

    await AccountController.addPasswordAuth(email, pass);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  },
  () => {
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
  async (password: string) => {
    //
    try {
      const user = firebase.auth().currentUser;
      if (user.providerData[0].providerId === "password") {
        const credential = firebase.auth.EmailAuthProvider.credential(
          user.email,
          password
        );
        await user.reauthenticateWithCredential(credential);
      } else if (user.providerData[0].providerId === "google.com") {
        await user.reauthenticateWithPopup(AccountController.gmailProvider);
      }
      Loader.show();

      Notifications.add("Deleting stats...", 0);
      let response;
      try {
        response = await axiosInstance.delete("/user");
      } catch (error) {
        const e = error as AxiosError;
        Loader.hide();
        const msg = e?.response?.data?.message ?? e.message;
        Notifications.add("Failed to delete user stats: " + msg, -1);
        return;
      }
      if (response.status !== 200) {
        throw response.data.message;
      }

      Notifications.add("Deleting results...", 0);
      try {
        response = await axiosInstance.post("/results/deleteAll");
      } catch (error) {
        const e = error as AxiosError;
        Loader.hide();
        const msg = e?.response?.data?.message ?? e.message;
        Notifications.add("Failed to delete user results: " + msg, -1);
        return;
      }
      if (response.status !== 200) {
        throw response.data.message;
      }

      Notifications.add("Deleting login information...", 0);
      await firebase.auth().currentUser.delete();

      Notifications.add("Goodbye", 1, 5);

      setTimeout(() => {
        location.reload();
      }, 3000);
    } catch (e) {
      Loader.hide();
      // @ts-ignore todo remove ignore
      if (e.code == "auth/wrong-password") {
        Notifications.add("Incorrect password", -1);
      } else {
        Notifications.add("Something went wrong: " + e, -1);
      }
    }
  },
  (thisPopup) => {
    const user = firebase.auth().currentUser;
    if (user.providerData[0].providerId === "google.com") {
      thisPopup.inputs = [];
      thisPopup.buttonText = "Reauthenticate to delete";
    }
  }
);

list["clearTagPb"] = new SimplePopup(
  "clearTagPb",
  "text",
  "Clear Tag PB",
  [],
  `Are you sure you want to clear this tags PB?`,
  "Clear",
  () => {
    const tagid = eval("this.parameters[0]");
    Loader.show();
    axiosInstance
      .delete(`/user/tags/${tagid}/clearPb`)
      .then((res) => {
        Loader.hide();
        if (res.data.resultCode === 1) {
          const tag = DB.getSnapshot().tags?.filter((t) => t._id === tagid)[0];

          if (tag === undefined) return;
          tag.personalBests = {
            time: {},
            words: {},
            zen: { zen: [] },
            quote: { custom: [] },
            custom: { custom: [] },
          };
          $(
            `.pageSettings .section.tags .tagsList .tag[id="${tagid}"] .clearPbButton`
          ).attr("aria-label", "No PB found");
          Notifications.add("Tag PB cleared.", 0);
        } else {
          Notifications.add("Something went wrong: " + res.data.message, -1);
        }
      })
      .catch((e) => {
        Loader.hide();
        if (e.code == "auth/wrong-password") {
          Notifications.add("Incorrect password", -1);
        } else {
          Notifications.add("Something went wrong: " + e, -1);
        }
      });
    // console.log(`clearing for ${eval("this.parameters[0]")} ${eval("this.parameters[1]")}`);
  },
  (thisPopup) => {
    thisPopup.text = `Are you sure you want to clear PB for tag ${thisPopup.parameters[1]}?`;
  }
);

list["applyCustomFont"] = new SimplePopup(
  "applyCustomFont",
  "text",
  "Custom font",
  [{ placeholder: "Font name", initVal: "" }],
  "Make sure you have the font installed on your computer before applying.",
  "Apply",
  (fontName: string) => {
    if (fontName === "") return;
    Settings.groups["fontFamily"]?.setValue(fontName.replace(/\s/g, "_"));
  },
  () => {
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
  async (password: string) => {
    try {
      const user = firebase.auth().currentUser;
      if (user.providerData[0].providerId === "password") {
        const credential = firebase.auth.EmailAuthProvider.credential(
          user.email,
          password
        );
        await user.reauthenticateWithCredential(credential);
      } else if (user.providerData[0].providerId === "google.com") {
        await user.reauthenticateWithPopup(AccountController.gmailProvider);
      }
      Loader.show();

      let response;
      try {
        response = await axiosInstance.delete("/user/personalBests");
      } catch (error) {
        const e = error as AxiosError;
        Loader.hide();
        const msg = e?.response?.data?.message ?? e.message;
        Notifications.add("Failed to reset personal bests: " + msg, -1);
        return;
      }
      Loader.hide();
      if (response.status !== 200) {
        Notifications.add(response.data.message);
      } else {
        Notifications.add("Personal bests have been reset", 1);
        DB.getSnapshot().personalBests = {
          time: {},
          words: {},
          zen: { zen: [] },
          quote: { custom: [] },
          custom: { custom: [] },
        };
      }
    } catch (e) {
      Loader.hide();
      Notifications.add(e as string, -1);
    }
  },
  (thisPopup) => {
    const user = firebase.auth().currentUser;
    if (user.providerData[0].providerId === "google.com") {
      thisPopup.inputs = [];
      thisPopup.buttonText = "Reauthenticate to reset";
    }
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
    let response;
    try {
      response = await axiosInstance.post("/user/discord/unlink", {});
    } catch (error) {
      const e = error as AxiosError;
      Loader.hide();
      const msg = e?.response?.data?.message ?? e.message;
      Notifications.add("Failed to unlink Discord: " + msg, -1);
      return;
    }
    Loader.hide();
    if (response.status !== 200) {
      Notifications.add(response.data.message);
    } else {
      Notifications.add("Accounts unlinked", 1);
      DB.getSnapshot().discordId = undefined;
      Settings.updateDiscordSection();
    }
  },
  () => {
    //
  }
);

$(".pageSettings .section.discordIntegration #unlinkDiscordButton").click(
  () => {
    list["unlinkDiscord"].show();
  }
);

$("#resetSettingsButton").click(() => {
  list["resetSettings"].show();
});

$(".pageSettings #resetPersonalBestsButton").on("click", () => {
  list["resetPersonalBests"].show();
});

$(".pageSettings #updateAccountName").on("click", () => {
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

$(document).on(
  "click",
  ".pageSettings .section.fontFamily .button.custom",
  () => {
    list["applyCustomFont"].show([]);
  }
);

$(document).keydown((event) => {
  if (event.key === "Escape" && !$("#simplePopupWrapper").hasClass("hidden")) {
    hide();
    event.preventDefault();
  }
});
