// register signal tracking hook before any signals are created
import "./dev/signal-tracker";

//enable solidjs-devtools
import "solid-devtools";

import "./event-handlers/global";
import "./event-handlers/test";
import "./event-handlers/tribe";

import { init } from "./firebase";
import * as Logger from "./utils/logger";
import * as DB from "./db";
import "./ui";
import "./controllers/ad-controller";
import { Config } from "./config/store";
import * as TestTimer from "./test/test-timer";
import * as Result from "./test/result";
import * as Tribe from "./tribe/tribe";
import * as TribeState from "./tribe/tribe-state";
import * as TribeCarets from "./tribe/tribe-carets";
import * as TribeSocket from "./tribe/tribe-socket";

import { onAuthStateChanged } from "./auth";
import { enable } from "./legacy-states/glarses-mode";
import "./test/caps-warning";
import "./input/listeners";
import "./controllers/route-controller";
import "./elements/no-css";
import { egVideoListener } from "./popups/video-ad-popup";
import "./legacy-states/connection";
import "./test/tts";
import "./modals/tribe-browse-public-rooms";
import { addToGlobal } from "./utils/misc";

import * as Focus from "./test/focus";
import { fetchLatestVersion } from "./utils/version";
import * as Sentry from "./sentry";
import * as Cookies from "./cookies";
import "./elements/psa";
import "./controllers/url-handler";
import { applyEngineSettings } from "./anim";
import { qs, qsa, qsr } from "./utils/dom";
import { mountComponents } from "./components/mount";
import "./ready";
import { setVersion } from "./states/core";
import { isDevEnvironment } from "./utils/env";
import { loadFromLocalStorage } from "./config/lifecycle";

import "./input/hotkeys";
import { showModal } from "./states/modals";
import { lastEventLog } from "./test/test-state";
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
  glarsesMode: enable,
  enableTimerDebug: TestTimer.enableTimerDebug,
  getTimerStats: TestTimer.getTimerStats,
  toggleSmoothedBurst: Result.toggleSmoothedBurst,
  egVideoListener: egVideoListener,
  toggleDebugLogs: Logger.toggleDebugLogs,
  toggleSentryDebug: Sentry.toggleDebug,
  qs: qs,
  qsa: qsa,
  qsr: qsr,
  lastEventLog: () => lastEventLog,
  currentEventLog: buildEventLog,
  createTribeRoom: TribeSocket.default.out.room.create,
  ...(isDevEnvironment()
    ? {
        tribe: Tribe,
        tribeState: TribeState,
        tribeCarets: TribeCarets,
        tribeSocket: TribeSocket.default,
      }
    : {}),
});

mountComponents();
