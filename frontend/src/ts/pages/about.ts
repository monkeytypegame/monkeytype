import Page from "./page";
import Ape from "../ape";
import * as Notifications from "../elements/notifications";
import * as ChartController from "../controllers/chart-controller";
import * as ConnectionState from "../states/connection";
import * as Skeleton from "../utils/skeleton";
import { SpeedHistogram } from "@monkeytype/schemas/public";
import { qsr, onWindowLoad } from "../utils/dom";

function reset(): void {
  ChartController.globalSpeedHistogram.getDataset("count").data = [];
  void ChartController.globalSpeedHistogram.updateColors();
}

let speedHistogramResponseData: SpeedHistogram | null;

function updateStatsAndHistogram(): void {
  if (speedHistogramResponseData) {
    void ChartController.globalSpeedHistogram.updateColors();
    const bucketedSpeedStats = getHistogramDataBucketed(
      speedHistogramResponseData,
    );
    ChartController.globalSpeedHistogram.data.labels =
      bucketedSpeedStats.labels;

    ChartController.globalSpeedHistogram.getDataset("count").data =
      bucketedSpeedStats.data;
  }
}

async function getStatsAndHistogramData(): Promise<void> {
  if (speedHistogramResponseData) {
    return;
  }

  if (!ConnectionState.get()) {
    Notifications.add("Cannot update all time stats - offline", 0);
    return;
  }

  const speedStats = await Ape.public.getSpeedHistogram({
    query: {
      language: "english",
      mode: "time",
      mode2: "60",
    },
  });
  if (speedStats.status === 200) {
    speedHistogramResponseData = speedStats.body.data;
  } else {
    Notifications.add(
      `Failed to get global speed stats for histogram: ${speedStats.body.message}`,
      -1,
    );
  }
}

async function fill(): Promise<void> {
  void getStatsAndHistogramData().then(() => {
    updateStatsAndHistogram();
  });
}

/** Convert histogram data to the format required to draw a bar chart. */
function getHistogramDataBucketed(data: Record<string, number>): {
  data: { x: number; y: number }[];
  labels: string[];
} {
  const histogramChartDataBucketed: { x: number; y: number }[] = [];
  const labels: string[] = [];

  const keys = Object.keys(data).sort(
    (a, b) => parseInt(a, 10) - parseInt(b, 10),
  );
  // for (let i = 0; i < keys.length; i++) {
  for (const [i, key] of keys.entries()) {
    const nextKey = keys[i + 1];
    const bucket = parseInt(key, 10);
    histogramChartDataBucketed.push({
      x: bucket,
      y: data[bucket] as number,
    });
    labels.push(`${bucket} - ${bucket + 9}`);
    if (nextKey !== undefined && bucket + 10 !== parseInt(nextKey, 10)) {
      for (let j = bucket + 10; j < parseInt(nextKey, 10); j += 10) {
        histogramChartDataBucketed.push({ x: j, y: 0 });
        labels.push(`${j} - ${j + 9}`);
      }
    }
  }
  return { data: histogramChartDataBucketed, labels };
}

export const page = new Page({
  id: "about",
  element: qsr(".page.pageAbout"),
  path: "/about",
  afterHide: async (): Promise<void> => {
    reset();
    Skeleton.remove("pageAbout");
  },
  beforeShow: async (): Promise<void> => {
    Skeleton.append("pageAbout", "main");
    void fill();
  },
});

onDOMReady(() => {
  Skeleton.save("pageAbout");
});
