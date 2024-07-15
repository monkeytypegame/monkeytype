import { ObjectId } from "mongodb";
import * as PresetDal from "../../src/dal/preset";
import _ from "lodash";
import { off } from "process";

describe("PresetDal", () => {
  describe("readPreset", () => {
    it("should read", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const first = await PresetDal.addPreset(uid, "first", { ads: "sellout" });
      const second = await PresetDal.addPreset(uid, "second", {
        ads: "result",
      });
      await PresetDal.addPreset("unknown", "unknown", {});

      //WHEN
      const read = await PresetDal.getPresets(uid);

      //THEN
      expect(read).toHaveLength(2);
      expect(read).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: new ObjectId(first.presetId),
            uid: uid,
            name: "first",
            config: { ads: "sellout" },
          }),
          expect.objectContaining({
            _id: new ObjectId(second.presetId),
            uid: uid,
            name: "second",
            config: { ads: "result" },
          }),
        ])
      );
    });
  });

  describe("addPreset", () => {
    it("should return error if maximum is reached", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      for (let i = 0; i < 10; i++) {
        await PresetDal.addPreset(uid, "test", {} as any);
      }

      //WHEN / THEN
      expect(() =>
        PresetDal.addPreset(uid, "max", {} as any)
      ).rejects.toThrowError("Too many presets");
    });
    it("should add preset", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      for (let i = 0; i < 9; i++) {
        await PresetDal.addPreset(uid, "test", {} as any);
      }

      //WHEN
      const newPreset = await PresetDal.addPreset(uid, "new", {
        ads: "sellout",
      });

      //THEN
      const read = await PresetDal.getPresets(uid);

      expect(read).toHaveLength(10);
      expect(read).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: new ObjectId(newPreset.presetId),
            uid: uid,
            name: "new",
            config: { ads: "sellout" },
          }),
        ])
      );
    });
  });

  describe("editPreset", () => {
    it("should not fail if preset is unknown", async () => {
      await PresetDal.editPreset(
        "uid",
        new ObjectId().toHexString(),
        "new",
        undefined
      );
    });
    it("should edit", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const decoyUid = new ObjectId().toHexString();
      const first = (
        await PresetDal.addPreset(uid, "first", { ads: "sellout" })
      ).presetId;
      const second = (
        await PresetDal.addPreset(uid, "second", {
          ads: "result",
        })
      ).presetId;
      const decoy = (
        await PresetDal.addPreset(decoyUid, "unknown", { ads: "result" })
      ).presetId;

      //WHEN
      await PresetDal.editPreset(uid, first, "newName", { ads: "off" });

      //THEN
      const read = await PresetDal.getPresets(uid);
      expect(read).toHaveLength(2);
      expect(read).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: new ObjectId(first),
            uid: uid,
            name: "newName",
            config: { ads: "off" },
          }),
          expect.objectContaining({
            _id: new ObjectId(second),
            uid: uid,
            name: "second",
            config: { ads: "result" },
          }),
        ])
      );
      expect(await PresetDal.getPresets(decoyUid)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: new ObjectId(decoy),
            uid: decoyUid,
            name: "unknown",
            config: { ads: "result" },
          }),
        ])
      );
    });

    it("should edit with name only", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const first = (
        await PresetDal.addPreset(uid, "first", { ads: "sellout" })
      ).presetId;

      //WHEN undefined
      await PresetDal.editPreset(uid, first, "newName", undefined);
      expect(await PresetDal.getPresets(uid)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: new ObjectId(first),
            uid: uid,
            name: "newName",
            config: { ads: "sellout" },
          }),
        ])
      );

      //WHEN null
      await PresetDal.editPreset(uid, first, "newName", null);
      expect(await PresetDal.getPresets(uid)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: new ObjectId(first),
            uid: uid,
            name: "newName",
            config: { ads: "sellout" },
          }),
        ])
      );

      //WHEN empty
      await PresetDal.editPreset(uid, first, "newName", {});
      expect(await PresetDal.getPresets(uid)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: new ObjectId(first),
            uid: uid,
            name: "newName",
            config: { ads: "sellout" },
          }),
        ])
      );
    });
    it("should not edit present not matching uid", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const decoyUid = new ObjectId().toHexString();
      const first = (
        await PresetDal.addPreset(uid, "first", { ads: "sellout" })
      ).presetId;

      //WHEN
      await PresetDal.editPreset(decoyUid, first, "newName", { ads: "off" });

      //THEN
      const read = await PresetDal.getPresets(uid);

      expect(read).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: new ObjectId(first),
            uid: uid,
            name: "first",
            config: { ads: "sellout" },
          }),
        ])
      );
    });
  });

  describe("removePreset", () => {
    it("should fail if preset is unknown", async () => {
      expect(() =>
        PresetDal.removePreset("uid", new ObjectId().toHexString())
      ).rejects.toThrowError("Preset not found");
    });
    it("should remove", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const decoyUid = new ObjectId().toHexString();
      const first = (await PresetDal.addPreset(uid, "first", {})).presetId;
      const second = (
        await PresetDal.addPreset(uid, "second", { ads: "result" })
      ).presetId;
      const decoy = (
        await PresetDal.addPreset(decoyUid, "unknown", { ads: "result" })
      ).presetId;

      //WHEN
      PresetDal.removePreset(uid, first);

      //THEN
      const read = await PresetDal.getPresets(uid);
      expect(read).toHaveLength(1);
      expect(read).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: new ObjectId(second),
            uid: uid,
            name: "second",
            config: { ads: "result" },
          }),
        ])
      );
      expect(await PresetDal.getPresets(decoyUid)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: new ObjectId(decoy),
            uid: decoyUid,
            name: "unknown",
            config: { ads: "result" },
          }),
        ])
      );
    });
    it("should not remove present not matching uid", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const decoyUid = new ObjectId().toHexString();
      const first = (
        await PresetDal.addPreset(uid, "first", { ads: "sellout" })
      ).presetId;

      //WHEN
      expect(() =>
        PresetDal.removePreset(decoyUid, first)
      ).rejects.toThrowError("Preset not found");

      //THEN
      const read = await PresetDal.getPresets(uid);

      expect(read).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: new ObjectId(first),
            uid: uid,
            name: "first",
            config: { ads: "sellout" },
          }),
        ])
      );
    });
  });

  describe("deleteAllPresets", () => {
    it("should not fail if preset is unknown", async () => {
      await PresetDal.deleteAllPresets("uid");
    });
    it("should delete all", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const decoyUid = new ObjectId().toHexString();
      await PresetDal.addPreset(uid, "first", {});
      await PresetDal.addPreset(uid, "second", { ads: "result" });
      const decoy = (
        await PresetDal.addPreset(decoyUid, "unknown", { ads: "result" })
      ).presetId;

      //WHEN
      await PresetDal.deleteAllPresets(uid);

      //THEN
      const read = await PresetDal.getPresets(uid);
      expect(read).toHaveLength(0);

      expect(await PresetDal.getPresets(decoyUid)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: new ObjectId(decoy),
            uid: decoyUid,
            name: "unknown",
            config: { ads: "result" },
          }),
        ])
      );
    });
  });
});
