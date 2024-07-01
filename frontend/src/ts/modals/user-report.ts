import Ape from "../ape";
import * as Loader from "../elements/loader";
import * as Notifications from "../elements/notifications";
import * as CaptchaController from "../controllers/captcha-controller";
import SlimSelect from "slim-select";
import AnimatedModal from "../utils/animated-modal";
import { isAuthenticated } from "../firebase";
import { CharacterCounter } from "../elements/character-counter";

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
    return Notifications.add("You must be logged in to submit a report", 0);
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

  new CharacterCounter(
    $("#userReportModal .comment") as JQuery<HTMLTextAreaElement>,
    250
  );
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
    return Notifications.add("Please complete the captcha");
  }

  const reason = $("#userReportModal .reason").val() as string;
  const comment = $("#userReportModal .comment").val() as string;
  const captcha = captchaResponse as string;

  if (!reason) {
    return Notifications.add("Please select a valid report reason");
  }

  if (!comment) {
    return Notifications.add("Please provide a comment");
  }

  if (reason === "Suspected cheating" && state.lbOptOut) {
    return Notifications.add(
      "You cannot report this user for suspected cheating as they have opted out of the leaderboards.",
      0,
      {
        duration: 10,
      }
    );
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
