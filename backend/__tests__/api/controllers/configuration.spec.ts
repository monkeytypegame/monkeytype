import request from "supertest";
import app from "../../../src/app";
import {
  BASE_CONFIGURATION,
  CONFIGURATION_FORM_SCHEMA,
} from "../../../src/constants/base-configuration";
import * as Configuration from "../../../src/init/configuration";
import type { Configuration as ConfigurationType } from "@monkeytype/contracts/schemas/configuration";
import { ObjectId } from "mongodb";
import * as Misc from "../../../src/utils/misc";
import * as AdminUuids from "../../../src/dal/admin-uids";
import { mockBearerAuthentication } from "../../__testData__/auth";

const mockApp = request(app);
const uid = new ObjectId().toHexString();

describe("Configuration Controller", () => {
  const isDevEnvironmentMock = vi.spyOn(Misc, "isDevEnvironment");
  const mockAuth = mockBearerAuthentication(uid);
  const isAdminMock = vi.spyOn(AdminUuids, "isAdmin");

  beforeEach(() => {
    isAdminMock.mockReset();
    mockAuth.beforeEach();
    isDevEnvironmentMock.mockReset();

    isDevEnvironmentMock.mockReturnValue(true);
    isAdminMock.mockResolvedValue(true);
  });

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
    it("should get without authentication on dev", async () => {
      //GIVEN
      mockAuth.noAuth();
      //WHEN
      const { body } = await mockApp.get("/configuration/schema").expect(200);

      //THEN
      expect(body).toEqual({
        message: "Configuration schema retrieved",
        data: CONFIGURATION_FORM_SCHEMA,
      });
    });

    it("should fail without authentication on prod", async () => {
      //GIVEN
      isDevEnvironmentMock.mockReturnValue(false);

      //WHEN
      await mockApp.get("/configuration/schema").expect(401);
    });
    it("should get with authentication on prod", async () => {
      //GIVEN
      isDevEnvironmentMock.mockReturnValue(false);

      //WHEN
      const { body } = await mockApp
        .get("/configuration/schema")
        .set("Authorization", "Bearer 123456789")
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Configuration schema retrieved",
        data: CONFIGURATION_FORM_SCHEMA,
      });

      mockAuth.expectToHaveBeenCalled();
    });
    it("should fail with non-admin user on prod", async () => {
      //GIVEN
      isDevEnvironmentMock.mockReturnValue(false);
      isAdminMock.mockResolvedValue(false);

      //WHEN
      const { body } = await mockApp
        .get("/configuration/schema")
        .set("Authorization", "Bearer 123456789")
        .expect(403);

      //THEN
      expect(body.message).toEqual("You don't have permission to do this.");
      mockAuth.expectToHaveBeenCalled();
      expect(isAdminMock).toHaveBeenCalledWith(uid);
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

    it("should update without authentication on dev", async () => {
      //GIVEN
      mockAuth.noAuth();
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
        .send({ configuration: patch })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Configuration updated",
        data: null,
      });

      expect(patchConfigurationMock).toHaveBeenCalledWith(patch);
    });

    it("should fail update without authentication on prod", async () => {
      //GIVEN
      mockAuth.noAuth();
      isDevEnvironmentMock.mockReturnValue(false);

      //WHEN
      await request(app)
        .patch("/configuration")
        .send({ configuration: {} })
        .expect(401);

      //THEN
      expect(patchConfigurationMock).not.toHaveBeenCalled();
    });
    it("should update with authentication on prod", async () => {
      //GIVEN
      isDevEnvironmentMock.mockReturnValue(false);

      //WHEN
      await mockApp
        .patch("/configuration")
        .set("Authorization", "Bearer 123456789")
        .send({ configuration: {} })
        .expect(200);

      //THEN
      expect(patchConfigurationMock).toHaveBeenCalled();
      mockAuth.expectToHaveBeenCalled();
    });

    it("should fail for non admin users on prod", async () => {
      //GIVEN
      isDevEnvironmentMock.mockReturnValue(false);
      isAdminMock.mockResolvedValue(false);

      //WHEN
      await mockApp
        .patch("/configuration")
        .set("Authorization", "Bearer 123456789")
        .send({ configuration: {} })
        .expect(403);

      //THEN
      expect(patchConfigurationMock).not.toHaveBeenCalled();
      expect(isAdminMock).toHaveBeenCalledWith(uid);
    });
  });
});
