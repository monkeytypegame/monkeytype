//this file should be concatenated at the top of the legacy js files

import Chart from "chart.js";
import chartTrendline from "chartjs-plugin-trendline";
import chartAnnotation from "chartjs-plugin-annotation";

Chart.plugins.register(chartTrendline);
Chart.plugins.register(chartAnnotation);

import * as DB from "./db";
import * as Misc from "./misc";
import * as ResultFilters from "./result-filters";
import Config from "./config";
import * as SimplePopups from "./simple-popups";
import * as AccountController from "./account-controller";
import { toggleGlarses } from "./test-logic";
import "./caps-warning";
import "./support-popup";
import "./version-popup";
import "./input-controller";
import "./ready";
import "./about-page";
import "./pb-tables-popup";
import * as Account from "./account";
import * as TestStats from "./test-stats";
import * as Replay from "./replay";
