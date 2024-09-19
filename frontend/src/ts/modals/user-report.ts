import Ape from "../ape";
import * as Loader from "../elements/loader";
import * as Notifications from "../elements/notifications";
import * as CaptchaController from "../controllers/captcha-controller";
import SlimSelect from "slim-select";
import AnimatedModal from "../utils/animated-modal";
import { isAuthenticated } from "../firebase";
import { CharacterCounter } from "../elements/character-counter";
import { ReportUserReason } from "@monkeytype/contracts/schemas/users";

type State = {
  userUid?: string;
  lbOptOut?: boolean;
};

const state: State = {
  userUid: undefined,
  lbOptOut: undefined,
};

type ShowOptions = {
  uid: string;
  name: string;
  lbOptOut: boolean;
};

let select: SlimSelect | undefined = undefined;

export async function show(options: ShowOptions): Promise<void> {
  if (!isAuthenticated()) {
    Notifications.add("You must be logged in to submit a report", 0);
    return;
  }

  void modal.show({
    mode: "dialog",
    focusFirstInput: true,
    beforeAnimation: async (modalEl) => {
      CaptchaController.render(
        modalEl.querySelector(".g-recaptcha") as HTMLElement,
        "userReportModal"
      );

      const { name } = options;
      state.userUid = options.uid;
      state.lbOptOut = options.lbOptOut;

      (modalEl.querySelector(".user") as HTMLElement).textContent = name;
      (modalEl.querySelector(".reason") as HTMLSelectElement).value =
        "Inappropriate name";
      (modalEl.querySelector(".comment") as HTMLTextAreaElement).value = "";

      select = new SlimSelect({
        select: modalEl.querySelector(".reason") as HTMLElement,
        settings: {
          showSearch: false,
          contentLocation: modalEl,
        },
      });
    },
  });

  new CharacterCounter($("#userReportModal .comment"), 250);
}

async function hide(): Promise<void> {
  void modal.hide({
    afterAnimation: async () => {
      select?.destroy();
      select = undefined;
      CaptchaController.reset("userReportModal");
    },
  });
}

async function submitReport(): Promise<void> {
  const captchaResponse = CaptchaController.getResponse("userReportModal");
  if (!captchaResponse) {
    Notifications.add("Please complete the captcha");
    return;
  }

  const reason = $("#userReportModal .reason").val() as ReportUserReason;
  const comment = $("#userReportModal .comment").val() as string;
  const captcha = captchaResponse;

  if (!reason) {
    Notifications.add("Please select a valid report reason");
    return;
  }

  if (!comment) {
    Notifications.add("Please provide a comment");
    return;
  }

  if (reason === "Suspected cheating" && state.lbOptOut) {
    Notifications.add(
      "You cannot report this user for suspected cheating as they have opted out of the leaderboards.",
      0,
      {
        duration: 10,
      }
    );
    return;
  }

  const characterDifference = comment.length - 250;
  if (characterDifference > 0) {
    Notifications.add(
      `Report comment is ${characterDifference} character(s) too long`
    );
    return;
  }

  Loader.show();
  const response = await Ape.users.report({
    body: {
      uid: state.userUid as string,
      reason,
      comment,
      captcha,
    },
  });
  Loader.hide();

  if (response.status !== 200) {
    Notifications.add("Failed to report user: " + response.body.message, -1);
    return;
  }

  Notifications.add("Report submitted. Thank you!", 1);
  void hide();
}

const modal = new AnimatedModal({
  dialogId: "userReportModal",
  setup: async (modalEl): Promise<void> => {
    modalEl.querySelector("button")?.addEventListener("click", () => {
      void submitReport();
    });
  },
});
