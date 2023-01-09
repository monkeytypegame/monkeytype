import Ape from "../ape";
import * as Loader from "../elements/loader";
import * as Notifications from "../elements/notifications";
import * as CaptchaController from "../controllers/captcha-controller";

interface State {
  userUid?: string;
}

const state: State = {
  userUid: undefined,
};

interface ShowOptions {
  uid: string;
  name: string;
}

export async function show(options: ShowOptions): Promise<void> {
  if ($("#userReportPopupWrapper").hasClass("hidden")) {
    CaptchaController.render(
      document.querySelector("#userReportPopup .g-recaptcha") as HTMLElement,
      "userReportPopup"
    );

    const { name } = options;
    state.userUid = options.uid;

    $("#userReportPopup .user").text(name);
    $("#userReportPopup .reason").val("Inappropriate name");
    $("#userReportPopup .comment").val("");
    $("#userReportPopup .characterCount").text("-");
    $("#userReportPopup .reason").select2({
      minimumResultsForSearch: Infinity,
    });
    $("#userReportPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100, () => {
        $("#userReportPopup textarea").trigger("focus").trigger("select");
      });
  }
}

export async function hide(): Promise<void> {
  if (!$("#userReportPopupWrapper").hasClass("hidden")) {
    $("#userReportPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          CaptchaController.reset("userReportPopup");
          $("#userReportPopupWrapper").addClass("hidden");
        }
      );
  }
}

async function submitReport(): Promise<void> {
  const captchaResponse = CaptchaController.getResponse("userReportPopup");
  if (!captchaResponse) {
    return Notifications.add("Please complete the captcha");
  }

  const reason = $("#userReportPopup .reason").val() as string;
  const comment = $("#userReportPopup .comment").val() as string;
  const captcha = captchaResponse as string;

  if (!reason) {
    return Notifications.add("Please select a valid report reason");
  }

  if (!comment) {
    return Notifications.add("Please provide a comment");
  }

  const characterDifference = comment.length - 250;
  if (characterDifference > 0) {
    return Notifications.add(
      `Report comment is ${characterDifference} character(s) too long`
    );
  }

  Loader.show();
  const response = await Ape.users.report(
    state.userUid as string,
    reason,
    comment,
    captcha
  );
  Loader.hide();

  if (response.status !== 200) {
    return Notifications.add("Failed to report user: " + response.message, -1);
  }

  Notifications.add("Report submitted. Thank you!", 1);
  hide();
}

$("#userReportPopupWrapper").on("mousedown", (e) => {
  if ($(e.target).attr("id") === "userReportPopupWrapper") {
    hide();
  }
});

$("#userReportPopup .comment").on("input", () => {
  setTimeout(() => {
    const len = ($("#userReportPopup .comment").val() as string).length;
    $("#userReportPopup .characterCount").text(len);
    if (len > 250) {
      $("#userReportPopup .characterCount").addClass("red");
    } else {
      $("#userReportPopup .characterCount").removeClass("red");
    }
  }, 1);
});

$("#userReportPopup .submit").on("click", async () => {
  await submitReport();
});
