// @ts-ignore
import Chart from "chart.js";
// @ts-ignore
import chartTrendline from "chartjs-plugin-trendline";
// @ts-ignore
import chartAnnotation from "chartjs-plugin-annotation";

Chart.plugins.register(chartTrendline);
Chart.plugins.register(chartAnnotation);

import "./controllers/account-controller";
import "./test/caps-warning";
import "./popups/support-popup";
import "./popups/contact-popup";
import "./popups/version-popup";
import "./popups/edit-preset-popup";
import "./popups/simple-popups";
import "./controllers/input-controller";
import "./ready";
import "./ui";
import "./pages/about";
import "./popups/pb-tables-popup";
import "./elements/scroll-to-top";
import "./popups/mobile-test-config-popup";
import "./popups/edit-tags-popup";
import * as DB from "./db";
import Config from "./config";
import * as TestStats from "./test/test-stats";
import * as Replay from "./test/replay";
import * as TestTimer from "./test/test-timer";
import * as Result from "./test/result";
import * as TestInput from "./test/test-input";
import * as Account from "./pages/account";
import { enable } from "./states/glarses-mode";

declare global {
  // eslint-disable-next-line
  var config: MonkeyTypes.Config;
  function snapshot(): MonkeyTypes.Snapshot;
  function toggleFilterDebug(): void;
  function glarsesMode(): void;
  function stats(): void;
  function replay(): string;
  function enableTimerDebug(): void;
  function getTimerStats(): MonkeyTypes.TimerStats[];
  function toggleUnsmoothedRaw(): void;
  function enableSpacingDebug(): void;
}

global.snapshot = DB.getSnapshot;

global.config = Config;

global.stats = TestStats.getStats;

global.replay = Replay.getReplayExport;

global.enableTimerDebug = TestTimer.enableTimerDebug;

global.getTimerStats = TestTimer.getTimerStats;

global.toggleUnsmoothedRaw = Result.toggleUnsmoothedRaw;

global.enableSpacingDebug = TestInput.enableSpacingDebug;

global.toggleFilterDebug = Account.toggleFilterDebug;

global.glarsesMode = enable;
