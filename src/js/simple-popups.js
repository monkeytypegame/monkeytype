let simplePopups = {};
class SimplePopup {
  constructor(
    id,
    type,
    title,
    inputs = [],
    text = "",
    buttonText = "Confirm",
    execFn
  ) {
    this.id = id;
    this.type = type;
    this.execFn = execFn;
    this.title = title;
    this.inputs = inputs;
    this.text = text;
    this.wrapper = $("#simplePopupWrapper");
    this.element = $("#simplePopup");
    this.buttonText = buttonText;
  }
  reset() {
    this.element.html(`
    <div class="title"></div>
    <form class="inputs"></form>
    <div class="text"></div>
    <div class="button"></div>`);
  }

  init() {
    let el = this.element;
    el.find("input").val("");
    if (el.attr("popupId") !== this.id) {
      this.reset();
      el.attr("popupId", this.id);
      el.find(".title").text(this.title);
      el.find(".text").text(this.text);

      this.initInputs();

      el.find(".button").text(this.buttonText);
    }
  }

  initInputs() {
    let el = this.element;
    if (this.inputs.length > 0) {
      if (this.type === "number") {
        this.inputs.forEach((input) => {
          el.find(".inputs").append(`
        <input type="number" min="1" val="${input.initVal}" placeholder="${input.placeholder}" required>
        `);
        });
      } else if (this.type === "text") {
        this.inputs.forEach((input) => {
          el.find(".inputs").append(`
        <input type="text" val="${input.initVal}" placeholder="${input.placeholder}" required>
        `);
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

  show() {
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

$("#simplePopupWrapper").click((e) => {
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
  simplePopups[id].exec();
});

$(document).on("keyup", "#simplePopupWrapper input", (e) => {
  if (e.key === "Enter") {
    let id = $("#simplePopup").attr("popupId");
    simplePopups[id].exec();
  }
});

simplePopups.updateEmail = new SimplePopup(
  "updateEmail",
  "text",
  "Update Email",
  [
    {
      placeholder: "Current email",
      initVal: "",
    },
    {
      placeholder: "New email",
      initVal: "",
    },
  ],
  "Don't mess this one up or you won't be able to login!",
  "Update",
  (previousEmail, newEmail) => {
    try {
      showBackgroundLoader();
      CloudFunctions.updateEmail({
        uid: firebase.auth().currentUser.uid,
        previousEmail: previousEmail,
        newEmail: newEmail,
      }).then((data) => {
        hideBackgroundLoader();
        if (data.data.resultCode === 1) {
          Misc.showNotification("Email updated", 2000);
          setTimeout(() => {
            signOut();
          }, 1000);
        } else if (data.data.resultCode === -1) {
          Misc.showNotification("Current email doesn't match", 2000);
        } else {
          Misc.showNotification(
            "Something went wrong: " + JSON.stringify(data.data),
            7000
          );
        }
      });
    } catch (e) {
      Misc.showNotification("Something went wrong: " + e, 5000);
    }
  }
);
