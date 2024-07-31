import * as Migration from "../../__migration__/testActivity";
import * as UserTestData from "../__testData__/users";
import * as UserDal from "../../src/dal/user";
import * as ResultDal from "../../src/dal/result";

describe("testActivity migration", () => {
  it("migrates users without results", async () => {
    //given
    const user1 = await UserTestData.createUser();
    const user2 = await UserTestData.createUser();

    //when
    await Migration.migrate();

    //then
    const readUser1 = await UserDal.getUser(user1.uid, "");
    expect(readUser1.testActivity).toEqual({});

    const readUser2 = await UserDal.getUser(user2.uid, "");
    expect(readUser2.testActivity).toEqual({});
  });

  it("migrates users with results", async () => {
    //given
    const withResults = await UserTestData.createUserWithoutMigration();
    const withoutResults = await UserTestData.createUserWithoutMigration();

    const uid = withResults.uid;

    //2023-01-02
    await createResult(uid, 1672621200000);

    //2024-01-01
    await createResult(uid, 1704070800000);
    await createResult(uid, 1704070800000 + 3600000);
    await createResult(uid, 1704070800000 + 3600000);

    //2024-01-02
    await createResult(uid, 1704157200000);
    //2024-01-03
    await createResult(uid, 1704243600000);

    //when
    await Migration.migrate();

    //then
    const readWithResults = await UserDal.getUser(withResults.uid, "");
    expect(readWithResults.testActivity).toEqual({
      "2023": [null, 1],
      "2024": [3, 1, 1],
    });

    const readWithoutResults = await UserDal.getUser(withoutResults.uid, "");
    expect(readWithoutResults.testActivity).toEqual({});
  });
});

async function createResult(uid: string, timestamp: number): Promise<void> {
  await ResultDal.addResult(uid, {
    wpm: 0,
    rawWpm: 0,
    charStats: [1, 2, 3, 4],
    acc: 0,
    mode: "time",
    mode2: "60",
    timestamp: timestamp,
    testDuration: 1,
    consistency: 0,
    keyConsistency: 0,
    chartData: "toolong",
    name: "",
  } as unknown as ResultDal.DBResult);
}
