import request from "supertest";
import app from "../../../src/app";
import {
  BASE_CONFIGURATION,
  CONFIGURATION_FORM_SCHEMA,
} from "../../../src/constants/base-configuration";
import * as Configuration from "../../../src/init/configuration";
import type { Configuration as ConfigurationType } from "@monkeytype/contracts/schemas/configurations";
import { ObjectId } from "mongodb";
const mockApp = request(app);
const uid = new ObjectId().toHexString();

describe("Configuration Controller", () => {
  describe("getConfiguration", () => {
    it("should get without authentication", async () => {
      //GIVEN

      //WHEN
      const { body } = await mockApp.get("/configuration").expect(200);

      //THEN
      expect(body).toEqual({
        message: "Configuration retrieved",
        data: BASE_CONFIGURATION,
      });
    });
  });

  describe("getConfigurationSchema", () => {
    it("should get without authentication", async () => {
      //GIVEN

      //WHEN
      const { body } = await mockApp.get("/configuration/schema").expect(200);

      //THEN
      expect(body).toEqual({
        message: "Configuration schema retrieved",
        data: CONFIGURATION_FORM_SCHEMA,
      });
    });
  });

  describe("updateConfiguration", () => {
    const patchConfigurationMock = vi.spyOn(
      Configuration,
      "patchConfiguration"
    );
    beforeEach(() => {
      patchConfigurationMock.mockReset();
      patchConfigurationMock.mockResolvedValue(true);
    });

    it("patches configuration", async () => {
      //GIVEN
      const patch = {
        users: {
          premium: {
            enabled: true,
          },
        },
      } as Partial<ConfigurationType>;

      //WHEN
      const { body } = await mockApp
        .patch("/configuration")
        .send({ configuration: patch });
      //.expect(200);

      //THEN
      expect(body).toEqual({
        message: "Configuration updated",
        data: null,
      });

      expect(patchConfigurationMock).toHaveBeenCalledWith(patch);
    });

    it("should fail wihtouth authentication", async () => {
      await request(app).patch("/configuration").send({}).expect(401);
    });

    it("should fail for non admin users", async () => {
      //GIVEN

      //WHEN
      const { body } = await mockApp
        .patch("/configuration")
        .send({})
        .expect(403);

      //THEN
    });
  });
});
