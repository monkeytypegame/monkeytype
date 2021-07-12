import * as Loader from "./loader";
import * as Notifications from "./notifications";
import * as AccountController from "./account-controller";
import * as DB from "./db";
import * as Settings from "./settings";
import axiosInstance from "./axios-instance";
import * as UpdateConfig from "./config";

export let list = {};
class SimplePopup {
  constructor(
    id,
    type,
    title,
    inputs = [],
    text = "",
    buttonText = "Confirm",
    execFn,
    beforeShowFn
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
    this.beforeShowFn = beforeShowFn;
  }
  reset() {
    this.element.html(`
    <div class="title"></div>
    <div class="inputs"></div>
    <div class="text"></div>
    <div class="button"></div>`);
  }

  init() {
    let el = this.element;
    el.find("input").val("");
    // if (el.attr("popupId") !== this.id) {
    this.reset();
    el.attr("popupId", this.id);
    el.find(".title").text(this.title);
    el.find(".text").text(this.text);

    this.initInputs();

    el.find(".button").text(this.buttonText);
    // }
  }

  initInputs() {
    let el = this.element;
    if (this.inputs.length > 0) {
      if (this.type === "number") {
        this.inputs.forEach((input) => {
          el.find(".inputs").append(`
        <input type="number" min="1" val="${input.initVal}" placeholder="${input.placeholder}" required autocomplete="off">
        `);
        });
      } else if (this.type === "text") {
        this.inputs.forEach((input) => {
          if (input.type) {
            el.find(".inputs").append(`
            <input type="${input.type}" val="${input.initVal}" placeholder="${input.placeholder}" required autocomplete="off">
            `);
          } else {
            el.find(".inputs").append(`
            <input type="text" val="${input.initVal}" placeholder="${input.placeholder}" required autocomplete="off">
            `);
          }
        });
      }
      el.find(".inputs").removeClass("hidden");
    } else {
      el.find(".inputs").addClass("hidden");
    }
  }

  exec() {
    let vals = [];
    $.each($("#simplePopup input"), (index, el) => {
      vals.push($(el).val());
    });
    this.execFn(...vals);
    this.hide();
  }

  show(parameters) {
    this.parameters = parameters;
    this.beforeShowFn();
    this.init();
    this.wrapper
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125, () => {
        $($("#simplePopup").find("input")[0]).focus();
      });
  }

  hide() {
    this.wrapper
      .stop(true, true)
      .css("opacity", 1)
      .removeClass("hidden")
      .animate({ opacity: 0 }, 125, () => {
        this.wrapper.addClass("hidden");
      });
  }
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

$(document).on("click", "#simplePopupWrapper .button", (e) => {
  let id = $("#simplePopup").attr("popupId");
  list[id].exec();
});

$(document).on("keyup", "#simplePopupWrapper input", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    let id = $("#simplePopup").attr("popupId");
    list[id].exec();
  }
});

list.updateEmail = new SimplePopup(
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
  (pass, email, emailConfirm) => {
    try {
      const user = firebase.auth().currentUser;
      const credential = firebase.auth.EmailAuthProvider.credential(
        user.email,
        pass
      );
      if (email !== emailConfirm) {
        Notifications.add("Emails don't match", 0);
        return;
      }
      Loader.show();
      user
        .reauthenticateWithCredential(credential)
        .then(() => {
          axiosInstance
            .post("/user/updateEmail", {
              uid: user.uid,
              previousEmail: user.email,
              newEmail: email,
            })
            .then((data) => {
              Loader.hide();
              if (data.status === 200) {
                Notifications.add("Email updated", 0);
                setTimeout(() => {
                  AccountController.signOut();
                }, 1000);
              } else {
                Notifications.add(data.message);
              }
            });
        })
        .catch((e) => {
          Loader.hide();
          Notifications.add("Incorrect current password", -1);
        });
    } catch (e) {
      Notifications.add("Something went wrong: " + e, -1);
    }
  },
  () => {}
);

list.updatePassword = new SimplePopup(
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
  async (previousPass, newPass, newPassConfirm) => {
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
    } catch (e) {
      Loader.hide();
      Notifications.add(e, -1);
    }
  },
  () => {}
);

list.clearTagPb = new SimplePopup(
  "clearTagPb",
  "text",
  "Clear Tag PB",
  [],
  `Are you sure you want to clear this tags PB?`,
  "Clear",
  () => {
    let tagid = eval("this.parameters[0]");
    Loader.show();
    axiosInstance
      .post("/user/tags/clearPb", {
        tagid: tagid,
      })
      .then((res) => {
        Loader.hide();
        if (res.data.resultCode === 1) {
          let tag = DB.getSnapshot().tags.filter((t) => t.id === tagid)[0];
          tag.pb = 0;
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
        Notifications.add(
          "Something went wrong while clearing tag pb " + e,
          -1
        );
      });
    // console.log(`clearing for ${eval("this.parameters[0]")} ${eval("this.parameters[1]")}`);
  },
  () => {
    eval(
      "this.text = `Are you sure you want to clear PB for tag ${eval('this.parameters[1]')}?`"
    );
  }
);

list.applyCustomFont = new SimplePopup(
  "applyCustomFont",
  "text",
  "Custom font",
  [{ placeholder: "Font name", initVal: "" }],
  "Make sure you have the font installed on your computer before applying.",
  "Apply",
  (fontName) => {
    if (fontName === "") return;
    Settings.groups.fontFamily.setValue(fontName.replace(/\s/g, "_"));
  },
  () => {}
);

list.resetPersonalBests = new SimplePopup(
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
  async (password) => {
    try {
      const user = firebase.auth().currentUser;
      const credential = firebase.auth.EmailAuthProvider.credential(
        user.email,
        password
      );
      Loader.show();
      await user.reauthenticateWithCredential(credential);

      let response;
      try {
        response = await axiosInstance.post("/user/clearPb");
      } catch (e) {
        Loader.hide();
        let msg = e?.response?.data?.message ?? e.message;
        Notifications.add("Failed to reset personal bests: " + msg, -1);
        return;
      }
      Loader.hide();
      if (response.status !== 200) {
        Notifications.add(response.data.message);
      } else {
        Notifications.add("Personal bests have been reset", 1);
        DB.getSnapshot().personalBests = {};
      }
    } catch (e) {
      Loader.hide();
      Notifications.add(e, -1);
    }
  },
  () => {}
);

list.resetSettings = new SimplePopup(
  "resetSettings",
  "text",
  "Reset Settings",
  [],
  "Are you sure you want to reset all your settings?",
  "Reset",
  () => {
    UpdateConfig.reset();
    setTimeout(() => {
      location.reload();
    }, 1000);
  },
  () => {}
);

list.unlinkDiscord = new SimplePopup(
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
    } catch (e) {
      Loader.hide();
      let msg = e?.response?.data?.message ?? e.message;
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

    //todo rewrite to axios
    // CloudFunctions.unlinkDiscord({
    //   uid: firebase.auth().currentUser.uid,
    // }).then((ret) => {
    //   Loader.hide();
    //   console.log(ret);
    //   if (ret.data.status === 1) {
    //     DB.getSnapshot().discordId = null;
    //     Notifications.add("Accounts unlinked", 0);
    //     Settings.updateDiscordSection();
    //   } else {
    //     Notifications.add("Something went wrong: " + ret.data.message, -1);
    //     Settings.updateDiscordSection();
    //   }
    // });
  },
  () => {}
);
