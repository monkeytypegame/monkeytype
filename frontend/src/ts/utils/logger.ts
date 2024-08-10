import { z } from "zod";
import { LocalStorageWithSchema } from "./local-storage-with-schema";
import { isDevEnvironment } from "./misc";

const nativeLog = console.log;
const nativeWarn = console.warn;
const nativeError = console.error;

const debugLogsLS = new LocalStorageWithSchema("debugLogs", z.boolean());

let debugLogs = debugLogsLS.get() ?? false;

if (isDevEnvironment()) {
  debugLogs = true;
  debug("Debug logs automatically enabled on localhost");
}

export function toggleDebugLogs(): void {
  debugLogs = !debugLogs;
  info(`Debug logs ${debugLogs ? "enabled" : "disabled"}`);
  debugLogsLS.set(debugLogs);
}

function info(...args: unknown[]): void {
  nativeLog(
    "%cINFO",
    "background:#4CAF50;color: #111;padding:0 5px;border-radius:10px",
    ...args
  );
}

function warn(...args: unknown[]): void {
  nativeWarn(
    "%cWRN",
    "background:#FFC107;color: #111;padding:0 5px;border-radius:10px",
    ...args
  );
}

function error(...args: unknown[]): void {
  nativeError(
    "%cERR",
    "background:#F44336;color: #111;padding:0 5px;border-radius:10px",
    ...args
  );
}

function debug(...args: unknown[]): void {
  if (!debugLogs) return;
  nativeLog(
    "%cDEBG",
    "background:#2196F3;color: #111;padding:0 5px;border-radius:10px",
    ...args
  );
}

console.log = info;
console.warn = warn;
console.error = error;
console.debug = debug;
