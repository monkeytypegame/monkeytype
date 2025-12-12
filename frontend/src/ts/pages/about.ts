import * as Misc from "../utils/misc";
import * as JSONData from "../utils/json-data";
import Page from "./page";
import Ape from "../ape";
import * as Notifications from "../elements/notifications";
import * as ChartController from "../controllers/chart-controller";
import * as ConnectionState from "../states/connection";
import { intervalToDuration } from "date-fns/intervalToDuration";
import * as Skeleton from "../utils/skeleton";
import { TypingStats, SpeedHistogram } from "@monkeytype/schemas/public";
import { getNumberWithMagnitude, numberWithSpaces } from "../utils/numbers";
import { tryCatch } from "@monkeytype/util/trycatch";
import { qs, qsr } from "../utils/dom";

function reset(): void {
  qs(".pageAbout .contributors")?.empty();
  qs(".pageAbout .supporters")?.empty();

  ChartController.globalSpeedHistogram.getDataset("count").data = [];
  void ChartController.globalSpeedHistogram.updateColors();
}

let speedHistogramResponseData: SpeedHistogram | null;
let typingStatsResponseData: TypingStats | null;

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
  if (typingStatsResponseData) {
    const secondsRounded = Math.round(typingStatsResponseData.timeTyping);

    const timeTypingDuration = intervalToDuration({
      start: 0,
      end: secondsRounded * 1000,
    });

    qs(".pageAbout #totalTimeTypingStat .val")?.setText(
      timeTypingDuration.years?.toString() ?? "",
    );
    qs(".pageAbout #totalTimeTypingStat .valSmall")?.setText("years");
    qs(".pageAbout #totalTimeTypingStat")?.setAttribute(
      "aria-label",
      numberWithSpaces(Math.round(secondsRounded / 3600)) + " hours",
    );

    const startedWithMagnitude = getNumberWithMagnitude(
      typingStatsResponseData.testsStarted,
    );

    qs(".pageAbout #totalStartedTestsStat .val")?.setText(
      startedWithMagnitude.rounded < 10
        ? startedWithMagnitude.roundedTo2.toString()
        : startedWithMagnitude.rounded.toString(),
    );
    qs(".pageAbout #totalStartedTestsStat .valSmall")?.setText(
      startedWithMagnitude.orderOfMagnitude,
    );
    qs(".pageAbout #totalStartedTestsStat")?.setAttribute(
      "aria-label",
      numberWithSpaces(typingStatsResponseData.testsStarted) + " tests",
    );

    const completedWIthMagnitude = getNumberWithMagnitude(
      typingStatsResponseData.testsCompleted,
    );

    qs(".pageAbout #totalCompletedTestsStat .val")?.setText(
      completedWIthMagnitude.rounded < 10
        ? completedWIthMagnitude.roundedTo2.toString()
        : completedWIthMagnitude.rounded.toString(),
    );
    qs(".pageAbout #totalCompletedTestsStat .valSmall")?.setText(
      completedWIthMagnitude.orderOfMagnitude,
    );
    qs(".pageAbout #totalCompletedTestsStat")?.setAttribute(
      "aria-label",
      numberWithSpaces(typingStatsResponseData.testsCompleted) + " tests",
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
      -1,
    );
  }
  const typingStats = await Ape.public.getTypingStats();
  if (typingStats.status === 200) {
    typingStatsResponseData = typingStats.body.data;
  } else {
    Notifications.add(
      `Failed to get global typing stats: ${speedStats.body.message}`,
      -1,
    );
  }
}

async function fill(): Promise<void> {
  const { data: supporters, error: supportersError } = await tryCatch(
    JSONData.getSupportersList(),
  );
  if (supportersError) {
    Notifications.add(
      Misc.createErrorMessage(supportersError, "Failed to get supporters"),
      -1,
    );
  }

  const { data: contributors, error: contributorsError } = await tryCatch(
    JSONData.getContributorsList(),
  );
  if (contributorsError) {
    Notifications.add(
      Misc.createErrorMessage(contributorsError, "Failed to get contributors"),
      -1,
    );
  }

  void getStatsAndHistogramData().then(() => {
    updateStatsAndHistogram();
  });

  const supportersEl = document.querySelector(".pageAbout .supporters");
  let supportersHTML = "";
  for (const supporter of supporters ?? []) {
    supportersHTML += `<div>${Misc.escapeHTML(supporter)}</div>`;
  }
  if (supportersEl) {
    supportersEl.innerHTML = supportersHTML;
  }

  const contributorsEl = document.querySelector(".pageAbout .contributors");
  let contributorsHTML = "";
  for (const contributor of contributors ?? []) {
    contributorsHTML += `<div>${Misc.escapeHTML(contributor)}</div>`;
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

document.addEventListener("DOMContentLoaded", () => {
  Skeleton.save("pageAbout");
});
