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
    type: "skyscraper_atf",
    selectorId: "ad-vertical-right-wrapper", // fill in appropriate selectorId as needed.
  },
  {
    type: "skyscraper_btf",
    selectorId: "ad-vertical-left-wrapper", // fill in appropriate selectorId as needed.
  },
];
const selloutUnits = [
  {
    type: "leaderboard_atf",
    selectorId: "ad-result-wrapper", // fill in appropriate selectorId as needed.
  },
  {
    type: "leaderboard_btf",
    selectorId: "ad-vertical-right-wrapper", // fill in appropriate selectorId as needed.
  },
  {
    type: "leaderboard_btf",
    selectorId: "ad-vertical-left-wrapper", // fill in appropriate selectorId as needed.
  },
  {
    type: "skyscraper_atf", //160x600
    selectorId: "ad-vertical-right-wrapper", // fill in appropriate selectorId as needed.
  },
  {
    type: "skyscraper_btf", //160x600
    selectorId: "ad-vertical-left-wrapper", // fill in appropriate selectorId as needed.
  },
  {
    type: "bottom_rail", //OOP or out-of-page unit do not need a selectorId. 728x90.
  },
];

export function init(): void {
  // Set Values with your PubID and Website ID
  const pubId = "1024888";
  const websiteId = "74058";

  window.ramp = {
    que: [],
    passiveMode: true,
    // onReady: (): void => {
    //   const units = getUnits();

    //   if (units) {
    //     ramp.addUnits(units).then(() => {
    //       ramp.displayUnits();
    //     });
    //   }
    // },
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

  return units;
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

export function reinstate(): boolean {
  //@ts-ignore
  ramp.destroyUnits("all");
  //@ts-ignore
  return ramp.addUnits(getUnits());
}

export async function refreshVisible(): Promise<void> {
  ramp.triggerRefresh();
}

export function renderResult(): void {
  ramp.addUnits(resultUnits);
}
