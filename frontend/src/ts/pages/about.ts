import * as Misc from "../utils/misc";
import * as JSONData from "../utils/json-data";
import * as Numbers from "../utils/numbers";
import Page from "./page";
import Ape from "../ape";
import * as Notifications from "../elements/notifications";
import * as ChartController from "../controllers/chart-controller";
import * as ConnectionState from "../states/connection";
import { intervalToDuration } from "date-fns/intervalToDuration";
import * as Skeleton from "../utils/skeleton";
import {
  TypingStats,
  SpeedHistogram,
} from "@monkeytype/contracts/schemas/public";

function reset(): void {
  $(".pageAbout .contributors").empty();
  $(".pageAbout .supporters").empty();

  ChartController.globalSpeedHistogram.getDataset("count").data = [];
  void ChartController.globalSpeedHistogram.updateColors();
}

let speedHistogramResponseData: SpeedHistogram | null;
let typingStatsResponseData: TypingStats | null;

function updateStatsAndHistogram(): void {
  if (speedHistogramResponseData) {
    void ChartController.globalSpeedHistogram.updateColors();
    const bucketedSpeedStats = getHistogramDataBucketed(
      speedHistogramResponseData
    );
    ChartController.globalSpeedHistogram.data.labels =
      bucketedSpeedStats.labels;

    ChartController.globalSpeedHistogram.getDataset("count").data =
      bucketedSpeedStats.data;
  }
  if (typingStatsResponseData) {
    const secondsRounded = Math.round(typingStatsResponseData.timeTyping);

    const timeTypingDuration = intervalToDuration({
      start: 0,
      end: secondsRounded * 1000,
    });

    $(".pageAbout #totalTimeTypingStat .val").text(
      timeTypingDuration.years?.toString() ?? ""
    );
    $(".pageAbout #totalTimeTypingStat .valSmall").text("years");
    $(".pageAbout #totalTimeTypingStat").attr(
      "aria-label",
      Numbers.numberWithSpaces(Math.round(secondsRounded / 3600)) + " hours"
    );

    const startedWithMagnitude = Numbers.getNumberWithMagnitude(
      typingStatsResponseData.testsStarted
    );

    $(".pageAbout #totalStartedTestsStat .val").text(
      startedWithMagnitude.rounded < 10
        ? startedWithMagnitude.roundedTo2
        : startedWithMagnitude.rounded
    );
    $(".pageAbout #totalStartedTestsStat .valSmall").text(
      startedWithMagnitude.orderOfMagnitude
    );
    $(".pageAbout #totalStartedTestsStat").attr(
      "aria-label",
      Numbers.numberWithSpaces(typingStatsResponseData.testsStarted) + " tests"
    );

    const completedWIthMagnitude = Numbers.getNumberWithMagnitude(
      typingStatsResponseData.testsCompleted
    );

    $(".pageAbout #totalCompletedTestsStat .val").text(
      completedWIthMagnitude.rounded < 10
        ? completedWIthMagnitude.roundedTo2
        : completedWIthMagnitude.rounded
    );
    $(".pageAbout #totalCompletedTestsStat .valSmall").text(
      completedWIthMagnitude.orderOfMagnitude
    );
    $(".pageAbout #totalCompletedTestsStat").attr(
      "aria-label",
      Numbers.numberWithSpaces(typingStatsResponseData.testsCompleted) +
        " tests"
    );
  }
}

async function getStatsAndHistogramData(): Promise<void> {
  if (speedHistogramResponseData && typingStatsResponseData) {
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
      -1
    );
  }
  const typingStats = await Ape.public.getTypingStats();
  if (typingStats.status === 200) {
    typingStatsResponseData = typingStats.body.data;
  } else {
    Notifications.add(
      `Failed to get global typing stats: ${speedStats.body.message}`,
      -1
    );
  }
}

async function fill(): Promise<void> {
  let supporters: string[];
  try {
    supporters = await JSONData.getSupportersList();
  } catch (e) {
    Notifications.add(
      Misc.createErrorMessage(e, "Failed to get supporters"),
      -1
    );
    supporters = [];
  }

  let contributors: string[];
  try {
    contributors = await JSONData.getContributorsList();
  } catch (e) {
    Notifications.add(
      Misc.createErrorMessage(e, "Failed to get contributors"),
      -1
    );
    contributors = [];
  }

  void getStatsAndHistogramData().then(() => {
    updateStatsAndHistogram();
  });

  const supportersEl = document.querySelector(".pageAbout .supporters");
  let supportersHTML = "";
  for (const supporter of supporters) {
    supportersHTML += `<div>${supporter}</div>`;
  }
  if (supportersEl) {
    supportersEl.innerHTML = supportersHTML;
  }

  const contributorsEl = document.querySelector(".pageAbout .contributors");
  let contributorsHTML = "";
  for (const contributor of contributors) {
    contributorsHTML += `<div>${contributor}</div>`;
  }
  if (contributorsEl) {
    contributorsEl.innerHTML = contributorsHTML;
  }
}

/** Convert histogram data to the format required to draw a bar chart. */
function getHistogramDataBucketed(data: Record<string, number>): {
  data: { x: number; y: number }[];
  labels: string[];
} {
  const histogramChartDataBucketed: { x: number; y: number }[] = [];
  const labels: string[] = [];

  const keys = Object.keys(data).sort(
    (a, b) => parseInt(a, 10) - parseInt(b, 10)
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
  name: "about",
  element: $(".page.pageAbout"),
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

$(() => {
  Skeleton.save("pageAbout");
});
