import { z } from "zod";
import { getLatestReleaseFromGitHub } from "../utils/json-data";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";
import { tryCatch } from "@monkeytype/util/trycatch";
import { createErrorMessage } from "../utils/misc";

const memoryLS = new LocalStorageWithSchema({
  key: "lastSeenVersion",
  schema: z.string(),
  fallback: "",
});

let version: null | string = null;
let isVersionNew: null | boolean = null;

function setMemory(v: string): void {
  memoryLS.set(v);
}

function getMemory(): string {
  return memoryLS.get();
}

async function check(): Promise<void> {
  const { data: currentVersion, error } = await tryCatch(
    getLatestReleaseFromGitHub()
  );

  if (error) {
    const msg = createErrorMessage(
      error,
      "Failed to fetch version number from GitHub"
    );
    console.error(msg);
    return;
  }

  const memoryVersion = getMemory();

  version = currentVersion;
  isVersionNew =
    memoryVersion === "" ? false : memoryVersion !== currentVersion;

  if (isVersionNew || memoryVersion === "") {
    setMemory(currentVersion);
    purgeCaches();
  }
}

function purgeCaches(): void {
  if (!("caches" in window)) return;
  void caches.keys().then(function (names) {
    for (const name of names) void caches.delete(name);
  });
}

export async function get(): Promise<{
  version: string;
  isNew: boolean;
}> {
  if (version === null || isVersionNew === null) {
    await check();
  }
  return {
    version: version as string,
    isNew: isVersionNew as boolean,
  };
}
