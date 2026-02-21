import Ape from "../ape";
import * as Notifications from "../elements/notifications";
import * as DB from "../db";
import * as TestLogic from "../test/test-logic";
import { Mode } from "@monkeytype/schemas/shared";
import { SnapshotResult } from "../constants/default-snapshot";

export async function syncNotSignedInLastResult(uid: string): Promise<void> {
  const notSignedInLastResult = TestLogic.notSignedInLastResult;
  if (notSignedInLastResult === null) return;
  TestLogic.setNotSignedInUidAndHash(uid);

  const response = await Ape.results.add({
    body: { result: notSignedInLastResult },
  });
  if (response.status !== 200) {
    Notifications.add("Failed to save last result", -1, { response });
    return;
  }

  //TODO - this type cast was not needed before because we were using JSON cloning
  // but now with the stronger types it shows that we are forcing completed event
  // into a snapshot result - might not cause issues but worth investigating
  const result = structuredClone(
    notSignedInLastResult,
  ) as unknown as SnapshotResult<Mode>;

  const dataToSave: DB.SaveLocalResultData = {
    xp: response.body.data.xp,
    streak: response.body.data.streak,
    result,
    isPb: response.body.data.isPb,
  };

  result._id = response.body.data.insertedId;
  if (response.body.data.isPb) {
    result.isPb = true;
  }
  DB.saveLocalResult(dataToSave);
  TestLogic.clearNotSignedInResult();
  Notifications.add(
    `Last test result saved ${response.body.data.isPb ? `(new pb!)` : ""}`,
    1,
  );
}
