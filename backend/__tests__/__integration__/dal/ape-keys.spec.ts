import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";
import {
  addApeKey,
  DBApeKey,
  editApeKey,
  getApeKey,
  updateLastUsedOn,
} from "../../../src/dal/ape-keys";

describe("ApeKeysDal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  describe("addApeKey", () => {
    it("should be able to add a new ape key", async () => {
      const apeKey = buildApeKey();

      const apeKeyId = await addApeKey(apeKey);

      expect(apeKeyId).toBe(apeKey._id.toHexString());

      const read = await getApeKey(apeKeyId);
      expect(read).toEqual({
        ...apeKey,
      });
    });
  });

  describe("editApeKey", () => {
    it("should edit name of an existing ape key", async () => {
      //GIVEN
      const apeKey = buildApeKey({ useCount: 5, enabled: true });
      const apeKeyId = await addApeKey(apeKey);

      //WHEN
      const newName = "new name";
      await editApeKey(apeKey.uid, apeKeyId, newName, undefined);

      //THENa
      const readAfterEdit = (await getApeKey(apeKeyId)) as DBApeKey;
      expect(readAfterEdit).toEqual({
        ...apeKey,
        name: newName,
        modifiedOn: Date.now(),
      });
    });

    it("should edit enabled of an existing ape key", async () => {
      //GIVEN
      const apeKey = buildApeKey({ useCount: 5, enabled: true });
      const apeKeyId = await addApeKey(apeKey);

      //WHEN

      await editApeKey(apeKey.uid, apeKeyId, undefined, false);

      //THEN
      const readAfterEdit = (await getApeKey(apeKeyId)) as DBApeKey;
      expect(readAfterEdit).toEqual({
        ...apeKey,
        enabled: false,
        modifiedOn: Date.now(),
      });
    });
  });

  describe("updateLastUsedOn", () => {
    it("should update lastUsedOn and increment useCount when editing with lastUsedOn", async () => {
      //GIVEN
      const apeKey = buildApeKey({
        useCount: 5,
        lastUsedOn: 42,
      });
      const apeKeyId = await addApeKey(apeKey);

      //WHEN
      await updateLastUsedOn(apeKey.uid, apeKeyId);
      await updateLastUsedOn(apeKey.uid, apeKeyId);

      //THENa
      const readAfterEdit = (await getApeKey(apeKeyId)) as DBApeKey;
      expect(readAfterEdit).toEqual({
        ...apeKey,
        modifiedOn: readAfterEdit.modifiedOn,
        lastUsedOn: Date.now(),
        useCount: 5 + 2,
      });
    });
  });
});

function buildApeKey(overrides: Partial<DBApeKey> = {}): DBApeKey {
  return {
    _id: new ObjectId(),
    uid: "123",
    name: "test",
    hash: "12345",
    createdOn: Date.now(),
    modifiedOn: Date.now(),
    lastUsedOn: Date.now(),
    useCount: 0,
    enabled: true,
    ...overrides,
  };
}
