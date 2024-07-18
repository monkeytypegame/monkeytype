//@ts-nocheck

import Config from "../config";
import * as ActivePage from "../states/active-page";
import * as TestUI from "../test/test-ui";

// Step 1: Create the Ramp Object, NOTE: selector id needed for tagged units only
const resultUnits = [
  {
    type: "leaderboard_atf",
    selectorId: "ad-result-wrapper",
  },
  {
    type: "med_rect_btf",
    selectorId: "ad-result-small-wrapper",
  },
];
const onUnits = [
  {
    type: "leaderboard_atf",
    selectorId: "ad-result-wrapper",
  },
  {
    type: "med_rect_btf",
    selectorId: "ad-result-small-wrapper",
  },
  {
    type: "sky_btf", //160x600
    selectorId: "ad-vertical-right-wrapper",
  },
  {
    type: "sky_btf", //160x600
    selectorId: "ad-vertical-left-wrapper",
  },
];
const selloutUnits = [
  {
    type: "leaderboard_atf",
    selectorId: "ad-result-wrapper",
  },
  {
    type: "med_rect_btf",
    selectorId: "ad-result-small-wrapper",
  },
  {
    type: "sky_btf", //160x600
    selectorId: "ad-vertical-right-wrapper",
  },
  {
    type: "sky_btf", //160x600
    selectorId: "ad-vertical-left-wrapper",
  },
  {
    type: "leaderboard_btf",
    selectorId: "ad-footer-wrapper",
  },
  {
    type: "med_rect_btf",
    selectorId: "ad-footer-small-wrapper",
  },
  {
    type: "leaderboard_btf",
    selectorId: "ad-about-1-wrapper",
  },
  {
    type: "med_rect_btf",
    selectorId: "ad-about-1-small-wrapper",
  },
  {
    type: "leaderboard_btf",
    selectorId: "ad-about-2-wrapper",
  },
  {
    type: "med_rect_btf",
    selectorId: "ad-about-2-small-wrapper",
  },
  {
    type: "leaderboard_btf",
    selectorId: "ad-settings-1-wrapper",
  },
  {
    type: "med_rect_btf",
    selectorId: "ad-settings-1-small-wrapper",
  },
  {
    type: "leaderboard_btf",
    selectorId: "ad-settings-2-wrapper",
  },
  {
    type: "med_rect_btf",
    selectorId: "ad-settings-2-small-wrapper",
  },
  {
    type: "leaderboard_btf",
    selectorId: "ad-settings-3-wrapper",
  },
  {
    type: "med_rect_btf",
    selectorId: "ad-settings-3-small-wrapper",
  },
  {
    type: "leaderboard_btf",
    selectorId: "ad-account-1-wrapper",
  },
  {
    type: "med_rect_btf",
    selectorId: "ad-account-1-small-wrapper",
  },
  {
    type: "leaderboard_btf",
    selectorId: "ad-account-2-wrapper",
  },
  {
    type: "med_rect_btf",
    selectorId: "ad-account-2-small-wrapper",
  },
];

let rampReady = false;

export function init(): void {
  // Set Values with your PubID and Website ID
  const pubId = "1024888";
  const websiteId = "74058";

  window.ramp = {
    que: [],
    passiveMode: true,
    forcePath: "320x50-test",
    onReady: (): void => {
      rampReady = true;

      reinstate();
    },
  };

  const headOfDocument = document.getElementsByTagName("head")[0];

  // Step 2: Creates the Ramp Scripts
  const rampScript = document.createElement("script");
  rampScript.setAttribute("async", true);
  rampScript.src = `//cdn.intergient.com/${pubId}/${websiteId}/ramp.js`;
  headOfDocument.appendChild(rampScript);

  window._pwGA4PageviewId = "".concat(Date.now());
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    window.gtag ||
    function (): void {
      // eslint-disable-next-line prefer-rest-params
      dataLayer.push(arguments);
    };
  gtag("js", new Date());
  gtag("config", "G-KETCPNHRJF", { send_page_view: false });
  gtag("event", "ramp_js", {
    send_to: "G-KETCPNHRJF",
    pageview_id: window._pwGA4PageviewId,
  });
}

function getUnits(): unknown {
  let units = undefined;

  if (Config.ads === "result") {
    units = resultUnits;
  } else if (Config.ads === "on") {
    units = onUnits;
  } else if (Config.ads === "sellout") {
    units = selloutUnits;
  }

  const toReturn = [];
  for (const unit of units) {
    // const isSky = unit.type === "sky_btf";

    const element = document.querySelector(`#${unit.selectorId}`);

    if (
      element &&
      window.getComputedStyle(element).display !== "none" &&
      element.offsetParent !== null
      // && (!isSky || (isSky && showSky))
    ) {
      toReturn.push(unit);
    }
  }

  return toReturn;
}

//add logic so script selects the correct ad units array, 'default', 'on', 'sellout'
//Since ad units do not populate until results page is shown, trigger the API methods when results are
//shown for user so the containers do not populate with hidden ads before the ad containers are shown.  Current example below will populate the container with an ad on page load.
//use onClick's or other user events to trigger applicable API methods.  For example, if user clicks to a new area of the site, ramp.destroyUnits('all')...
//then run ramp.addUnits(defaultUnits).then(
//            () => {
//                ramp.displayUnits()
//            }
//        )

export async function reinstate(): boolean {
  if (!rampReady) return;
  if (ActivePage.get() === "test" && !TestUI.resultVisible) {
    ramp.destroyUnits("all");
    return;
  }
  await ramp.destroyUnits("all");
  await ramp.addUnits(getUnits());
  await ramp.displayUnits();
}

export async function refreshVisible(): Promise<void> {
  // if (!rampReady) return;
  // if (getUnits().length === 0) return;
  // ramp.triggerRefresh();
}

export function destroyAll(): void {
  if (!rampReady) return;
  ramp.destroyUnits("all");
}

export async function renderResult(): Promise<void> {
  if (!rampReady) return;
  // if (
  //   ramp.getUnits().includes("leaderboard_atf") ||
  //   ramp.getUnits().includes("med_rect_btf")
  // ) {
  //   ramp.triggerRefresh();
  // } else {
  // reinstate();
  const units = getUnits();
  await ramp.addUnits(units);
  await ramp.displayUnits();
  // }
}

// let showSky = false;

// export function updateSky(visible: boolean): void {
//   showSky = visible;
//   if (
//     showSky &&
//     ramp &&
//     !ramp.getUnits().some((u) => u.includes("pw-160x600"))
//   ) {
//     ramp.addUnits(getUnits()).then(() => {
//       ramp.displayUnits();
//     });
//   } else if (ramp && !showSky) {
//     const toDestroy = [];
//     ramp.getUnits().map((u) => {
//       if (u.includes("pw-160x600")) toDestroy.push(u);
//     });
//     ramp.destroyUnits(toDestroy);
//   }
// }
