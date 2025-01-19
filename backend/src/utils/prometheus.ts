import "dotenv/config";
import { Counter, Histogram, Gauge } from "prom-client";
import { CompletedEvent } from "@monkeytype/contracts/schemas/results";
import { Request } from "express";

const auth = new Counter({
  name: "api_request_auth_total",
  help: "Counts authentication events",
  labelNames: ["type"],
});

const result = new Counter({
  name: "result_saved_total",
  help: "Counts result saves",
  labelNames: [
    "mode",
    "mode2",
    "isPb",
    "blindMode",
    "lazyMode",
    "difficulty",
    "numbers",
    "punctuation",
  ],
});

const dailyLb = new Counter({
  name: "daily_leaderboard_update_total",
  help: "Counts daily leaderboard updates",
  labelNames: ["mode", "mode2", "language"],
});

const resultLanguage = new Counter({
  name: "result_language_total",
  help: "Counts result langauge",
  labelNames: ["language"],
});

const resultFunbox = new Counter({
  name: "result_funbox_total",
  help: "Counts result funbox",
  labelNames: ["funbox"],
});

const resultWpm = new Histogram({
  name: "result_wpm",
  help: "Result wpm",
  labelNames: ["mode", "mode2"],
  buckets: [
    10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170,
    180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290,
  ],
});

const resultAcc = new Histogram({
  name: "result_acc",
  help: "Result accuracy",
  labelNames: ["mode", "mode2"],
  buckets: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
});

const resultDuration = new Histogram({
  name: "result_duration",
  help: "Result duration",
  buckets: [
    5, 10, 15, 30, 45, 60, 90, 120, 250, 500, 750, 1000, 1250, 1500, 1750, 2000,
    2500, 3000,
  ],
});

const leaderboardUpdate = new Gauge({
  name: "leaderboard_update_seconds",
  help: "Leaderboard update time",
  labelNames: ["language", "mode", "mode2", "step"],
});

export function incrementAuth(
  type: "Bearer" | "ApeKey" | "None" | "GithubWebhook"
): void {
  auth.inc({ type });
}

export function setLeaderboard(
  language: string,
  mode: string,
  mode2: string,
  times: [number, number, number, number]
): void {
  leaderboardUpdate.set({ language, mode, mode2, step: "aggregate" }, times[0]);
  leaderboardUpdate.set({ language, mode, mode2, step: "loop" }, times[1]);
  leaderboardUpdate.set({ language, mode, mode2, step: "insert" }, times[2]);
  leaderboardUpdate.set({ language, mode, mode2, step: "index" }, times[3]);
}

export function incrementResult(res: CompletedEvent, isPb?: boolean): void {
  const {
    mode,
    mode2,
    blindMode,
    lazyMode,
    difficulty,
    funbox,
    language,
    numbers,
    punctuation,
  } = res;

  let m2 = mode2;
  if (mode === "time" && !["15", "30", "60", "120"].includes(mode2)) {
    m2 = "custom";
  }
  if (mode === "words" && !["10", "25", "50", "100"].includes(mode2)) {
    m2 = "custom";
  }
  if (mode === "quote" || mode === "zen" || mode === "custom") m2 = mode;

  result.inc({
    mode,
    mode2: m2,
    isPb: isPb ? "true" : "false",
    blindMode: blindMode ? "true" : "false",
    lazyMode: lazyMode ? "true" : "false",
    difficulty: difficulty || "normal",
    numbers: numbers ? "true" : "false",
    punctuation: punctuation ? "true" : "false",
  });

  resultLanguage.inc({
    language: language || "english",
  });

  resultFunbox.inc({
    funbox: funbox || "none",
  });

  resultWpm.observe(
    {
      mode,
      mode2: m2,
    },
    res.wpm
  );

  resultAcc.observe(
    {
      mode,
      mode2: m2,
    },
    res.acc
  );

  resultDuration.observe(res.testDuration);
}

export function incrementDailyLeaderboard(
  mode: string,
  mode2: string,
  language: string
): void {
  dailyLb.inc({ mode, mode2, language });
}

const clientVersionsCounter = new Counter({
  name: "api_client_versions",
  help: "Records frequency of client versions",
  labelNames: ["version"],
});

export function recordClientVersion(version: string): void {
  clientVersionsCounter.inc({ version });
}

