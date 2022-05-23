import { ObjectId } from "mongodb";
import { addApeKey } from "../../src/dal/ape-keys";

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
});
