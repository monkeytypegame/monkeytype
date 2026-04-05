/**
 * Local browser benchmark for the LLM funbox generation path.
 *
 * Examples:
 * - pnpm benchmark:llm
 * - pnpm benchmark:llm -- --headless --words 200 --window 5
 * - pnpm benchmark:llm -- --url http://127.0.0.1:3000
 */

import path from "node:path";
import process from "node:process";
import { spawn, type ChildProcess } from "node:child_process";
import { chromium } from "playwright";
import type {
  BrowserLlmBenchmarkOptions,
  BrowserLlmBenchmarkResult,
} from "../src/ts/test/llm/browser-benchmark";

type CliOptions = {
  baseUrl: string | null;
  port: number | null;
  languageFile: string | undefined;
  wordsToConsume: number | undefined;
  contextWindowSize: number | undefined;
  clearRuntimeCache: boolean;
  headless: boolean;
};

type DevServerHandle = {
  process: ChildProcess;
  output: string[];
  baseUrl: string;
};

const FRONTEND_ROOT = path.resolve(import.meta.dirname, "..");
const BROWSER_BENCHMARK_MODULE_PATH = "/ts/test/llm/browser-benchmark.ts";
const DEFAULT_PORT = 4173;
const SERVER_START_TIMEOUT_MS = 60_000;
const SERVER_STOP_TIMEOUT_MS = 5_000;
const SERVER_OUTPUT_LIMIT = 200;

async function main(): Promise<void> {
  const cliOptions = parseCliOptions(process.argv.slice(2));
  const benchmarkOptions: BrowserLlmBenchmarkOptions = {
    languageFile: cliOptions.languageFile,
    wordsToConsume: cliOptions.wordsToConsume,
    contextWindowSize: cliOptions.contextWindowSize,
    clearRuntimeCache: cliOptions.clearRuntimeCache,
  };

  let serverHandle: DevServerHandle | null = null;
  let browserClosed = false;
  const browser = await chromium.launch({
    headless: cliOptions.headless,
    args: ["--enable-unsafe-webgpu"],
  });

  try {
    if (cliOptions.baseUrl === null) {
      serverHandle = await startDevServer(cliOptions.port);
    }

    const baseUrl = cliOptions.baseUrl ?? serverHandle?.baseUrl;

    if (baseUrl === undefined) {
      throw new Error("Unable to determine benchmark base URL");
    }

    const page = await browser.newPage();
    const benchmarkPageUrl = new URL("/404.html", normalizeBaseUrl(baseUrl));

    await page.goto(benchmarkPageUrl.toString(), {
      waitUntil: "domcontentloaded",
    });

    const benchmarkResult = await page.evaluate(
      async ({ modulePath, options }) => {
        const benchmarkModule = (await import(modulePath)) as {
          runLlmBrowserBenchmark(
            benchmarkOptions: BrowserLlmBenchmarkOptions,
          ): Promise<BrowserLlmBenchmarkResult>;
        };

        return await benchmarkModule.runLlmBrowserBenchmark(options);
      },
      {
        modulePath: BROWSER_BENCHMARK_MODULE_PATH,
        options: benchmarkOptions,
      },
    );
    const userAgent = await page.evaluate(() => navigator.userAgent);

    console.log(
      JSON.stringify(
        {
          browser: {
            name: "chromium",
            version: browser.version(),
            headless: cliOptions.headless,
            userAgent,
          },
          pageUrl: benchmarkPageUrl.toString(),
          options: benchmarkOptions,
          result: benchmarkResult,
        },
        null,
        2,
      ),
    );

    await browser.close();
    browserClosed = true;
  } finally {
    if (!browserClosed) {
      await browser.close();
    }

    await stopDevServer(serverHandle);
  }
}

function parseCliOptions(args: string[]): CliOptions {
  const options: CliOptions = {
    baseUrl: null,
    port: null,
    languageFile: undefined,
    wordsToConsume: undefined,
    contextWindowSize: undefined,
    clearRuntimeCache: false,
    headless: false,
  };

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];

    if (arg === "--") {
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printUsageAndExit(0);
    }

    switch (arg) {
      case "--url":
        options.baseUrl = requireStringArg(args, ++index, arg);
        break;
      case "--port":
        options.port = requireNumberArg(args, ++index, arg);
        break;
      case "--language":
        options.languageFile = requireStringArg(args, ++index, arg);
        break;
      case "--words":
        options.wordsToConsume = requireNumberArg(args, ++index, arg);
        break;
      case "--window":
        options.contextWindowSize = requireNumberArg(args, ++index, arg);
        break;
      case "--clear-cache":
        options.clearRuntimeCache = true;
        break;
      case "--headless":
        options.headless = true;
        break;
      default:
        throw new Error(`Unknown benchmark option: ${arg}`);
    }
  }

  return options;
}

