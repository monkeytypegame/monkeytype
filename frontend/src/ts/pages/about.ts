import * as Misc from "../utils/misc";
import Page from "./page";
import Ape from "../ape";
import * as Notifications from "../elements/notifications";
import * as ChartController from "../controllers/chart-controller";
import * as ConnectionState from "../states/connection";

type TierPlacement = {
  value: number | "-";
  unit: string;
};

type TierList = {
  [key: string]: number;
};

function reset(): void {
  $(".pageAbout .contributors").empty();
  $(".pageAbout .supporters").empty();
  ChartController.globalSpeedHistogram.data.datasets[0].data = [];
  ChartController.globalSpeedHistogram.updateColors();
}

let speedStatsResponseData: any | undefined;
let typingStatsResponseData: any | undefined;

function updateStatsAndHistogram(): void {
  if (!speedStatsResponseData && !typingStatsResponseData) {
    return;
  }
  ChartController.globalSpeedHistogram.updateColors();
  const bucketedSpeedStats = getHistogramDataBucketed(speedStatsResponseData);
  ChartController.globalSpeedHistogram.data.labels = bucketedSpeedStats.labels;
  ChartController.globalSpeedHistogram.data.datasets[0].data =
    bucketedSpeedStats.data;

  const secondsRounded = Math.round(typingStatsResponseData.timeTyping);

  const timeTypingDuration = getTimeWithAppropriateUnits(secondsRounded);
  const testStartedCount = getAppropriateSizeAndSuffixForNumber(
    typingStatsResponseData.testsStarted
  );
  const testCompleteCount = getAppropriateSizeAndSuffixForNumber(
    typingStatsResponseData.testsCompleted
  );

  $(".pageAbout #totalTimeTypingStat .val").text(
    timeTypingDuration.value.toString() ?? ""
  );
  $(".pageAbout #totalTimeTypingStat .valSmall").text(timeTypingDuration.unit);
  $(".pageAbout #totalTimeTypingStat").attr(
    "aria-label",
    `${timeTypingDuration.value} ${timeTypingDuration.unit}`
  );

  $(".pageAbout #totalStartedTestsStat .val").text(testStartedCount.value);
  $(".pageAbout #totalStartedTestsStat .valSmall").text(testStartedCount.unit);
  $(".pageAbout #totalStartedTestsStat").attr(
    "aria-label",
    `${testStartedCount.value} ${testStartedCount.unit}`
  );

  $(".pageAbout #totalCompletedTestsStat .val").text(testCompleteCount.value);
  $(".pageAbout #totalCompletedTestsStat .valSmall").text(
    testCompleteCount.unit
  );
  $(".pageAbout #totalCompletedTestsStat").attr(
    "aria-label",
    `${testCompleteCount.value} ${testCompleteCount.unit}`
  );
}

async function getStatsAndHistogramData(): Promise<void> {
  if (speedStatsResponseData && typingStatsResponseData) {
    return;
  }

  if (!ConnectionState.get()) {
    Notifications.add("Cannot update all time stats - offline", 0);
    return;
  }

  const speedStats = await Ape.publicStats.getSpeedHistogram({
    language: "english",
    mode: "time",
    mode2: "60",
  });
  if (speedStats.status >= 200 && speedStats.status < 300) {
    speedStatsResponseData = speedStats.data;
  } else {
    Notifications.add(
      `Failed to get global speed stats for histogram: ${speedStats.message}`,
      -1
    );
  }
  const typingStats = await Ape.publicStats.getTypingStats();
  if (typingStats.status >= 200 && typingStats.status < 300) {
    typingStatsResponseData = typingStats.data;
  } else {
    Notifications.add(
      `Failed to get global typing stats: ${speedStats.message}`,
      -1
    );
  }
}

async function fill(): Promise<void> {
  let supporters: string[];
  try {
    supporters = await Misc.getSupportersList();
  } catch (e) {
    Notifications.add(
      Misc.createErrorMessage(e, "Failed to get supporters"),
      -1
    );
    supporters = [];
  }

  let contributors: string[];
  try {
    contributors = await Misc.getContributorsList();
  } catch (e) {
    Notifications.add(
      Misc.createErrorMessage(e, "Failed to get contributors"),
      -1
    );
    contributors = [];
  }

  await getStatsAndHistogramData();
  updateStatsAndHistogram();

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
function getHistogramDataBucketed(data: Record<string, number>): {
  data: { x: number; y: number }[];
  labels: string[];
} {
  const histogramChartDataBucketed: { x: number; y: number }[] = [];
  const labels: string[] = [];

  const keys = Object.keys(data).sort(
    (a, b) => parseInt(a, 10) - parseInt(b, 10)
  );
  for (let i = 0; i < keys.length; i++) {
    const bucket = parseInt(keys[i], 10);
    histogramChartDataBucketed.push({
      x: bucket,
      y: data[bucket],
    });
    labels.push(`${bucket} - ${bucket + 9}`);
    if (bucket + 10 != parseInt(keys[i + 1], 10)) {
      for (let j = bucket + 10; j < parseInt(keys[i + 1], 10); j += 10) {
        histogramChartDataBucketed.push({ x: j, y: 0 });
        labels.push(`${j} - ${j + 9}`);
      }
    }
  }
  return { data: histogramChartDataBucketed, labels };
}

function findTierInList(value: number, list: TierList): TierPlacement {
  for (const [unit, condition] of Object.entries(list)) {
    if (value >= condition) {
      return {
        value: Math.round(value / condition),
        unit,
      };
    }
  }

  return {
    value: "-",
    unit: "-",
  };
}

function getTimeWithAppropriateUnits(timeInSeconds: number): TierPlacement {
  const timeDictionary: TierList = {
    years: 29030400,
    months: 2419200,
    days: 86400,
    hours: 3600,
    minutes: 60,
    minute: timeInSeconds,
  };
  return findTierInList(timeInSeconds, timeDictionary);
}

function getAppropriateSizeAndSuffixForNumber(num: number): TierPlacement {
  const SIPrefixDictionary: TierList = {
    million: 1_000_000,
    thousand: 1_000,
    hundred: 100,
    "": 1,
  };
  return findTierInList(num, SIPrefixDictionary);
}
