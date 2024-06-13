import { debounce } from "throttle-debounce";
// import * as Numbers from "../utils/numbers";
import * as ConfigEvent from "../observables/config-event";
import * as BannerEvent from "../observables/banner-event";
import Config from "../config";
import * as TestState from "../test/test-state";
import * as EG from "./eg-ad-controller";
import * as PW from "./pw-ad-controller";

const breakpoint = 900;
let widerThanBreakpoint = true;

const breakpoint2 = 1330;
let widerThanBreakpoint2 = true;

let initialised = false;

export let adBlock: boolean;
export let cookieBlocker: boolean;

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
    if (TestState.isActive) {
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

function removeAll(): void {
  removeSellout();
  removeOn();
  removeResult();
}

function removeSellout(): void {
  $("#ad-footer-wrapper").remove();
  $("#ad-footer-small-wrapper").remove();
  $("#ad-about-1-wrapper").remove();
  $("#ad-about-1-small-wrapper").remove();
  $("#ad-about-2-wrapper").remove();
  $("#ad-about-2-small-wrapper").remove();
  $("#ad-settings-1-wrapper").remove();
  $("#ad-settings-1-small-wrapper").remove();
  $("#ad-settings-2-wrapper").remove();
  $("#ad-settings-2-small-wrapper").remove();
  $("#ad-settings-3-wrapper").remove();
  $("#ad-settings-3-small-wrapper").remove();
  $("#ad-account-1-wrapper").remove();
  $("#ad-account-1-small-wrapper").remove();
  $("#ad-account-2-wrapper").remove();
  $("#ad-account-2-small-wrapper").remove();
}

function removeOn(): void {
  $("#ad-vertical-right-wrapper").remove();
  $("#ad-vertical-left-wrapper").remove();
}

function removeResult(): void {
  $("#ad-result-wrapper").remove();
  $("#ad-result-small-wrapper").remove();
}

function updateVerticalMargin(): void {
  // const height = $("#bannerCenter").height() as number;
  // const margin = height + Numbers.convertRemToPixels(2) + "px";
  // $("#ad-vertical-left-wrapper").css("margin-top", margin);
  // $("#ad-vertical-right-wrapper").css("margin-top", margin);
}

function updateBreakpoint(noReinstate = false): void {
  const beforeUpdate = widerThanBreakpoint;

  if (window.innerWidth > breakpoint) {
    widerThanBreakpoint = true;
  } else {
    widerThanBreakpoint = false;
  }
  if (noReinstate) return;
  if (Config.ads === "off" || !initialised) return;
  if (beforeUpdate !== widerThanBreakpoint) {
    if (choice === "eg") {
      EG.reinstate();
    } else {
      PW.reinstate();
    }
  }
}

function updateBreakpoint2(noReinstate = false): void {
  if (choice !== "pw") return;
  const beforeUpdate = widerThanBreakpoint2;

  if (window.innerWidth > breakpoint2) {
    widerThanBreakpoint2 = true;
  } else {
    widerThanBreakpoint2 = false;
  }
  if (noReinstate) return;
  if (Config.ads === "off" || !initialised) return;
  if (beforeUpdate !== widerThanBreakpoint2) {
    PW.reinstate();
  }
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
      if (adBlock === undefined) {
        //@ts-expect-error
        if (window.egAdPack === undefined) {
          adBlock = true;
        } else {
          adBlock = false;
        }
      }
    } else if (choice === "pw") {
      //@ts-expect-error
      if (window.ramp === undefined) {
        adBlock = true;
      }
    }
    resolve();
  });
}

export async function checkCookieblocker(): Promise<void> {
  return new Promise((resolve) => {
    if (cookieBlocker === undefined) {
      if (choice === "pw") {
        cookieBlocker = false;
        resolve();
        return;
      }

      //@ts-expect-error
      if (window.__tcfapi === undefined) {
        cookieBlocker = true;
        resolve();
        return;
      }
      //@ts-expect-error
      window.__tcfapi("getTCData", 2, (tcData, success) => {
        if (success as boolean) {
          if (tcData.eventStatus === "cmpuishown") {
            cookieBlocker = true;
          } else {
            cookieBlocker = false;
          }
        } else {
          cookieBlocker = true;
        }
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
  if (adBlock || cookieBlocker) return false;

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

  if (adBlock) {
    $("#ad-result-wrapper .iconAndText .text").html(`
    Using an ad blocker? No worries
    <div class="smalltext">
      We understand ads can be annoying
      <br />
      You can
      <i>disable all ads</i>
      in the settings
    </div>
    `);
    return;
  }

  if (cookieBlocker) {
    $("#ad-result-wrapper .iconAndText .text").html(`
    Ads not working? Ooops
    <div class="smalltext">
      You may have a cookie popup blocker enabled - ads will not show without your consent
      <br />
      You can also 
      <i>disable all ads</i>
      in the settings if you wish
    </div>
    `);
    return;
  }

  if (choice === "eg") {
    EG.renderResult(widerThanBreakpoint);
  } else {
    void PW.renderResult();
  }
}

export function updateFooterAndVerticalAds(visible: boolean): void {
  if (visible) {
    $("#ad-vertical-left-wrapper").removeClass("testPage");
    $("#ad-vertical-right-wrapper").removeClass("testPage");
    $("#ad-footer-wrapper").removeClass("testPage");
    $("#ad-footer-small-wrapper").removeClass("testPage");
  } else {
    $("#ad-vertical-left-wrapper").addClass("testPage");
    $("#ad-vertical-right-wrapper").addClass("testPage");
    $("#ad-footer-wrapper").addClass("testPage");
    $("#ad-footer-small-wrapper").addClass("testPage");
  }
}

export function showConsentPopup(): void {
  if (choice === "eg") {
    //@ts-expect-error
    window.__tcfapi("displayConsentUi", 2, function () {
      //
    });
  } else {
    //@ts-expect-error
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

const debouncedMarginUpdate = debounce(500, updateVerticalMargin);
const debouncedBreakpointUpdate = debounce(500, updateBreakpoint);
const debouncedBreakpoint2Update = debounce(500, updateBreakpoint2);

$(window).on("resize", () => {
  debouncedMarginUpdate();
  debouncedBreakpointUpdate();
  debouncedBreakpoint2Update();
});

ConfigEvent.subscribe((event, value) => {
  if (event === "ads") {
    if (value === "off") {
      removeAll();
    } else if (value === "result") {
      removeSellout();
      removeOn();
    } else if (value === "on") {
      removeSellout();
    }
  }
});

BannerEvent.subscribe(() => {
  updateVerticalMargin();
});

$(document).ready(() => {
  updateBreakpoint(true);
  updateBreakpoint2();
});

window.onerror = function (error): void {
  //@ts-expect-error
  if (choice === "eg") {
    if (typeof error === "string" && error.startsWith("EG APS")) {
      $("#ad-result-wrapper .iconAndText").addClass("withLeft");
    }
  }
};
