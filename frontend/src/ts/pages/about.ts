import * as Misc from "../utils/misc";
import Page from "./page";
import Ape from "../ape";
import * as Notifications from "../elements/notifications";
import * as ChartController from "../controllers/chart-controller";

function reset(): void {
  $(".pageAbout .contributors").empty();
  $(".pageAbout .supporters").empty();
  ChartController.globalSpeedHistogram.data.datasets[0].data = [];
  ChartController.globalSpeedHistogram.updateColors();
}

async function fill(): Promise<void> {
  const supporters = await Misc.getSupportersList();
  const contributors = await Misc.getContributorsList();
  const speedStats = await Ape.publicStats.getSpeedStats({
    language: "english",
    mode: "time",
    mode2: "15",
  });
  if (speedStats.status >= 200 && speedStats.status < 300) {
    ChartController.globalSpeedHistogram.updateColors();
    const bucketedSpeedStats = getHistogramDataBucketed(speedStats.data);
    ChartController.globalSpeedHistogram.data.labels =
      bucketedSpeedStats.labels;
    ChartController.globalSpeedHistogram.data.datasets[0].data =
      bucketedSpeedStats.data;
  } else {
    Notifications.add(
      `Failed to get global speed stats for histogram: ${speedStats.message}`,
      -1
    );
  }

  supporters.forEach((supporter) => {
    $(".pageAbout .supporters").append(`
      <div>${supporter}</div>
    `);
  });
  contributors.forEach((contributor) => {
    $(".pageAbout .contributors").append(`
      <div>${contributor}</div>
    `);
  });
}

export const page = new Page(
  "about",
  $(".page.pageAbout"),
  "/about",
  async () => {
    //
  },
  async () => {
    reset();
  },
  async () => {
    fill();
  },
  async () => {
    //
  }
);

/** Convert histogram data to the format required to draw a bar chart. */
function getHistogramDataBucketed(data: Record<string, number>): { data: { x: number; y: number }[]; labels: string[] } {
  const histogramChartDataBucketed: { x: number; y: number }[] = [];
  const labels: string[] = [];

  const keys = Object.keys(data);
  for (let i = 0; i < keys.length; i++) {
    const bucket = parseInt(keys[i], 10);
    labels.push(`${bucket} - ${bucket + 9}`);
    if (bucket + 10 != parseInt(keys[i + 1], 10)) {
      for (let j = bucket + 10; j < parseInt(keys[i + 1]); j += 10) {
        histogramChartDataBucketed.push({ x: i, y: 0 });
        labels.push(`${j} - ${j + 9}`);
      }
    }
    histogramChartDataBucketed.push({
      x: bucket,
      y: data[bucket],
    });
  }
  return { data: histogramChartDataBucketed, labels };
}
