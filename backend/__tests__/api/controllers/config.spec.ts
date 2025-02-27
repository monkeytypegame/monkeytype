import request from "supertest";
import app from "../../../src/app";
import * as ConfigDal from "../../../src/dal/config";
import { ObjectId } from "mongodb";
import { mockBearerAuthentication } from "../../__testData__/auth";
const mockApp = request(app);
const uid = new ObjectId().toHexString();
const mockAuth = mockBearerAuthentication(uid);

describe("ConfigController", () => {
  beforeEach(() => {
    mockAuth.beforeEach();
  });
  describe("get config", () => {
    const getConfigMock = vi.spyOn(ConfigDal, "getConfig");

    afterEach(() => {
      getConfigMock.mockReset();
    });

    it("should get the users config", async () => {
      //GIVEN
      getConfigMock.mockResolvedValue({
        _id: new ObjectId(),
        uid: uid,
        config: { language: "english" },
      });

      //WHEN
      const { body } = await mockApp
        .get("/configs")
        .set("Authorization", `Bearer ${uid}`)
        .expect(200);

      //THEN
      expect(body).toStrictEqual({
        message: "Configuration retrieved",
        data: { language: "english" },
      });

      expect(getConfigMock).toHaveBeenCalledWith(uid);
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
        .set("Authorization", `Bearer ${uid}`)
        .accept("application/json")
        .send({ language: "english" })
        .expect(200);

      //THEN
      expect(body).toStrictEqual({
        message: "Config updated",
        data: null,
      });

      expect(saveConfigMock).toHaveBeenCalledWith(uid, {
        language: "english",
      });
    });
    it("should fail with unknown config", async () => {
      //WHEN
      const { body } = await mockApp
        .patch("/configs")
        .set("Authorization", `Bearer ${uid}`)
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
        .set("Authorization", `Bearer ${uid}`)
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
        .set("Authorization", `Bearer ${uid}`)
        .expect(200);

      //THEN
      expect(body).toStrictEqual({
        message: "Config deleted",
        data: null,
      });

      expect(deleteConfigMock).toHaveBeenCalledWith(uid);
    });
  });
});
