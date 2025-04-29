// this file should be concatenated at the top of the legacy ts files
import "jquery-color";
import "jquery.easing";

import "./event-handlers/global";
import "./event-handlers/footer";
import "./event-handlers/keymap";
import "./event-handlers/test";
import "./event-handlers/about";
import "./event-handlers/settings";
import "./event-handlers/account";
import "./event-handlers/leaderboards";
import "./event-handlers/login";

import "./modals/google-sign-up";

import "./firebase";
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
import "./controllers/account-controller";
import { enable } from "./states/glarses-mode";
import "./test/caps-warning";
import "./modals/simple-modals";
import "./controllers/input-controller";
import "./ready";
import "./controllers/route-controller";
import "./pages/about";
import "./elements/scroll-to-top";
import * as Account from "./pages/account";
import "./elements/no-css";
import { egVideoListener } from "./popups/video-ad-popup";
import "./states/connection";
import "./test/tts";
import "./elements/fps-counter";
import "./controllers/profile-search-controller";
import { isDevEnvironment } from "./utils/misc";
import * as VersionButton from "./elements/version-button";
import * as Focus from "./test/focus";
import { getDevOptionsModal } from "./utils/async-modules";
import * as Sentry from "@sentry/browser";
import { envConfig } from "./constants/env-config";

function addToGlobal(items: Record<string, unknown>): void {
  for (const [name, item] of Object.entries(items)) {
    //@ts-expect-error dev
    window[name] = item;
  }
}

void loadFromLocalStorage();
void VersionButton.update();
Focus.set(true, true);

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
} else {
  Sentry.init({
    release: envConfig.clientVersion,
    dsn: "https://f50c25dc9dd75304a63776063896a39b@o4509236448133120.ingest.us.sentry.io/4509237217394688",
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Tracing
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: ["localhost", /^https:\/\/api\.monkeytype\.com/],
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  });
}
