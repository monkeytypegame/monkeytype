import AnimatedModal from "../utils/animated-modal";

import * as TestLogic from "../test/test-logic";
import * as Notifications from "../elements/notifications";
import { CompletedEvent } from "@monkeytype/contracts/schemas/results";
import { Auth } from "../firebase";
import { syncNotSignedInLastResult } from "../utils/results";

function reset(): void {
  (modal.getModal().querySelector(".result") as HTMLElement).innerHTML = `
  <div class="group wpm">
        <div class="sub">wpm</div>
        <div class="val">-</div>
      </div>
      <div class="group acc">
        <div class="sub">accuracy</div>
        <div class="val">-</div>
      </div>
      <div class="group raw">
        <div class="sub">raw</div>
        <div class="val">-</div>
      </div>
      <div class="group con">
        <div class="sub">consistency</div>
        <div class="val">-</div>
      </div>
      <div class="group chardata">
        <div class="sub">characters</div>
        <div class="val">-</div>
      </div>
      <div class="group testType">
        <div class="sub">test type</div>
        <div class="val">-</div>
      </div>`;
}

function fillData(): void {
  //safe because we check if it exists before showing the modal
  const r = TestLogic.notSignedInLastResult as CompletedEvent;

  // const r: CompletedEvent = {
  //   wpm: 100,
  //   acc: 100,
  //   rawWpm: 100,
  //   consistency: 100,
  //   mode: "time",
  //   mode2: "60",
  //   numbers: true,
  //   punctuation: true,
  //   difficulty: "master",
  //   language: "english",
  //   blindMode: true,
  //   lazyMode: true,
  //   funbox: "read_ahead",
  //   tags: ["asdf", "sdfsdf"],
  //   charStats: [10, 10, 10, 10],
  // };

  fillGroup("wpm", r.wpm);
  fillGroup("acc", r.acc + "%");
  fillGroup("raw", r.rawWpm);
  fillGroup("con", r.consistency + "%");
  fillGroup("chardata", r.charStats.join("/"));

  let tt = r.mode + " " + r.mode2;

  tt += "<br>" + r.language;

  if (r.numbers) tt += "<br>numbers";
  if (r.punctuation) tt += "<br>punctuation";
  if (r.blindMode) tt += "<br>blind";
  if (r.lazyMode) tt += "<br>lazy";
  if (r.funbox !== "none") {
    tt += "<br>" + r.funbox.replace(/_/g, " ").replace(/#/g, ", ");
  }
  if (r.difficulty !== "normal") tt += "<br>" + r.difficulty;
  if (r.tags.length > 0) tt += "<br>" + r.tags.length + " tags";

  fillGroup("testType", tt, true);
}

function fillGroup(
  groupClass: string,
  text: string | number,
  html = false
): void {
  if (html) {
    $(modal.getModal()).find(`.group.${groupClass} .val`).html(`${text}`);
  } else {
    $(modal.getModal()).find(`.group.${groupClass} .val`).text(text);
  }
}

export function show(): void {
  if (!TestLogic.notSignedInLastResult) {
    Notifications.add(
      "Failed to show last signed out result modal: no last result",
      -1
    );
    return;
  }
  reset();
  void modal.show({
    beforeAnimation: async (): Promise<void> => {
      fillData();
    },
  });
}

function hide(): void {
  void modal.hide();
}

const modal = new AnimatedModal({
  dialogId: "lastSignedOutResult",
  setup: async (modalEl): Promise<void> => {
    modalEl
      .querySelector("button.save")
      ?.addEventListener("click", async (e) => {
        void syncNotSignedInLastResult(Auth?.currentUser?.uid as string);
        hide();
      });
    modalEl.querySelector("button.discard")?.addEventListener("click", (e) => {
      TestLogic.clearNotSignedInResult();
      Notifications.add("Last test result discarded", 0);
      hide();
    });
  },
  customWrapperClickHandler: (): void => {
    //do nothing
  },
});
