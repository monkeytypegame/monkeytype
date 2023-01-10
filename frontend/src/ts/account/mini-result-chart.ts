import * as ChartController from "../controllers/chart-controller";
import Config from "../config";
import * as Misc from "../utils/misc";

import type { ScaleChartOptions } from "chart.js";

const miniResultScaleOptions = (
  ChartController.result.options as ScaleChartOptions<"line" | "scatter">
).scales;

export function updatePosition(x: number, y: number): void {
  $(".pageAccount .miniResultChartWrapper").css({ top: y, left: x });
}

export function show(): void {
  $(".pageAccount .miniResultChartWrapper").stop(true, true).fadeIn(125);
  $(".pageAccount .miniResultChartBg").stop(true, true).fadeIn(125);
}

function hide(): void {
  $(".pageAccount .miniResultChartWrapper").stop(true, true).fadeOut(125);
  $(".pageAccount .miniResultChartBg").stop(true, true).fadeOut(125);
}

export function updateData(data: MonkeyTypes.ChartData): void {
  // let data = filteredResults[filteredId].chartData;
  let labels = [];
  for (let i = 1; i <= data.wpm.length; i++) {
    labels.push(i.toString());
  }

  //make sure data.wpm and data.err are the same length as data.raw using slice
  data.wpm = data.wpm.slice(0, data.raw.length);
  data.err = data.err.slice(0, data.raw.length);
  labels = labels.slice(0, data.raw.length);

  const smoothedRawData = Misc.smooth(data.raw, 1);

  ChartController.miniResult.data.labels = labels;
  ChartController.miniResult.data.datasets[0].data = data.wpm;
  ChartController.miniResult.data.datasets[1].data = smoothedRawData;
  ChartController.miniResult.data.datasets[2].data = data.err;

  const maxChartVal = Math.max(
    ...[Math.max(...data.wpm), Math.max(...data.raw)]
  );
  const minChartVal = Math.min(
    ...[Math.min(...data.wpm), Math.min(...data.raw)]
  );
  miniResultScaleOptions["wpm"].max = Math.round(maxChartVal);
  miniResultScaleOptions["raw"].max = Math.round(maxChartVal);

  if (!Config.startGraphsAtZero) {
    miniResultScaleOptions["wpm"].min = Math.round(minChartVal);
    miniResultScaleOptions["raw"].min = Math.round(minChartVal);
  } else {
    miniResultScaleOptions["wpm"].min = 0;
    miniResultScaleOptions["raw"].min = 0;
  }

  ChartController.miniResult.updateColors();
}

$(".pageAccount").on("click", ".miniResultChartBg", () => {
  hide();
});
