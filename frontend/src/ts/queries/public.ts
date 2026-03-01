import { infiniteQueryOptions, queryOptions } from "@tanstack/solid-query";
import { intervalToDuration } from "date-fns";
import Ape from "../ape";
import {
  getContributorsList,
  getReleasesFromGitHub,
  getSupportersList,
} from "../utils/json-data";
import { getNumberWithMagnitude, numberWithSpaces } from "../utils/numbers";
import { baseKey } from "./utils/keys";
import { format as dateFormat } from "date-fns/format";

const queryKeys = {
  root: () => baseKey("public"),
  contributors: () => [...queryKeys.root(), "contributors"],
  supporters: () => [...queryKeys.root(), "supporters"],
  typingStats: () => [...queryKeys.root(), "typingStats"],
  speedHistogram: () => [...queryKeys.root(), "speedHistogram"],
  versionHistory: () => [...queryKeys.root(), "versionHistory"],
};

//cache results for one hour
const staleTime = 1000 * 60 * 60;

// oxlint-disable-next-line typescript/explicit-function-return-type
export const getContributorsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.contributors(),
    queryFn: getContributorsList,
    staleTime,
  });

// oxlint-disable-next-line typescript/explicit-function-return-type
export const getSupportersQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.supporters(),
    queryFn: getSupportersList,
    staleTime,
  });

// oxlint-disable-next-line typescript/explicit-function-return-type
export const getTypingStatsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.typingStats(),
    queryFn: fetchTypingStats,
    staleTime,
  });

// oxlint-disable-next-line typescript/explicit-function-return-type
export const getSpeedHistogramQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.speedHistogram(),
    queryFn: fetchSpeedHistogram,
    staleTime,
  });

// oxlint-disable-next-line typescript/explicit-function-return-type
export const getVersionHistoryQueryOptions = () =>
  infiniteQueryOptions({
    queryKey: queryKeys.versionHistory(),
    queryFn: fetchVersionHistory,
    staleTime,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 1,
  });

async function fetchSpeedHistogram(): Promise<
  | {
      labels: string[];
      data: { x: number; y: number }[];
    }
  | undefined
> {
  const response = await Ape.public.getSpeedHistogram({
    query: {
      language: "english",
      mode: "time",
      mode2: "60",
    },
  });

  if (response.status !== 200) {
    throw new Error(response.body.message);
  }

  const data = response.body.data;

  const histogramChartDataBucketed: {
    x: number;
    y: number;
    topPercentage?: string;
  }[] = [];
  const labels: string[] = [];
  const sum = Object.values(data).reduce((sum, it) => (sum += it), 0);
  let topPercentage = 100;

  const keys = Object.keys(data).sort(
    (a, b) => parseInt(a, 10) - parseInt(b, 10),
  );
  for (const [i, key] of keys.entries()) {
    const nextKey = keys[i + 1];
    const bucket = parseInt(key, 10);
    topPercentage -= ((data[bucket] as number) / sum) * 100;
    histogramChartDataBucketed.push({
      x: bucket,
      y: data[bucket] as number,
      topPercentage:
        topPercentage > 0.01 ? `top ${topPercentage.toFixed(2)}%` : undefined,
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

type GroupDisplay = {
  label: string;
  text: string;
  subText: string;
};

async function fetchTypingStats(): Promise<{
  timeTyping: GroupDisplay;
  testsStarted: GroupDisplay;
  testsCompleted: GroupDisplay;
}> {
  const response = await Ape.public.getTypingStats();

  if (response.status !== 200) {
    throw new Error(response.body.message);
  }
  const data = response.body.data;

  const typingSecondsRounded = Math.round(data.timeTyping);
  const typingDuration = intervalToDuration({
    start: 0,
    end: typingSecondsRounded * 1000,
  });
  const startedWithMagnitude = getNumberWithMagnitude(data.testsStarted);
  const completedWithMagnitude = getNumberWithMagnitude(data.testsCompleted);

  const result = {
    timeTyping: {
      label:
        numberWithSpaces(Math.round(typingSecondsRounded / 3600)) + " hours",
      text: typingDuration.years?.toString() ?? "",
      subText: "years",
    },
    testsStarted: {
      label: numberWithSpaces(data.testsStarted) + " tests",
      text:
        startedWithMagnitude.rounded < 10
          ? startedWithMagnitude.roundedTo2.toString()
          : startedWithMagnitude.rounded.toString(),
      subText: startedWithMagnitude.orderOfMagnitude,
    },
    testsCompleted: {
      label: numberWithSpaces(data.testsCompleted) + " tests",
      text:
        completedWithMagnitude.rounded < 10
          ? completedWithMagnitude.roundedTo2.toString()
          : completedWithMagnitude.rounded.toString(),
      subText: completedWithMagnitude.orderOfMagnitude,
    },
  };
  return result;
}

async function fetchVersionHistory(options: { pageParam: number }): Promise<{
  nextCursor: number | undefined;
  releases: { name: string; publishedAt: string; bodyHTML: string }[];
}> {
  const releases = await getReleasesFromGitHub({ page: options.pageParam });
  const data = [];
  for (const release of releases) {
    if (release.draft || release.prerelease) continue;

    let body = release.body;

    body = body.replace(/\r\n/g, "<br>");
    //replace ### title with h3 title h3
    body = body.replace(
      /### (.*?)<br>/g,
      '<h3 class="text-sub mb-2 text-xl">$1</h3>',
    );
    body = body.replace(/<\/h3><br>/gi, "</h3>");
    //remove - at the start of a line
    body = body.replace(/^- /gm, "");
    //replace **bold** with bold
    body = body.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
    //replace links with a tags
    body = body.replace(
      /\[(.*?)\]\((.*?)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    );

    data.push({
      name: release.name,
      publishedAt: dateFormat(new Date(release.published_at), "dd MMM yyyy"),
      bodyHTML: body,
    });
  }
  return {
    nextCursor: data.length > 0 ? options.pageParam + 1 : undefined,
    releases: data,
  };
}
