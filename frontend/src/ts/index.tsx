// Import sorting is disabled for this file (.oxfmtrc.json): many imports run
// side effects on load, so their order matters.

// register signal tracking hook before any signals are created
import "./dev/signal-tracker";

//enable solidjs-devtools
import "solid-devtools";

import "./event-handlers/global";

import { init } from "./firebase";
import * as Logger from "./utils/logger";
import * as DB from "./db";
import "./ui";
import "./controllers/ad-controller";
import { Config } from "./config/store";
import * as TestTimer from "./test/test-timer";
import { toggleSmoothedBurst } from "./states/result";
import { onAuthStateChanged } from "./auth";
import "./elements/no-css";
import "./states/connection";
import "./test/tts";
import { addToGlobal } from "./utils/misc";
import * as Focus from "./test/focus";
import { fetchLatestVersion } from "./utils/version";
import * as Sentry from "./sentry";
import * as Cookies from "./cookies";
import "./elements/psa";
import { applyEngineSettings } from "./anim";
import { qs, qsa, qsr } from "./utils/dom";
import { render } from "solid-js/web";
import { App } from "./components/core/App";
import "./ready";
import { setVersion } from "./states/core";
import { loadFromLocalStorage } from "./config/lifecycle";

import "./input/hotkeys";
import { showModal } from "./states/modals";
import { getLastEventLog } from "./states/test";
import { buildEventLog } from "./test/events/data";

// Lock Math.random
Object.defineProperty(Math, "random", {
  value: Math.random,
  writable: false,
  configurable: false,
  enumerable: true,
});

// Freeze Math object
Object.freeze(Math);

// Lock Math on window
Object.defineProperty(window, "Math", {
  value: Math,
  writable: false,
  configurable: false,
  enumerable: true,
});

if (import.meta.env.DEV) {
  void import("./dev/expose");
}

// render before anything that might touch component-rendered DOM (eg. test page).
// Renders after the static markup in <body> (index.html)
render(() => <App />, document.body);

applyEngineSettings();
void loadFromLocalStorage();
void fetchLatestVersion().then((data) => {
  if (data === null) return;
  setVersion(data);
});

Focus.set(true, true);
const accepted = Cookies.getAcceptedCookies();
if (accepted === null) {
  showModal("Cookies");
}
void init(onAuthStateChanged).then(() => {
  if (accepted !== null) {
    Cookies.activateWhatsAccepted();
  }
});

addToGlobal({
  snapshot: DB.getSnapshot,
  config: Config,
  glarsesMode: () => {
    console.log("Moved to settings > danger zone > the rest");
  },
  enableTimerDebug: TestTimer.enableTimerDebug,
  getTimerStats: TestTimer.getTimerStats,
  toggleSmoothedBurst,
  toggleDebugLogs: Logger.toggleDebugLogs,
  toggleSentryDebug: Sentry.toggleDebug,
  qs: qs,
  qsa: qsa,
  qsr: qsr,
  lastEventLog: () => getLastEventLog(),
  currentEventLog: buildEventLog,
});
