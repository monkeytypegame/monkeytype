import Ape from "../ape";

import { showLoaderBar, hideLoaderBar } from "../signals/loader-bar";
import * as Notifications from "../elements/notifications";
import * as CaptchaController from "../controllers/captcha-controller";
import SlimSelect from "slim-select";
import AnimatedModal from "../utils/animated-modal";
import { isAuthenticated } from "../firebase";
import { CharacterCounter } from "../elements/character-counter";
import { ReportUserReason } from "@monkeytype/schemas/users";
import { qsr } from "../utils/dom";

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

  if (!CaptchaController.isCaptchaAvailable()) {
    Notifications.add(
      "Could not show user report popup: Captcha is not available. This could happen due to a blocked or failed network request. Please refresh the page or contact support if this issue persists.",
      -1,
    );
    return;
  }

  void modal.show({
    mode: "dialog",
    focusFirstInput: true,
    beforeAnimation: async (modalEl) => {
      CaptchaController.render(
        modalEl.qsr(".g-recaptcha").native,
        "userReportModal",
      );

      const { name } = options;
      state.userUid = options.uid;
      state.lbOptOut = options.lbOptOut;

      modalEl.qs(".user")?.setText(name);
      modalEl.qs<HTMLSelectElement>(".reason")?.setValue("Inappropriate name");
      modalEl.qs<HTMLTextAreaElement>(".comment")?.setValue("");

      select = new SlimSelect({
        select: modalEl.qs(".reason")?.native as HTMLElement,
        settings: {
          showSearch: false,
          contentLocation: modalEl.native,
        },
      });
    },
  });

  new CharacterCounter(modal.getModal().qsr(".comment"), 250);
}

async function hide(): Promise<void> {
  void modal.hide();
}

async function submitReport(): Promise<void> {
  const captchaResponse = CaptchaController.getResponse("userReportModal");
  if (!captchaResponse) {
    Notifications.add("Please complete the captcha");
    return;
  }

  const reason = qsr<HTMLSelectElement>(
    "#userReportModal select.reason",
  ).getValue() as ReportUserReason;
  const comment = qsr<HTMLTextAreaElement>(
    "#userReportModal .comment",
  ).getValue() as string;
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
      },
    );
    return;
  }

  const characterDifference = comment.length - 250;
  if (characterDifference > 0) {
    Notifications.add(
      `Report comment is ${characterDifference} character(s) too long`,
    );
    return;
  }

  showLoaderBar();
  const response = await Ape.users.report({
    body: {
      uid: state.userUid as string,
      reason,
      comment,
      captcha,
    },
  });
  hideLoaderBar();

  if (response.status !== 200) {
    Notifications.add("Failed to report user", -1, { response });
    return;
  }

  Notifications.add("Report submitted. Thank you!", 1);
  void hide();
}

const modal = new AnimatedModal({
  dialogId: "userReportModal",
  setup: async (modalEl): Promise<void> => {
    modalEl.qs("button")?.on("click", () => {
      void submitReport();
    });
  },
  cleanup: async (): Promise<void> => {
    select?.destroy();
    select = undefined;
    CaptchaController.reset("userReportModal");
  },
});
