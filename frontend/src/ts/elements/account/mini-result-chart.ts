import * as ChartController from "../../controllers/chart-controller";
import Config from "../../config";
import * as Misc from "../../utils/misc";
import * as Arrays from "../../utils/arrays";

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

export function updateData(data: SharedTypes.ChartData): void {
  // let data = filteredResults[filteredId].chartData;
  let labels = [];
  for (let i = 1; i <= data.wpm.length; i++) {
    labels.push(i.toString());
  }

  //make sure data.wpm and data.err are the same length as data.raw using slice
  data.wpm = data.wpm.slice(0, data.raw.length);
  data.err = data.err.slice(0, data.raw.length);
  labels = labels.slice(0, data.raw.length);

  const smoothedRawData = Arrays.smooth(data.raw, 1);

  ChartController.miniResult.data.labels = labels;

  ChartController.miniResult.getDataset("wpm").data = data.wpm;
  ChartController.miniResult.getDataset("raw").data = smoothedRawData;
  ChartController.miniResult.getDataset("error").data = data.err;

  const maxChartVal = Math.max(
    ...[Math.max(...data.wpm), Math.max(...data.raw)]
  );
  const minChartVal = Math.min(
    ...[Math.min(...data.wpm), Math.min(...data.raw)]
  );

  ChartController.miniResult.getScale("wpm").max = Math.round(maxChartVal);
  ChartController.miniResult.getScale("raw").max = Math.round(maxChartVal);

  if (!Config.startGraphsAtZero) {
    ChartController.miniResult.getScale("wpm").min = Math.round(minChartVal);
    ChartController.miniResult.getScale("raw").min = Math.round(minChartVal);
  } else {
    ChartController.miniResult.getScale("wpm").min = 0;
    ChartController.miniResult.getScale("raw").min = 0;
  }

  void ChartController.miniResult.updateColors();
}

$(document).on("keydown", (event) => {
  if (
    event.key === "Escape" &&
    Misc.isElementVisible(".pageAccount .miniResultChartWrapper")
  ) {
    hide();
    event.preventDefault();
  }
});

$(".pageAccount").on("click", ".miniResultChartBg", () => {
  hide();
});
