// Globals for debugging from the browser console, in every environment.
// Dev-only helpers live on `window.__mt` (dev/expose.ts).
import { Config } from "./config/store";
import { getUserData } from "./queries/user";
import * as Sentry from "./sentry";
import { toggleSmoothedBurst } from "./states/result";
import { getLastEventLog } from "./states/test";
import { buildEventLog } from "./test/events/data";
import * as TestTimer from "./test/test-timer";
import { qs, qsa, qsr } from "./utils/dom";
import * as Logger from "./utils/logger";

Object.assign(window, {
  userData: getUserData,
  config: Config,
  glarsesMode: () => {
    console.log("Moved to settings > danger zone > the rest");
  },
  enableTimerDebug: TestTimer.enableTimerDebug,
  getTimerStats: TestTimer.getTimerStats,
  toggleSmoothedBurst,
  toggleDebugLogs: Logger.toggleDebugLogs,
  toggleSentryDebug: Sentry.toggleDebug,
  qs,
  qsa,
  qsr,
  lastEventLog: () => getLastEventLog(),
  currentEventLog: buildEventLog,
});
