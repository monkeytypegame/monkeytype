import * as Misc from "../utils/misc";
import * as JSONData from "../utils/json-data";
import { CachedPage } from "./page";
import Ape from "../ape";
import * as Notifications from "../elements/notifications";
import * as ChartController from "../controllers/chart-controller";
import * as ConnectionState from "../states/connection";
import { intervalToDuration } from "date-fns/intervalToDuration";
import * as Skeleton from "../utils/skeleton";
import { TypingStats, SpeedHistogram } from "@monkeytype/schemas/public";
import { getNumberWithMagnitude, numberWithSpaces } from "../utils/numbers";
import { tryCatch } from "@monkeytype/util/trycatch";

function reset(): void {
  $(".pageAbout .contributors").empty();
  $(".pageAbout .supporters").empty();

  ChartController.globalSpeedHistogram.getDataset("count").data = [];
  void ChartController.globalSpeedHistogram.updateColors();
}

let speedHistogramResponseData: SpeedHistogram | null;
let typingStatsResponseData: TypingStats | null;
let supporters: string[] | null;
let contributors: string[] | null;

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
      numberWithSpaces(Math.round(secondsRounded / 3600)) + " hours"
    );

    const startedWithMagnitude = getNumberWithMagnitude(
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
      numberWithSpaces(typingStatsResponseData.testsStarted) + " tests"
    );

    const completedWIthMagnitude = getNumberWithMagnitude(
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
      numberWithSpaces(typingStatsResponseData.testsCompleted) + " tests"
    );
  }
}

async function getSpeedHistogram(): Promise<void> {
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
}

async function getTypingStats(): Promise<void> {
  if (!ConnectionState.get()) {
    Notifications.add("Cannot update all time stats - offline", 0);
    return;
  }

  const typingStats = await Ape.public.getTypingStats();
  if (typingStats.status === 200) {
    typingStatsResponseData = typingStats.body.data;
  } else {
    Notifications.add(
      `Failed to get global typing stats: ${typingStats.body.message}`,
      -1
    );
  }
}

async function getSupporters(): Promise<void> {
  //we fetch supporters only once because they don't change often
  if (supporters) return;
  const { data, error: supportersError } = await tryCatch(
    JSONData.getSupportersList()
  );
  if (supportersError) {
    Notifications.add(
      Misc.createErrorMessage(supportersError, "Failed to get supporters"),
      -1
    );
  }
  supporters = data;
}

async function getContributors(): Promise<void> {
  //we fetch contributors only once because they don't change often
  if (contributors) return;
  const { data, error: contributorsError } = await tryCatch(
    JSONData.getContributorsList()
  );
  if (contributorsError) {
    Notifications.add(
      Misc.createErrorMessage(contributorsError, "Failed to get contributors"),
      -1
    );
  }
  contributors = data;
}

async function fill(): Promise<void> {
  updateStatsAndHistogram();

  const supportersEl = document.querySelector(".pageAbout .supporters");
  let supportersHTML = "";
  for (const supporter of supporters ?? []) {
    supportersHTML += `<div>${supporter}</div>`;
  }
  if (supportersEl) {
    supportersEl.innerHTML = supportersHTML;
  }

  const contributorsEl = document.querySelector(".pageAbout .contributors");
  let contributorsHTML = "";
  for (const contributor of contributors ?? []) {
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

export const page = new CachedPage({
  id: "about",
  element: $(".page.pageAbout"),
  path: "/about",
  loadingOptions: {
    style: "bar",
    keyframes: [
      {
        percentage: 25,
        durationMs: 1000,
        text: "Downloading statistics",
      },
      {
        percentage: 50,
        durationMs: 1000,
        text: "Downloading contributors",
      },
      {
        percentage: 75,
        durationMs: 1000,
        text: "Downloading supporters",
      },
    ],
    waitFor: async () => {
      await Promise.all([
        getContributors(),
        getSupporters(),
        getSpeedHistogram(),
        getTypingStats(),
      ]);
    },
    shouldLoad: () => true,
    shouldRefreshAsync: () =>
      [
        contributors,
        supporters,
        speedHistogramResponseData,
        typingStatsResponseData,
      ].every((it) => it !== undefined && it !== null),
  },
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