function requireStringArg(args: string[], index: number, flag: string): string {
  const value = args[index];

  if (value === undefined || value.startsWith("--")) {
    throw new Error(`Missing value for ${flag}`);
  }

  return value;
}

function requireNumberArg(args: string[], index: number, flag: string): number {
  const value = requireStringArg(args, index, flag);
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric value for ${flag}: ${value}`);
  }

  return parsed;
}

async function startDevServer(port: number | null): Promise<DevServerHandle> {
  const requestedPort = port ?? DEFAULT_PORT;
  const serverProcess = spawn(
    resolvePnpmCommand(),
    [
      "exec",
      "vite",
      "dev",
      "--host",
      "127.0.0.1",
      "--port",
      String(requestedPort),
      ...(port === null ? [] : ["--strictPort"]),
    ],
    {
      cwd: FRONTEND_ROOT,
      env: {
        ...process.env,
        SERVER_OPEN: "false",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  const output: string[] = [];

  if (serverProcess.stdout === null || serverProcess.stderr === null) {
    throw new Error("Vite dev server output streams are unavailable");
  }

  collectProcessOutput(serverProcess.stdout, output);
  collectProcessOutput(serverProcess.stderr, output);

  const resolvedBaseUrl = await waitForServerReady(
    port === null ? null : `http://127.0.0.1:${requestedPort}`,
    serverProcess,
    output,
  );

  return { process: serverProcess, output, baseUrl: resolvedBaseUrl };
}

function collectProcessOutput(
  stream: NodeJS.ReadableStream,
  output: string[],
): void {
  stream.on("data", (chunk: Buffer | string) => {
    output.push(String(chunk));

    if (output.length > SERVER_OUTPUT_LIMIT) {
      output.splice(0, output.length - SERVER_OUTPUT_LIMIT);
    }
  });
}

async function waitForServerReady(
  preferredBaseUrl: string | null,
  serverProcess: ChildProcess,
  output: string[],
): Promise<string> {
  const deadline = Date.now() + SERVER_START_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (serverProcess.exitCode !== null) {
      throw new Error(
        `Vite dev server exited before the benchmark started.\n${output.join("")}`,
      );
    }

    const detectedBaseUrl = preferredBaseUrl ?? detectViteBaseUrl(output);

    if (detectedBaseUrl === null) {
      await delay(250);
      continue;
    }

    const benchmarkModuleUrl = new URL(
      BROWSER_BENCHMARK_MODULE_PATH,
      normalizeBaseUrl(detectedBaseUrl),
    ).toString();

    try {
      const response = await fetch(benchmarkModuleUrl);

      if (
        response.ok &&
        (response.headers.get("content-type")?.includes("javascript") ?? false)
      ) {
        return normalizeBaseUrl(detectedBaseUrl);
      }
    } catch {
      // keep polling until the dev server is ready
    }

    await delay(250);
  }

  throw new Error(
    `Timed out waiting for the benchmark dev server.\n${output.join("")}`,
  );
}

function detectViteBaseUrl(output: string[]): string | null {
  const combinedOutput = output.join("");
  const match = /https?:\/\/(?:127\.0\.0\.1|localhost):\d+\//.exec(
    combinedOutput,
  );

  return match?.[0] ?? null;
}

async function stopDevServer(
  serverHandle: DevServerHandle | null,
): Promise<void> {
  if (serverHandle === null) {
    return;
  }

  const serverProcess = serverHandle.process;

  if (serverProcess.exitCode !== null) {
    return;
  }

  serverProcess.kill("SIGTERM");

  const exited = await Promise.race([
    new Promise<boolean>((resolve) => {
      serverProcess.once("exit", () => resolve(true));
    }),
    delay(SERVER_STOP_TIMEOUT_MS).then(() => false),
  ]);

  if (!exited && serverProcess.exitCode === null) {
    serverProcess.kill("SIGKILL");
  }
}

function resolvePnpmCommand(): string {
  return process.platform === "win32" ? "pnpm.cmd" : "pnpm";
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function printUsageAndExit(exitCode: number): never {
  console.log(`Usage: pnpm benchmark:llm -- [options]

Options:
  --url <url>         Use an existing frontend server instead of starting Vite
  --port <port>       Port for the temporary Vite dev server (default: ${DEFAULT_PORT})
  --language <file>   Language file to benchmark (default: english_5k.json)
  --words <count>     Number of generated words to consume (default: 100)
  --window <count>    Context window size override (default: 5)
  --clear-cache       Clear the shared WebGPT runtime before benchmarking
  --headless          Run Chromium without opening a visible window
  -h, --help          Show this help message
`);
  process.exit(exitCode);
}

void main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? (error.stack ?? error.message) : String(error),
  );
  process.exit(1);
});