const serverVersionCounter = new Counter({
  name: "api_server_version",
  help: "The server's current version",
  labelNames: ["version"],
});

export function recordServerVersion(serverVersion: string): void {
  serverVersionCounter.inc({ version: serverVersion });
}

const clientErrorByVersion = new Counter({
  name: "api_client_error_by_version",
  help: "Client versions which are experiencing 400 errors",
  labelNames: ["version"],
});

export function recordClientErrorByVersion(version: string): void {
  clientErrorByVersion.inc({ version });
}

const serverErrorByVersion = new Counter({
  name: "api_server_error_by_version",
  help: "Server versions which are generating 500 errors",
  labelNames: ["version"],
});

export function recordServerErrorByVersion(version: string): void {
  serverErrorByVersion.inc({ version });
}

const authTime = new Histogram({
  name: "api_request_auth_time",
  help: "Time spent authenticating",
  labelNames: ["type", "status", "path"],
  buckets: [
    100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1500, 2000, 2500, 3000,
  ],
});

export function recordAuthTime(
  type: string,
  status: "success" | "failure",
  time: number,
  req: Request
): void {
  // for some reason route is not in the types
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const reqPath = req.baseUrl + req.route.path;

  let normalizedPath = "/";
  if (reqPath !== "/") {
    normalizedPath = reqPath.endsWith("/") ? reqPath.slice(0, -1) : reqPath;
  }

  const pathNoGet = normalizedPath.replace(/\?.*/, "");

  authTime.observe({ type, status, path: pathNoGet }, time);
}

const requestCountry = new Counter({
  name: "api_request_country",
  help: "Country of request",
  labelNames: ["path", "country"],
});

export function recordRequestCountry(country: string, req: Request): void {
  // for some reason route is not in the types
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const reqPath = req.baseUrl + req.route.path;

  let normalizedPath = "/";
  if (reqPath !== "/") {
    normalizedPath = reqPath.endsWith("/") ? reqPath.slice(0, -1) : reqPath;
  }

  const pathNoGet = normalizedPath.replace(/\?.*/, "");

  requestCountry.inc({ path: pathNoGet, country });
}

const tokenCacheAccess = new Counter({
  name: "api_token_cache_access",
  help: "Token cache access",
  labelNames: ["status"],
});

export function recordTokenCacheAccess(
  status: "hit" | "miss" | "hit_expired"
): void {
  tokenCacheAccess.inc({ status });
}

const tokenCacheSize = new Gauge({
  name: "api_token_cache_size",
  help: "Token cache size",
});

export function setTokenCacheSize(size: number): void {
  tokenCacheSize.set(size);
}

const tokenCacheLength = new Gauge({
  name: "api_token_cache_length",
  help: "Token cache length",
});

export function setTokenCacheLength(length: number): void {
  tokenCacheLength.set(length);
}

const uidRequestCount = new Counter({
  name: "user_request_count",
  help: "Request count per uid",
  labelNames: ["uid"],
});

export function recordRequestForUid(uid: string): void {
  uidRequestCount.inc({ uid });
}

const collectionSize = new Gauge({
  name: "db_collection_size",
  help: "Size of a collection",
  labelNames: ["collection"],
});

export function setCollectionSize(collection: string, size: number): void {
  collectionSize.set({ collection }, size);
}

const queueLength = new Gauge({
  name: "queue_length",
  help: "Length of the queues",
  labelNames: ["queueName", "countType"],
});

export function setQueueLength(
  queueName: string,
  countType: string,
  length: number
): void {
  queueLength.set({ queueName, countType }, length);
}

const emailCount = new Counter({
  name: "email_count",
  help: "Emails sent by the server",
  labelNames: ["type", "status"],
});

export function recordEmail(type: string, status: string): void {
  emailCount.inc({ type, status });
}

const timeToCompleteJobTotal = new Counter({
  name: "time_to_complete_job_total",
  help: "Time to complete a job total",
  labelNames: ["queueName", "jobName"],
});

const timeToCompleteJobCount = new Counter({
  name: "time_to_complete_job_count",
  help: "Time to complete a job count",
  labelNames: ["queueName", "jobName"],
});

export function recordTimeToCompleteJob(
  queueName: string,
  jobName: string,
  time: number
): void {
  timeToCompleteJobTotal.inc({ queueName, jobName }, time);
  timeToCompleteJobCount.inc({ queueName, jobName });
}
