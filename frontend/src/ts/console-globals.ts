// Globals for debugging from the browser console, in every environment.
// Dev-only helpers live on `window.__mt` (dev/expose.ts).
import { Config } from "./config/store";
import { getUserData } from "./queries/user";
import { toggleSentryDebug } from "./integrations/sentry";
import { toggleSmoothedBurst } from "./states/result";
import { getResultData } from "./test/engine/state";
import { buildEventLog } from "./test/engine/events/data";
import * as TestTimer from "./test/engine/test-timer";
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
  toggleSentryDebug,
  qs,
  qsa,
  qsr,
  lastEventLog: () => getResultData()?.eventLog ?? null,
  currentEventLog: buildEventLog,
});
