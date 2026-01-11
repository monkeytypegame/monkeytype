import { z } from "zod";
import { getLatestReleaseFromGitHub } from "../utils/json-data";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";
import { tryCatch } from "@monkeytype/util/trycatch";
import { createErrorMessage } from "../utils/misc";
import { setVersion } from "../signals/core";

const memoryLS = new LocalStorageWithSchema({
  key: "lastSeenVersion",
  schema: z.string(),
  fallback: "",
});

function setMemory(v: string): void {
  memoryLS.set(v);
}

function getMemory(): string {
  return memoryLS.get();
}

function purgeCaches(): void {
  if (!("caches" in window)) return;
  void caches.keys().then(function (names) {
    for (const name of names) void caches.delete(name);
  });
}

async function fetchVersion(): Promise<void> {
  const { data: currentVersion, error } = await tryCatch(
    getLatestReleaseFromGitHub(),
  );

  if (error) {
    const msg = createErrorMessage(
      error,
      "Failed to fetch version number from GitHub",
    );
    console.error(msg);
    return;
  }

  const memoryVersion = getMemory();
  const isNew = memoryVersion === "" ? false : memoryVersion !== currentVersion;

  setVersion({
    text: currentVersion,
    isNew: isNew,
  });

  if (isNew || memoryVersion === "") {
    setMemory(currentVersion);
    purgeCaches();
  }
}

export async function initialize(): Promise<void> {
  await fetchVersion();
}
