import "./event-handlers/global";
import "./event-handlers/keymap";
import "./event-handlers/test";
import "./event-handlers/settings";
import "./event-handlers/account";
import "./event-handlers/leaderboards";
import "./event-handlers/login";
import "./event-handlers/nav";

import "./modals/google-sign-up";

import { init } from "./firebase";
import * as Logger from "./utils/logger";
import * as DB from "./db";
import "./ui";
import "./elements/settings/account-settings-notice";
import "./controllers/ad-controller";
import Config, { loadFromLocalStorage } from "./config";
import * as TestStats from "./test/test-stats";
import * as Replay from "./test/replay";
import * as TestTimer from "./test/test-timer";
import * as Result from "./test/result";
import { onAuthStateChanged } from "./auth";
import { enable } from "./states/glarses-mode";
import "./test/caps-warning";
import "./modals/simple-modals";
import * as CookiesModal from "./modals/cookies";
import "./input/listeners";
import "./controllers/route-controller";
import * as Account from "./pages/account";
import "./elements/no-css";
import { egVideoListener } from "./popups/video-ad-popup";
import "./states/connection";
import "./test/tts";
import { isDevEnvironment, addToGlobal } from "./utils/misc";
import * as Focus from "./test/focus";
import { fetchLatestVersion } from "./utils/version";
import { getDevOptionsModal } from "./utils/async-modules";
import * as Sentry from "./sentry";
import * as Cookies from "./cookies";
import "./elements/psa";
import "./utils/url-handler";
import "./modals/last-signed-out-result";
import { applyEngineSettings } from "./anim";
import { qs, qsa, qsr } from "./utils/dom";
import { mountComponents } from "./components/mount";
import "./ready";

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
void fetchLatestVersion();
Focus.set(true, true);
const accepted = Cookies.getAcceptedCookies();
if (accepted === null) {
  CookiesModal.show();
}
void init(onAuthStateChanged).then(() => {
  if (accepted !== null) {
    Cookies.activateWhatsAccepted();
  }
});

addToGlobal({
  snapshot: DB.getSnapshot,
  config: Config,
  toggleFilterDebug: Account.toggleFilterDebug,
  glarsesMode: enable,
  stats: TestStats.getStats,
  replay: Replay.getReplayExport,
  enableTimerDebug: TestTimer.enableTimerDebug,
  getTimerStats: TestTimer.getTimerStats,
  toggleSmoothedBurst: Result.toggleSmoothedBurst,
  egVideoListener: egVideoListener,
  toggleDebugLogs: Logger.toggleDebugLogs,
  toggleSentryDebug: Sentry.toggleDebug,
  qs: qs,
  qsa: qsa,
  qsr: qsr,
});

if (isDevEnvironment()) {
  void getDevOptionsModal().then((module) => {
    module.appendButton();
  });
}

mountComponents();
