// this file should be concatenated at the top of the legacy ts files
import "jquery-color";
import "jquery.easing";

import "./event-handlers/global";
import "./event-handlers/footer";
import "./event-handlers/keymap";
import "./event-handlers/test";

import "./firebase";
import * as Logger from "./utils/logger";
import * as DB from "./db";
import "./ui";
import "./controllers/ad-controller";
import Config from "./config";
import * as TestStats from "./test/test-stats";
import * as Replay from "./test/replay";
import * as TestTimer from "./test/test-timer";
import * as Result from "./test/result";
import "./controllers/account-controller";
import { enable } from "./states/glarses-mode";
import "./test/caps-warning";
import "./popups/contact-popup";
import "./popups/version-popup";
import "./popups/edit-preset-popup";
import "./popups/set-streak-hour-offset";
import "./popups/simple-popups";
import "./controllers/input-controller";
import "./ready";
import "./controllers/route-controller";
import "./pages/about";
import "./popups/pb-tables-popup";
import "./elements/scroll-to-top";
import "./popups/mobile-test-config-popup";
import "./popups/edit-tags-popup";
import "./popups/google-sign-up-popup";
import "./popups/result-tags-popup";
import * as Account from "./pages/account";
import "./elements/leaderboards";
import "./elements/no-css";
import { egVideoListener } from "./popups/video-ad-popup";
import "./states/connection";
import "./test/tts";
import "./elements/fps-counter";
import "./controllers/profile-search-controller";
import { isDevEnvironment } from "./utils/misc";

function addToGlobal(items: Record<string, unknown>): void {
  for (const [name, item] of Object.entries(items)) {
    //@ts-expect-error
    window[name] = item;
  }
}

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
}
