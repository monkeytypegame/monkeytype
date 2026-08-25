import { GetUserResponse } from "@monkeytype/contracts/users";
import Ape from ".";
import { createEffectOn } from "../hooks/effects";
import { isAuthenticated } from "../states/core";
import { SnapshotInitError } from "../utils/snapshot-init-error";

type CacheType = GetUserResponse["data"];

let fetchPromise: Promise<void> | null = null;
let cache: CacheType | undefined = undefined;

export async function fetchUserFromApi(): Promise<CacheType | undefined> {
  await sync();
  return cache;
}

async function sync(): Promise<void> {
  if (!isAuthenticated()) {
    return;
  }

  if (cache !== undefined) return;

  fetchPromise ??= (async () => {
    const response = await Ape.users.get();

    if (response.status !== 200) {
      throw new SnapshotInitError(
        `${response.body.message} (user)`,
        response.status,
      );
    }

    cache = response.body.data;
  })();

  try {
    await fetchPromise;
  } finally {
    fetchPromise = null;
  }
}

function reset(): void {
  cache = undefined;
  fetchPromise = null;
}

// clear cache + reset promise on logout
createEffectOn(isAuthenticated, (isAuthenticated) => {
  if (!isAuthenticated) {
    reset();
  }
});
