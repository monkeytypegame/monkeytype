import { getLatestReleaseFromGitHub } from "../utils/json-data";

const LOCALSTORAGE_KEY = "lastSeenVersion";

let version: null | string = null;
let isVersionNew: null | boolean = null;

function setMemory(v: string): void {
  window.localStorage.setItem(LOCALSTORAGE_KEY, v);
}

function getMemory(): string {
  return window.localStorage.getItem(LOCALSTORAGE_KEY) ?? "";
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
