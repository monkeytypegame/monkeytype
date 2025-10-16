import { ChartData } from "@monkeytype/schemas/results";
import AnimatedModal from "../utils/animated-modal";
import * as ChartController from "../controllers/chart-controller";
import Config from "../config";

function updateData(data: ChartData): void {
  // let data = filteredResults[filteredId].chartData;
  let labels = [];
  for (let i = 1; i <= data.wpm.length; i++) {
    labels.push(i.toString());
  }

  //make sure data.wpm and data.err are the same length as data.burst using slice
  data.wpm = data.wpm.slice(0, data.burst.length);
  data.err = data.err.slice(0, data.burst.length);
  labels = labels.slice(0, data.burst.length);

  ChartController.miniResult.data.labels = labels;

  ChartController.miniResult.getDataset("wpm").data = data.wpm;
  ChartController.miniResult.getDataset("burst").data = data.burst;
  ChartController.miniResult.getDataset("error").data = data.err;

  const maxChartVal = Math.max(
    ...[Math.max(...data.wpm), Math.max(...data.burst)]
  );
  const minChartVal = Math.min(
    ...[Math.min(...data.wpm), Math.min(...data.burst)]
  );

  ChartController.miniResult.getScale("wpm").max = Math.round(maxChartVal);
  ChartController.miniResult.getScale("burst").max = Math.round(maxChartVal);

  if (!Config.startGraphsAtZero) {
    ChartController.miniResult.getScale("wpm").min = Math.round(minChartVal);
    ChartController.miniResult.getScale("burst").min = Math.round(minChartVal);
  } else {
    ChartController.miniResult.getScale("wpm").min = 0;
    ChartController.miniResult.getScale("burst").min = 0;
  }

  void ChartController.miniResult.updateColors();
}

export function show(data: ChartData): void {
  updateData(data);
  void modal.show();
}

const modal = new AnimatedModal({
  dialogId: "miniResultChartModal",
});
