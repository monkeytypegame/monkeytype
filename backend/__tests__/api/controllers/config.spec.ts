import request from "supertest";
import app from "../../../src/app";
import * as ConfigDal from "../../../src/dal/config";
import { ObjectId } from "mongodb";
const mockApp = request(app);

describe("ConfigController", () => {
  describe("get config", () => {
    const getConfigMock = vi.spyOn(ConfigDal, "getConfig");

    afterEach(() => {
      getConfigMock.mockReset();
    });

    it("should get the users config", async () => {
      //GIVEN
      getConfigMock.mockResolvedValue({
        _id: new ObjectId(),
        uid: "123456789",
        config: { language: "english" },
      });

      //WHEN
      const { body } = await mockApp
        .get("/configs")
        .set("authorization", "Uid 123456789")
        .expect(200);

      //THEN
      expect(body).toStrictEqual({
        message: "Configuration retrieved",
        data: { language: "english" },
      });

      expect(getConfigMock).toHaveBeenCalledWith("123456789");
    });
  });
  describe("update config", () => {
    const saveConfigMock = vi.spyOn(ConfigDal, "saveConfig");

    afterEach(() => {
      saveConfigMock.mockReset();
    });

    it("should update the users config", async () => {
      //GIVEN
      saveConfigMock.mockResolvedValue({} as any);

      //WHEN
      const { body } = await mockApp
        .patch("/configs")
        .set("authorization", "Uid 123456789")
        .accept("application/json")
        .send({ language: "english" })
        .expect(200);

      //THEN
      expect(body).toStrictEqual({
        message: "Config updated",
        data: null,
      });

      expect(saveConfigMock).toHaveBeenCalledWith("123456789", {
        language: "english",
      });
    });
    it("should fail with unknown config", async () => {
      //WHEN
      const { body } = await mockApp
        .patch("/configs")
        .set("authorization", "Uid 123456789")
        .accept("application/json")
        .send({ unknownValue: "unknown" })
        .expect(422);

      //THEN
      expect(body).toStrictEqual({
        message: "Invalid request data schema",
        validationErrors: [`Unrecognized key(s) in object: 'unknownValue'`],
      });

      expect(saveConfigMock).not.toHaveBeenCalled();
    });
    it("should fail with invalid configs", async () => {
      //WHEN
      const { body } = await mockApp
        .patch("/configs")
        .set("authorization", "Uid 123456789")
        .accept("application/json")
        .send({ autoSwitchTheme: "yes", confidenceMode: "pretty" })
        .expect(422);

      //THEN
      expect(body).toStrictEqual({
        message: "Invalid request data schema",
        validationErrors: [
          `"autoSwitchTheme" Expected boolean, received string`,
          `"confidenceMode" Invalid enum value. Expected 'off' | 'on' | 'max', received 'pretty'`,
        ],
      });

      expect(saveConfigMock).not.toHaveBeenCalled();
    });
  });
  describe("delete config", () => {
    const deleteConfigMock = vi.spyOn(ConfigDal, "deleteConfig");

    afterEach(() => {
      deleteConfigMock.mockReset();
    });

    it("should delete the users config", async () => {
      //GIVEN
      deleteConfigMock.mockResolvedValue();

      //WHEN

      const { body } = await mockApp
        .delete("/configs")
        .set("authorization", "Uid 123456789")
        .expect(200);

      //THEN
      expect(body).toStrictEqual({
        message: "Config deleted",
        data: null,
      });

      expect(deleteConfigMock).toHaveBeenCalledWith("123456789");
    });
  });
});
