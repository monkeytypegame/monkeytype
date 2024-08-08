import { ObjectId } from "mongodb";
import * as AdminUidsDal from "../../src/dal/admin-uids";

describe("AdminUidsDal", () => {
  describe("isAdmin", () => {
    it("should return true for existing admin user", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      await AdminUidsDal.getCollection().insertOne({
        _id: new ObjectId(),
        uid: uid,
      });

      //WHEN / THEN
      expect(await AdminUidsDal.isAdmin(uid)).toBe(true);
    });

    it("should return false for non-existing admin user", async () => {
      //GIVEN
      await AdminUidsDal.getCollection().insertOne({
        _id: new ObjectId(),
        uid: "admin",
      });

      //WHEN / THEN
      expect(await AdminUidsDal.isAdmin("regularUser")).toBe(false);
    });
  });
});
