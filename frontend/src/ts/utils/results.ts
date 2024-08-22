import Ape from "../ape";
import * as Notifications from "../elements/notifications";
import * as DB from "../db";
import * as TestLogic from "../test/test-logic";

export async function syncNotSignedInLastResult(uid: string): Promise<void> {
  const notSignedInLastResult = TestLogic.notSignedInLastResult;
  if (notSignedInLastResult === null) return;
  TestLogic.setNotSignedInUid(uid);

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

  const result: MonkeyTypes.FullResult<Mode> = JSON.parse(
    JSON.stringify(notSignedInLastResult)
  );
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
