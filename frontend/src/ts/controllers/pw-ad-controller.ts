//@ts-nocheck

import Config from "../config";

// Step 1: Create the Ramp Object, NOTE: selector id needed for tagged units only
const resultUnits = [
  {
    type: "leaderboard_atf",
    selectorId: "ad-result-wrapper", // fill in appropriate selectorId as needed.
  },
];
const onUnits = [
  {
    type: "leaderboard_atf",
    selectorId: "ad-result-wrapper", // fill in appropriate selectorId as needed.
  },
  {
    type: "sky_atf", //160x600
    selectorId: "ad-vertical-right-wrapper", // fill in appropriate selectorId as needed.
  },
  {
    type: "sky_atf", //160x600
    selectorId: "ad-vertical-left-wrapper", // fill in appropriate selectorId as needed.
  },
];
const selloutUnits = [
  {
    type: "leaderboard_atf",
    selectorId: "ad-result-wrapper", // fill in appropriate selectorId as needed.
  },
  {
    type: "sky_atf", //160x600
    selectorId: "ad-vertical-right-wrapper", // fill in appropriate selectorId as needed.
  },
  {
    type: "sky_atf", //160x600
    selectorId: "ad-vertical-left-wrapper", // fill in appropriate selectorId as needed.
  },
  {
    type: "leaderboard_btf",
    selectorId: "ad-footer-wrapper",
  },
  {
    type: "leaderboard_btf",
    selectorId: "ad-about-1-wrapper",
  },
  {
    type: "leaderboard_btf",
    selectorId: "ad-about-2-wrapper",
  },
  {
    type: "leaderboard_btf",
    selectorId: "ad-settings-1-wrapper",
  },
  {
    type: "leaderboard_btf",
    selectorId: "ad-settings-1-small-wrapper",
  },
  {
    type: "leaderboard_btf",
    selectorId: "ad-settings-2-wrapper",
  },
  {
    type: "leaderboard_btf",
    selectorId: "ad-settings-3-wrapper",
  },
  {
    type: "leaderboard_btf",
    selectorId: "ad-account-1-wrapper",
  },
  {
    type: "leaderboard_btf",
    selectorId: "ad-account-2-wrapper",
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
  window.dataLayer = window.dataLayer || [];
  window.gtag =
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
    if (document.querySelector(`#${unit.selectorId}`)) {
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
  await ramp.destroyUnits("all");
  await ramp.addUnits(getUnits());
  await ramp.displayUnits();
}

export async function refreshVisible(): Promise<void> {
  if (!rampReady) return;
  ramp.triggerRefresh();
}

export function renderResult(): void {
  if (!rampReady) return;
  ramp.triggerRefresh();
}

export function setMobile(tf: boolean): void {
  if (!rampReady) return;
  ramp.setMobile(tf);
}
