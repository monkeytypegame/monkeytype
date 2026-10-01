import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import * as ConfigDal from "../../../src/dal/config";

const getConfigCollection = ConfigDal.__testing.getConfigCollection;

describe("ConfigDal", () => {
  describe("saveConfig", () => {
    it("should save and update user configuration correctly", async () => {
      //GIVEN
      const uid = new ObjectId().toString();
      await getConfigCollection().insertOne({
        uid,
        config: {
          ads: "on",
          time: 60,
          quickTab: true, //legacy value
        },
      } as any);

      //WHEN
      await ConfigDal.saveConfig(uid, {
        ads: "on",
        difficulty: "normal",
      } as any);

      //WHEN
      await ConfigDal.saveConfig(uid, { ads: "off" });

      //THEN
      const savedConfig = (await ConfigDal.getConfig(
        uid,
      )) as ConfigDal.DBConfig;

      expect(savedConfig.config.ads).toBe("off");
      expect(savedConfig.config.time).toBe(60);

      //should remove legacy values
      expect((savedConfig.config as any)["quickTab"]).toBeUndefined();
    });
  });
});
