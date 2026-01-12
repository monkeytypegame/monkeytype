import { z } from "zod";
import { getLatestReleaseFromGitHub } from "./json-data";
import { LocalStorageWithSchema } from "./local-storage-with-schema";
import { tryCatch } from "@monkeytype/util/trycatch";
import { createErrorMessage } from "./misc";
import { setVersion } from "../signals/core";

const memoryLS = new LocalStorageWithSchema({
  key: "lastSeenVersion",
  schema: z.string(),
  fallback: "",
});

function purgeCaches(): void {
  if (!("caches" in window)) return;
  void caches.keys().then(function (names) {
    for (const name of names) void caches.delete(name);
  });
}

export async function fetchLatestVersion(): Promise<void> {
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

  const memoryVersion = memoryLS.get();
  const isNew = memoryVersion === "" ? false : memoryVersion !== currentVersion;

  setVersion({
    text: currentVersion,
    isNew: isNew,
  });

  if (isNew || memoryVersion === "") {
    memoryLS.set(currentVersion);
    purgeCaches();
  }
}
