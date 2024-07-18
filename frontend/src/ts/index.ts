// this file should be concatenated at the top of the legacy ts files
import "jquery-color";
import "jquery.easing";

import "./event-handlers/global.js";
import "./event-handlers/footer.js";
import "./event-handlers/keymap.js";
import "./event-handlers/test.js";
import "./event-handlers/about.js";
import "./event-handlers/settings.js";
import "./event-handlers/account.js";

import "./modals/google-sign-up.js";

import "./firebase.js";
import * as Logger from "./utils/logger.js";
import * as DB from "./db.js";
import "./ui.js";
import "./controllers/ad-controller.js";
import Config, { loadFromLocalStorage } from "./config.js";
import * as TestStats from "./test/test-stats.js";
import * as Replay from "./test/replay.js";
import * as TestTimer from "./test/test-timer.js";
import * as Result from "./test/result.js";
import "./controllers/account-controller.js";
import { enable } from "./states/glarses-mode.js";
import "./test/caps-warning.js";
import "./modals/simple-modals.js";
import "./controllers/input-controller.js";
import "./ready.js";
import "./controllers/route-controller.js";
import "./pages/about.js";
import "./elements/scroll-to-top.js";
import * as Account from "./pages/account.js";
import "./elements/leaderboards.js";
import "./elements/no-css.js";
import { egVideoListener } from "./popups/video-ad-popup.js";
import "./states/connection.js";
import "./test/tts.js";
import "./elements/fps-counter.js";
import "./controllers/profile-search-controller.js";
import { isDevEnvironment } from "./utils/misc.js";
import * as VersionButton from "./elements/version-button.js";
import * as Focus from "./test/focus.js";
import { getDevOptionsModal } from "./utils/async-modules.js";

function addToGlobal(items: Record<string, unknown>): void {
  for (const [name, item] of Object.entries(items)) {
    //@ts-expect-error
    window[name] = item;
  }
}

void loadFromLocalStorage();
void VersionButton.update();
void Focus.set(true, true);

addToGlobal({
  snapshot: DB.getSnapshot,
  config: Config,
  toggleFilterDebug: Account.toggleFilterDebug,
  glarsesMode: enable,
  stats: TestStats.getStats,
  replay: Replay.getReplayExport,
  enableTimerDebug: TestTimer.enableTimerDebug,
  getTimerStats: TestTimer.getTimerStats,
  toggleUnsmoothedRaw: Result.toggleUnsmoothedRaw,
  egVideoListener: egVideoListener,
  toggleDebugLogs: Logger.toggleDebugLogs,
});

if (isDevEnvironment()) {
  void import("jquery").then((jq) => {
    addToGlobal({ $: jq.default });
  });
  void getDevOptionsModal().then((module) => {
    module.appendButton();
  });
}
