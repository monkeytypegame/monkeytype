import { ObjectId } from "mongodb";
import { addApeKey, deleteAll } from "../../src/dal/ape-keys";
import * as db from "../../src/init/db";

const COLLECTION_NAME = "ape-keys";

describe("ApeKeysDal", () => {
  it("should be able to add a new ape key", async () => {
    const apeKey = {
      _id: new ObjectId(),
      uid: "123",
      name: "test",
      hash: "12345",
      createdOn: Date.now(),
      modifiedOn: Date.now(),
      lastUsedOn: Date.now(),
      useCount: 0,
      enabled: true,
    };

    const apeKeyId = await addApeKey(apeKey);

    expect(apeKeyId).toBe(apeKey._id.toHexString());
  });
  it("should be able to delete all ape keys", async () => {
    const apeKeys = [
      {
        _id: new ObjectId(),
        uid: "123",
        name: "test",
        hash: "11111",
        createdOn: Date.now(),
        modifiedOn: Date.now(),
        lastUsedOn: Date.now(),
        useCount: 0,
        enabled: true,
      },
      {
        _id: new ObjectId(),
        uid: "123",
        name: "test",
        hash: "11113",
        createdOn: Date.now(),
        modifiedOn: Date.now(),
        lastUsedOn: Date.now(),
        useCount: 0,
        enabled: true,
      },
    ];

    const results = [addApeKey(apeKeys[0]), addApeKey(apeKeys[1])];

    await Promise.all(results);

    await deleteAll("123");

    const exists =
      (await db.collection(COLLECTION_NAME).countDocuments({ uid: "123" })) > 0;

    expect(exists).toBe(false);
  });
});
