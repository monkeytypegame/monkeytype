// this file should be concatenated at the top of the legacy js files

// @ts-ignore
import Chart from "chart.js";
// @ts-ignore
import chartTrendline from "chartjs-plugin-trendline";
// @ts-ignore
import chartAnnotation from "chartjs-plugin-annotation";

Chart.plugins.register(chartTrendline);
Chart.plugins.register(chartAnnotation);

import * as DB from "./db";
import Config from "./config";
import * as TestStats from "./test/test-stats";
import * as Replay from "./test/replay";
import * as TestTimer from "./test/test-timer";
import * as Result from "./test/result";
import * as TestInput from "./test/test-input";
import "./controllers/account-controller";
import { enable } from "./states/glarses-mode";
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
import * as Account from "./pages/account";

type Global = typeof globalThis & MonkeyTypes.Global;

(global as Global).snapshot = DB.getSnapshot;

(global as Global).config = Config;

(global as Global).toggleFilterDebug = Account.toggleFilterDebug;

(global as Global).glarsesMode = enable;

(global as Global).stats = TestStats.getStats;

(global as Global).replay = Replay.getReplayExport;

(global as Global).enableTimerDebug = TestTimer.enableTimerDebug;

(global as Global).getTimerStats = TestTimer.getTimerStats;

(global as Global).toggleUnsmoothedRaw = Result.toggleUnsmoothedRaw;

(global as Global).enableSpacingDebug = TestInput.enableSpacingDebug;
