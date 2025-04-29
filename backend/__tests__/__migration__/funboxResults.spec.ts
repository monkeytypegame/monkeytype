import { Db } from "mongodb";
import FunboxResultMigration from "../../__migration__/funboxResult";
import { getDb } from "../../src/init/db";
import { DBResult } from "../../src/utils/result";
import * as ResultDal from "../../src/dal/result";
import { createUser } from "../__testData__/users";

describe("FunboxResults migration", () => {
  const migration = new FunboxResultMigration();

  beforeAll(async () => {
    migration.setup(getDb() as Db);
  });

  it("migrates results with funbox", async () => {
    //GIVEN
    const { uid, resultId } = await createResult({
      funbox: "58008#read_ahead",
      acc: 95,
    });

    //WHEN
    await migration.migrate({ batchSize: 1000 });

    //THEN
    const migratedResult = await ResultDal.getResult(uid, resultId);

    expect(migratedResult).toEqual(
      expect.objectContaining({
        acc: 95,
        funbox: ["58008", "read_ahead"],
      })
    );
  });

  it("migrates results with funbox none", async () => {
    //GIVEN
    const { uid, resultId } = await createResult({
      funbox: "none",
      acc: 95,
    });

    //WHEN
    await migration.migrate({ batchSize: 1000 });

    //THEN
    const migratedResult = await ResultDal.getResult(uid, resultId);
    console.log(migratedResult);

    expect(migratedResult.funbox).toEqual([]);
  });

  it("migrates results without funbox", async () => {
    //GIVEN
    const { uid, resultId } = await createResult({
      acc: 95,
    });

    //WHEN
    await migration.migrate({ batchSize: 1000 });

    //THEN
    const migratedResult = await ResultDal.getResult(uid, resultId);
    expect(migratedResult).not.toHaveProperty("funbox");
  });
});

async function createResult(result: Partial<DBResult>): Promise<{
  uid: string;
  resultId: string;
}> {
  const uid = (await createUser()).uid;
  const resultId = (
    await ResultDal.addResult(uid, result as any)
  ).insertedId.toHexString();
  return { uid, resultId };
}
