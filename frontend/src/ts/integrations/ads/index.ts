/* oxlint-disable no-unsafe-member-access */
import { debounce } from "throttle-debounce";
import { getConfig } from "../../config/store";
import {
  initEgAds,
  refreshVisibleEgAds,
  reinstateEgAds,
  renderEgResultAds,
} from "./eg";
import {
  destroyAllPwAds,
  initPwAds,
  refreshVisiblePwAds,
  reinstatePwAds,
  renderPwResultAds,
} from "./pw";
import { adSlotMediaQueries } from "../../components/common/Advertisement";
import { isTestActive } from "../../test/engine/state";
import { isDevEnvironment } from "../../utils/env";
import {
  getAdBlock,
  getCookieBlocker,
  setAdBlock,
  setCookieBlocker,
} from "../../states/ads";
// import { createEffect } from "solid-js";

let initialised = false;

// dev: the slots show as empty placeholders, no third party ad scripts load
const noAdScripts = isDevEnvironment();

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

function initAds(): void {
  if (choice === "eg") {
    initEgAds();
  } else {
    initPwAds();
  }

  setInterval(() => {
    if (isTestActive()) {
      return;
    }
    if (choice === "eg") {
      void refreshVisibleEgAds();
    } else {
      void refreshVisiblePwAds();
    }
  }, 60000);

  initialised = true;
}

async function _refreshVisible(): Promise<void> {
  if (choice === "eg") {
    await refreshVisibleEgAds();
  } else {
    await refreshVisiblePwAds();
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

export async function reinstateAds(): Promise<boolean> {
  if (getConfig.ads === "off" || noAdScripts) return false;
  if (!initialised) {
    initAds();
    return true;
  }
  await checkAdblock();
  await checkCookieblocker();
  if (getAdBlock() || getCookieBlocker()) return false;

  if (choice === "eg") {
    return reinstateEgAds();
  } else {
    return reinstatePwAds();
  }
}

export async function renderResultAds(): Promise<void> {
  if (getConfig.ads === "off" || noAdScripts) return;
  if (!initialised) {
    initAds();
  }
  await checkAdblock();
  await checkCookieblocker();

  // the result ad shows a message instead (see ResultAds)
  if (getAdBlock() || getCookieBlocker()) return;

  if (choice === "eg") {
    renderEgResultAds(window.innerWidth > 900);
  } else {
    void renderPwResultAds();
  }
}

export function showConsentPopup(): void {
  if (noAdScripts) return;
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

export function destroyResultAds(): void {
  if (choice === "pw") {
    destroyAllPwAds();
  }
  // $("#ad-result-wrapper").empty();
  // $("#ad-result-small-wrapper").empty();
}

// a slot shown or hidden at a breakpoint: PW only fills the visible slots
const onSlotBreakpoint = debounce(500, () => {
  if (getConfig.ads === "off" || !initialised) return;
  void reinstatePwAds();
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
