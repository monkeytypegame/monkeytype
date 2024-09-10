import { ObjectId } from "mongodb";
import * as PresetDal from "../../src/dal/preset";
import _ from "lodash";

describe("PresetDal", () => {
  describe("readPreset", () => {
    it("should read", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const first = await PresetDal.addPreset(uid, {
        name: "first",
        config: { ads: "sellout" },
      });
      const second = await PresetDal.addPreset(uid, {
        name: "second",
        settingGroups: ["hideElements"],
        config: {
          showKeyTips: true,
          capsLockWarning: true,
          showOutOfFocusWarning: true,
          showAverage: "off",
        },
      });
      await PresetDal.addPreset("unknown", { name: "unknown", config: {} });

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
            settingGroups: ["hideElements"],
            config: {
              showKeyTips: true,
              capsLockWarning: true,
              showOutOfFocusWarning: true,
              showAverage: "off",
            },
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
        await PresetDal.addPreset(uid, { name: "test", config: {} });
      }

      //WHEN / THEN
      expect(() =>
        PresetDal.addPreset(uid, { name: "max", config: {} })
      ).rejects.toThrowError("Too many presets");
    });
    it("should add preset", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      for (let i = 0; i < 9; i++) {
        await PresetDal.addPreset(uid, { name: "test", config: {} });
      }

      //WHEN
      const newPreset = await PresetDal.addPreset(uid, {
        name: "new",
        config: {
          ads: "sellout",
        },
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
      await PresetDal.editPreset("uid", {
        _id: new ObjectId().toHexString(),
        name: "new",
        config: {},
      });
    });

    it("should edit", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const decoyUid = new ObjectId().toHexString();
      const first = (
        await PresetDal.addPreset(uid, {
          name: "first",
          config: { ads: "sellout" },
        })
      ).presetId;
      const second = (
        await PresetDal.addPreset(uid, {
          name: "second",
          config: {
            ads: "result",
          },
        })
      ).presetId;
      const decoy = (
        await PresetDal.addPreset(decoyUid, {
          name: "unknown",
          config: { ads: "result" },
        })
      ).presetId;

      //WHEN
      await PresetDal.editPreset(uid, {
        _id: first,
        name: "newName",
        config: { ads: "off" },
      });

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

    it("should edit with name only - full preset", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const first = (
        await PresetDal.addPreset(uid, {
          name: "first",
          config: { ads: "sellout" },
        })
      ).presetId;

      //WHEN empty
      await PresetDal.editPreset(uid, {
        _id: first,
        name: "newName",
      });
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
    it("should edit with name only - partial preset", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const first = (
        await PresetDal.addPreset(uid, {
          name: "first",
          settingGroups: ["hideElements"],
          config: {
            showKeyTips: true,
            capsLockWarning: true,
            showOutOfFocusWarning: true,
            showAverage: "off",
          },
        })
      ).presetId;

      //WHEN empty
      await PresetDal.editPreset(uid, {
        _id: first,
        name: "newName",
      });
      expect(await PresetDal.getPresets(uid)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: new ObjectId(first),
            uid: uid,
            name: "newName",
            settingGroups: ["hideElements"],
            config: {
              showKeyTips: true,
              capsLockWarning: true,
              showOutOfFocusWarning: true,
              showAverage: "off",
            },
          }),
        ])
      );
    });
    it("should not edit present not matching uid", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const decoyUid = new ObjectId().toHexString();
      const first = (
        await PresetDal.addPreset(uid, {
          name: "first",
          config: { ads: "sellout" },
        })
      ).presetId;

      //WHEN
      await PresetDal.editPreset(decoyUid, {
        _id: first,
        name: "newName",
        config: { ads: "off" },
      });

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
    it("should edit when partial is edited to full", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const first = (
        await PresetDal.addPreset(uid, {
          name: "first",
          settingGroups: ["hideElements"],
          config: {
            showKeyTips: true,
            capsLockWarning: true,
            showOutOfFocusWarning: true,
            showAverage: "off",
          },
        })
      ).presetId;
      //WHEN
      await PresetDal.editPreset(uid, {
        _id: first,
        name: "newName",
        settingGroups: null,
        config: { ads: "off" },
      });

      //THEN
      expect(await PresetDal.getPresets(uid)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: new ObjectId(first),
            uid: uid,
            name: "newName",
            config: { ads: "off" },
            settingGroups: null,
          }),
        ])
      );
    });
    it("should edit when full is edited to partial", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const first = (
        await PresetDal.addPreset(uid, {
          name: "first",
          config: {
            ads: "off",
          },
        })
      ).presetId;

      //WHEN
      await PresetDal.editPreset(uid, {
        _id: first,
        name: "newName",
        settingGroups: ["hideElements"],
        config: {
          showKeyTips: true,
          capsLockWarning: true,
          showOutOfFocusWarning: true,
          showAverage: "off",
        },
      });

      //THEN
      expect(await PresetDal.getPresets(uid)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: new ObjectId(first),
            uid: uid,
            name: "newName",
            settingGroups: ["hideElements"],
            config: {
              showKeyTips: true,
              capsLockWarning: true,
              showOutOfFocusWarning: true,
              showAverage: "off",
            },
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
      const first = (
        await PresetDal.addPreset(uid, { name: "first", config: {} })
      ).presetId;
      const second = (
        await PresetDal.addPreset(uid, {
          name: "second",
          config: { ads: "result" },
        })
      ).presetId;
      const decoy = (
        await PresetDal.addPreset(decoyUid, {
          name: "unknown",
          config: { ads: "result" },
        })
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
        await PresetDal.addPreset(uid, {
          name: "first",
          config: { ads: "sellout" },
        })
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
      await PresetDal.addPreset(uid, { name: "first", config: {} });
      await PresetDal.addPreset(uid, {
        name: "second",
        config: { ads: "result" },
      });
      const decoy = (
        await PresetDal.addPreset(decoyUid, {
          name: "unknown",
          config: { ads: "result" },
        })
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
