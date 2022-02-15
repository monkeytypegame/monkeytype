/* eslint-disable no-unused-vars */
//this file should be concatenated at the top of the legacy js files

// @ts-ignore
import Chart from "chart.js";
// @ts-ignore
import chartTrendline from "chartjs-plugin-trendline";
// @ts-ignore
import chartAnnotation from "chartjs-plugin-annotation";

Chart.plugins.register(chartTrendline);
Chart.plugins.register(chartAnnotation);

// @ts-ignore
import * as DB from "./db";
// @ts-ignore
import Config from "./config";
// @ts-ignore
import * as TestStats from "./test/test-stats";
// @ts-ignore
import * as Replay from "./test/replay";
// @ts-ignore
import * as TestTimer from "./test/test-timer";
// @ts-ignore
import * as Result from "./test/result";
// @ts-ignore
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

// @ts-ignore
global.snapshot = DB.getSnapshot;

// @ts-ignore
global.config = Config;

// @ts-ignore
global.toggleFilterDebug = Account.toggleFilterDebug;

// @ts-ignore
global.glarsesMode = enable;

// @ts-ignore
global.stats = TestStats.getStats;

// @ts-ignore
global.replay = Replay.getReplayExport;

// @ts-ignore
global.enableTimerDebug = TestTimer.enableTimerDebug;

// @ts-ignore
global.getTimerStats = TestTimer.getTimerStats;

// @ts-ignore
global.toggleUnsmoothedRaw = Result.toggleUnsmoothedRaw;

// @ts-ignore
global.enableSpacingDebug = TestInput.enableSpacingDebug;
