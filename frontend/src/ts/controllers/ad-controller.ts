/* oxlint-disable no-unsafe-member-access */
import { debounce } from "throttle-debounce";
import { Config } from "../config/store";
import * as EG from "./eg-ad-controller";
import * as PW from "./pw-ad-controller";
import { adSlotMediaQueries } from "../components/common/Advertisement";
import { isTestActive } from "../states/test";
import {
  getAdBlock,
  getCookieBlocker,
  setAdBlock,
  setCookieBlocker,
} from "../states/ads";
// import { createEffect } from "solid-js";

let initialised = false;

// export let choice: "eg" | "pw" = Math.random() < 0.5 ? "eg" : "pw";
const choice: "eg" | "pw" = "pw";

// console.log("AB choice: " + choice);

// const adChoiceForce = window.localStorage.getItem("adChoiceForce");
// if (adChoiceForce === "eg") {
//   choice = "eg";
//   console.log("AB choice forced: " + choice);
// } else if (adChoiceForce === "pw") {
//   choice = "pw";
//   console.log("AB choice forced: " + choice);
// }

function init(): void {
  if (choice === "eg") {
    EG.init();
  } else {
    PW.init();
  }

  setInterval(() => {
    if (isTestActive()) {
      return;
    }
    if (choice === "eg") {
      void EG.refreshVisible();
    } else {
      void PW.refreshVisible();
    }
  }, 60000);

  initialised = true;
}

async function _refreshVisible(): Promise<void> {
  if (choice === "eg") {
    await EG.refreshVisible();
  } else {
    await PW.refreshVisible();
  }
}

export async function checkAdblock(): Promise<void> {
  return new Promise((resolve) => {
    if (choice === "eg") {
      if (getAdBlock() === undefined) {
        //@ts-expect-error 3rd party ad code
        setAdBlock(window.egAdPack === undefined);
      }
    } else if (choice === "pw") {
      //@ts-expect-error 3rd party ad code
      if (window.ramp === undefined) {
        setAdBlock(true);
      }
    }
    resolve();
  });
}

export async function checkCookieblocker(): Promise<void> {
  return new Promise((resolve) => {
    if (getCookieBlocker() === undefined) {
      if (choice === "pw") {
        setCookieBlocker(false);
        resolve();
        return;
      }

      //@ts-expect-error 3rd party ad code
      if (window.__tcfapi === undefined) {
        setCookieBlocker(true);
        resolve();
        return;
      }
      //@ts-expect-error 3rd party ad code
      // oxlint-disable-next-line no-unsafe-call
      window.__tcfapi("getTCData", 2, (tcData, success) => {
        setCookieBlocker(
          !(success as boolean) || tcData.eventStatus === "cmpuishown",
        );
      });
    }
    resolve();
  });
}

export async function reinstate(): Promise<boolean> {
  if (Config.ads === "off") return false;
  if (!initialised) {
    init();
    return true;
  }
  await checkAdblock();
  await checkCookieblocker();
  if (getAdBlock() || getCookieBlocker()) return false;

  if (choice === "eg") {
    return EG.reinstate();
  } else {
    return PW.reinstate();
  }
}

export async function renderResult(): Promise<void> {
  if (Config.ads === "off") return;
  if (!initialised) {
    init();
  }
  await checkAdblock();
  await checkCookieblocker();

  // the result ad shows a message instead (see ResultAds)
  if (getAdBlock() || getCookieBlocker()) return;

  if (choice === "eg") {
    EG.renderResult(window.innerWidth > 900);
  } else {
    void PW.renderResult();
  }
}

export function showConsentPopup(): void {
  if (choice === "eg") {
    //@ts-expect-error 3rd party ad code, doesnt have types
    // oxlint-disable-next-line no-unsafe-call
    window.__tcfapi("displayConsentUi", 2, function () {
      //
    });
  } else {
    //@ts-expect-error 3rd party ad code, doesnt have types
    // oxlint-disable-next-line no-unsafe-call
    ramp.showCmpModal();
  }
}

export function destroyResult(): void {
  if (choice === "pw") {
    PW.destroyAll();
  }
  // $("#ad-result-wrapper").empty();
  // $("#ad-result-small-wrapper").empty();
}

// a slot shown or hidden at a breakpoint: PW only fills the visible slots
const onSlotBreakpoint = debounce(500, () => {
  if (Config.ads === "off" || !initialised) return;
  void PW.reinstate();
});
for (const query of adSlotMediaQueries) {
  window.matchMedia(query).addEventListener("change", onSlotBreakpoint);
}

// createEffect(() => {
//   qs("#ad-vertical-left-wrapper")?.setStyle({
//     marginTop: getGlobalOffsetTop() + "px",
//   });
//   qs("#ad-vertical-right-wrapper")?.setStyle({
//     marginTop: getGlobalOffsetTop() + "px",
//   });
// });
