import { z } from "zod";
import { getLatestReleaseFromGitHub } from "../utils/json-data";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";

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
  const currentVersion = await getLatestReleaseFromGitHub();
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
