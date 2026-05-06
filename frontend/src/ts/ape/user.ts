import { GetUserResponse } from "@monkeytype/contracts/users";
import Ape from ".";
import { createEffectOn } from "../hooks/effects";
import { isAuthenticated } from "../states/core";
import { promiseWithResolvers } from "../utils/misc";
import { SnapshotInitError } from "../utils/snapshot-init-error";

type CacheType = GetUserResponse["data"];
let userPromiseBox = promiseWithResolvers<CacheType | undefined>();

export async function getUserPromise(): Promise<CacheType | undefined> {
  return userPromiseBox.promise;
}

let cache: CacheType | undefined = undefined;

export async function fetchUserFromApi(): Promise<CacheType | undefined> {
  await sync();
  return cache;
}

async function sync(): Promise<void> {
  if (!isAuthenticated()) {
    cache = undefined;
    userPromiseBox.resolve(undefined);
    return;
  }

  if (cache !== undefined) return;

  const response = await Ape.users.get();
  if (response.status !== 200) {
    userPromiseBox.reject();
    throw new SnapshotInitError(
      `${response.body.message} (user)`,
      response.status,
    );
  }

  cache = response.body.data;
  userPromiseBox.resolve(cache);
}

// clear cache + reset promise on logout
createEffectOn(isAuthenticated, (isAuthenticated) => {
  if (!isAuthenticated) {
    cache = undefined;

    userPromiseBox = promiseWithResolvers<CacheType | undefined>();
  }
});
