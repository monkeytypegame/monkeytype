/* eslint-disable no-unused-vars */
//this file should be concatenated at the top of the legacy js files

import Chart from "chart.js";
import chartTrendline from "chartjs-plugin-trendline";
import chartAnnotation from "chartjs-plugin-annotation";

Chart.plugins.register(chartTrendline);
Chart.plugins.register(chartAnnotation);

import * as DB from "./db";
import * as Misc from "./misc";
import Config from "./config";
import { toggleGlarses } from "./test/test-logic";
import "./test/caps-warning";
import "./popups/support-popup";
import "./popups/contact-popup";
import "./popups/version-popup";
import "./controllers/input-controller";
import "./ready";
import "./pages/about";
import "./popups/pb-tables-popup";
import "./elements/scroll-to-top";
import "./popups/mobile-test-config-popup";
import * as TestStats from "./test/test-stats";
import * as Replay from "./test/replay";
import * as TestTimer from "./test/test-timer";
import * as Result from "./test/result";

//try to keep this list short because we need to eliminate it eventually
global.getuid = Misc.getuid;

//these exports are just for debugging in the browser
global.snapshot = DB.getSnapshot;
global.config = Config;
// global.addnotif = Notifications.add;

global.glarsesMode = toggleGlarses;

global.stats = TestStats.getStats;

global.replay = Replay.getReplayExport;

global.enableTimerDebug = TestTimer.enableTimerDebug;

global.getTimerStats = TestTimer.getTimerStats;

global.toggleUnsmoothedRaw = Result.toggleUnsmoothedRaw;

global.enableSpacingDebug = TestStats.enableSpacingDebug;
