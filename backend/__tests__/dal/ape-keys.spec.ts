import { ObjectId } from "mongodb";
import { addApeKey, deleteAllApeKeys } from "../../src/dal/ape-keys";

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

    const apeKeyId0 = await addApeKey(apeKeys[0]);
    const apeKeyId1 = await addApeKey(apeKeys[1]);

    await deleteAllApeKeys("123");

    expect(apeKeyId0).toBe(undefined);
    expect(apeKeyId1).toBe(undefined);
  });
});
