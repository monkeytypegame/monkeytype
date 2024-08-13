import Ape from "../ape";
import * as DB from "../db";
import * as TestLogic from "../test/test-logic";

export async function syncNotSignedInLastResult(uid: string): Promise<void> {
  const notSignedInLastResult = TestLogic.notSignedInLastResult;
  if (notSignedInLastResult === null) return Promise.resolve();

  TestLogic.setNotSignedInUid(uid);

  const resultsSaveResponse = await Ape.results.save(notSignedInLastResult);
  if (resultsSaveResponse.status === 200) {
    const result: FullResult<Mode> = JSON.parse(
      JSON.stringify(notSignedInLastResult)
    );
    result._id = resultsSaveResponse.data?.insertedId;
    if (resultsSaveResponse.data?.isPb) {
      result.isPb = true;
    }
    DB.saveLocalResult(result);
    DB.updateLocalStats(
      1,
      result.testDuration + result.incompleteTestSeconds - result.afkDuration
    );
  }
}
