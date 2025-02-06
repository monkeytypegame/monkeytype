import Ape from "../ape";
import * as Notifications from "../elements/notifications";
import * as DB from "../db";
import * as TestLogic from "../test/test-logic";
import { deepClone } from "./misc";
import { Mode } from "@monkeytype/contracts/schemas/shared";

export async function syncNotSignedInLastResult(uid: string): Promise<void> {
  const notSignedInLastResult = TestLogic.notSignedInLastResult;
  if (notSignedInLastResult === null) return;
  TestLogic.setNotSignedInUidAndHash(uid);

  const response = await Ape.results.add({
    body: { result: notSignedInLastResult },
  });
  if (response.status !== 200) {
    Notifications.add(
      "Failed to save last result: " + response.body.message,
      -1
    );
    return;
  }

  //TODO - this type cast was not needed before because we were using JSON cloning
  // but now with the stronger types it shows that we are forcing completed event
  // into a snapshot result - might not cuase issues but worth investigating
  const result = deepClone(
    notSignedInLastResult
  ) as unknown as DB.SnapshotResult<Mode>;
  result._id = response.body.data.insertedId;
  if (response.body.data.isPb) {
    result.isPb = true;
  }
  DB.saveLocalResult(result);
  DB.updateLocalStats(
    1,
    result.testDuration + result.incompleteTestSeconds - result.afkDuration
  );
  TestLogic.clearNotSignedInResult();
  Notifications.add(
    `Last test result saved ${response.body.data.isPb ? `(new pb!)` : ""}`,
    1
  );
}
