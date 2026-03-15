import { Plugin, ViteDevServer, normalizePath } from "vite";
import { spawn, execSync, ChildProcess } from "child_process";
import { fileURLToPath } from "url";

export type OxlintCheckerOptions = {
  /** Debounce delay in milliseconds before running lint after file changes. @default 125 */
  debounceDelay?: number;
  /** Run type-aware checks (slower but more thorough). @default true */
  typeAware?: boolean;
  /** Show browser overlay with lint status. @default true */
  overlay?: boolean;
  /** File extensions to watch for changes. @default ['.ts', '.tsx', '.js', '.jsx'] */
  extensions?: string[];
};

type LintResult = {
  errorCount: number;
  warningCount: number;
  running: boolean;
  hadIssues: boolean;
  typeAware?: boolean;
};

const OXLINT_SUMMARY_REGEX = /Found (\d+) warnings? and (\d+) errors?/;

export function oxlintChecker(options: OxlintCheckerOptions = {}): Plugin {
  const {
    debounceDelay = 125,
    typeAware = true,
    overlay = true,
    extensions = [".ts", ".tsx", ".js", ".jsx"],
  } = options;

  let currentProcess: ChildProcess | null = null;
  let debounceTimer: NodeJS.Timeout | null = null;
  let server: ViteDevServer | null = null;
  let isProduction = false;
  let currentRunId = 0;
  let lastLintResult: LintResult = {
    errorCount: 0,
    warningCount: 0,
    running: false,
    hadIssues: false,
  };

  const killCurrentProcess = (): boolean => {
    if ((currentProcess && !currentProcess.killed) || currentProcess !== null) {
      currentProcess.kill();
      currentProcess = null;
      return true;
    }
    return false;
  };

  const clearDebounceTimer = (): void => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  };

  const parseLintOutput = (
    output: string,
  ): Pick<LintResult, "errorCount" | "warningCount"> => {
    const summaryMatch = OXLINT_SUMMARY_REGEX.exec(output);
    if (summaryMatch?.[1] !== undefined && summaryMatch?.[2] !== undefined) {
      return {
        warningCount: parseInt(summaryMatch[1], 10),
        errorCount: parseInt(summaryMatch[2], 10),
      };
    }
    return { errorCount: 0, warningCount: 0 };
  };

  const sendLintResult = (result: Partial<LintResult>): void => {
    const previousHadIssues = lastLintResult.hadIssues;

    const payload: LintResult = {
      errorCount: result.errorCount ?? lastLintResult.errorCount,
      warningCount: result.warningCount ?? lastLintResult.warningCount,
      running: result.running ?? false,
      hadIssues: previousHadIssues,
      typeAware: result.typeAware,
    };

    // Only update hadIssues when we have actual lint results (not just running status)
    if (result.running === false) {
      const currentHasIssues =
        (result.errorCount ?? 0) > 0 || (result.warningCount ?? 0) > 0;
      lastLintResult = { ...payload, hadIssues: currentHasIssues };
    } else {
      // Keep hadIssues unchanged when just updating running status
      lastLintResult = { ...payload, hadIssues: previousHadIssues };
    }

    if (server) {
      server.ws.send("vite-plugin-oxlint", payload);
    }
  };

  /**
   * Runs an oxlint process with the given arguments and captures its combined output.
   *
   * This function is responsible for managing the lifecycle of the current lint process:
   * - It spawns a new child process via `npx oxlint . ...args`.
   * - It assigns the spawned process to the shared {@link currentProcess} variable so that
   *   other parts of the plugin can cancel or track the active lint run.
   * - On process termination (either "error" or "close"), it clears {@link currentProcess}
   *   if it still refers to this child, avoiding interference with any newer process that
   *   may have started in the meantime.
   *
   * @param args Additional command-line arguments to pass to `oxlint`.
   * @returns A promise that resolves with the process exit code (or `null` if
   *          the process exited due to a signal) and the full stdout/stderr output
   *          produced by the lint run.
   */
  const runLintProcess = async (
    args: string[],
  ): Promise<{ code: number | null; output: string }> => {
    return new Promise((resolve) => {
      const childProcess = spawn("npx", ["oxlint", ".", ...args], {
        cwd: process.cwd(),
        shell: true,
        env: { ...process.env, FORCE_COLOR: "3" },
      });

      currentProcess = childProcess;
      let output = "";

      childProcess.stdout?.on("data", (data: Buffer) => {
        output += data.toString();
      });

      childProcess.stderr?.on("data", (data: Buffer) => {
        output += data.toString();
      });

      childProcess.on("error", (error: Error) => {
        output += `\nError: ${error.message}`;
        if (currentProcess === childProcess) {
          currentProcess = null;
        }
        resolve({ code: 1, output });
      });

      childProcess.on("close", (code: number | null) => {
        if (currentProcess === childProcess) {
          currentProcess = null;
        }
        resolve({ code, output });
      });
    });
  };

  const runOxlint = async (): Promise<void> => {
    const wasKilled = killCurrentProcess();
    const runId = ++currentRunId;

    console.log(
      wasKilled
        ? "\x1b[36mRunning oxlint...\x1b[0m \x1b[90m(killed previous process)\x1b[0m"
        : "\x1b[36mRunning oxlint...\x1b[0m",
    );

    sendLintResult({ running: true });

    // First pass: fast oxlint without type checking
    const { code, output } = await runLintProcess([]);

    // Check if we were superseded by a newer run
    if (runId !== currentRunId) {
      return;
    }

    if (output) {
      console.log(output);
    }

    // If first pass had errors, send them immediately (fast-fail)
    if (code !== 0) {
      const counts = parseLintOutput(output);
      if (counts.errorCount > 0 || counts.warningCount > 0) {
        sendLintResult({ ...counts, running: false });
        return;
      }
    }

    // Run type-aware check if enabled
    if (!typeAware) {
      sendLintResult({ errorCount: 0, warningCount: 0, running: false });
      return;
    }

    console.log("\x1b[36mRunning type-aware checks...\x1b[0m");
    sendLintResult({ running: true, typeAware: true });
    const typeResult = await runLintProcess(["--type-check", "--type-aware"]);

    // Check if we were superseded by a newer run
    if (runId !== currentRunId) {
      return;
    }

    if (typeResult.output) {
      console.log(typeResult.output);
    }

    const counts =
      typeResult.code !== 0
        ? parseLintOutput(typeResult.output)
        : { errorCount: 0, warningCount: 0 };
    sendLintResult({ ...counts, running: false });
  };

  const debouncedLint = (): void => {
    clearDebounceTimer();
    sendLintResult({ running: true });
    debounceTimer = setTimeout(() => void runOxlint(), debounceDelay);
  };

  return {
    name: "vite-plugin-oxlint-checker",

    config(_, { mode }) {
      isProduction = mode === "production";
    },

    configureServer(devServer: ViteDevServer) {
      server = devServer;

      // Send current lint status to new clients on connection
      devServer.ws.on("connection", () => {
        devServer.ws.send("vite-plugin-oxlint", lastLintResult);
      });

      // Run initial lint
      void runOxlint();

      // Listen for file changes
      devServer.watcher.on("change", (file: string) => {
        // Only lint on relevant file changes
        if (extensions.some((ext) => file.endsWith(ext))) {
          debouncedLint();
        }
      });
    },

    transformIndexHtml() {
      if (isProduction || !overlay) {
        return [];
      }

      // Inject import to the overlay module (actual .ts file processed by Vite)
      const overlayPath = normalizePath(
        fileURLToPath(new URL("./oxlint-overlay.ts", import.meta.url)),
      );
      return [
        {
          tag: "script",
          attrs: {
            type: "module",
            src: `/@fs${overlayPath}`,
          },
          injectTo: "body-prepend",
        },
      ];
    },

    buildStart() {
      // Only run during production builds, not dev server startup
      if (!isProduction) {
        return;
      }

      // Run oxlint synchronously during build
      console.log("\n\x1b[1mRunning oxlint...\x1b[0m");

      try {
        const commands = ["npx oxlint ."];
        if (typeAware) {
          commands.push("npx oxlint . --type-aware --type-check");
        }

        const output = execSync(commands.join(" && "), {
          cwd: process.cwd(),
          encoding: "utf-8",
          env: { ...process.env, FORCE_COLOR: "3" },
        });

        if (output) {
          console.log(output);
        }
        console.log(`  \x1b[32m✓ No linting issues found\x1b[0m\n`);
      } catch (error) {
        // execSync throws on non-zero exit code (linting errors found)
        if (error instanceof Error && "stdout" in error) {
          const execError = error as Error & {
            stdout?: string;
            stderr?: string;
          };
          if (execError.stdout !== undefined) console.log(execError.stdout);
          if (execError.stderr !== undefined) console.error(execError.stderr);
        }
        console.error("\n\x1b[31mBuild aborted due to linting errors\x1b[0m\n");
        process.exit(1);
      }
    },

    closeBundle() {
      // Cleanup on server close
      killCurrentProcess();
      clearDebounceTimer();
    },
  };
}
