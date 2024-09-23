import request, { Test as SuperTest } from "supertest";
import app from "../../../src/app";
import { ObjectId } from "mongodb";
import * as Configuration from "../../../src/init/configuration";
import * as AdminUuidDal from "../../../src/dal/admin-uids";
import * as UserDal from "../../../src/dal/user";
import * as ReportDal from "../../../src/dal/report";
import GeorgeQueue from "../../../src/queues/george-queue";
import * as AuthUtil from "../../../src/utils/auth";
import _ from "lodash";
import { enableRateLimitExpects } from "../../__testData__/rate-limit";

const mockApp = request(app);
const configuration = Configuration.getCachedConfiguration();
const uid = new ObjectId().toHexString();
enableRateLimitExpects();

describe("AdminController", () => {
  const isAdminMock = vi.spyOn(AdminUuidDal, "isAdmin");

  beforeEach(async () => {
    isAdminMock.mockReset();
    await enableAdminEndpoints(true);
    isAdminMock.mockResolvedValue(true);
  });

  describe("check for admin", () => {
    it("should succeed if user is admin", async () => {
      //GIVEN

      //WHEN
      const { body } = await mockApp
        .get("/admin")
        .set("authorization", `Uid ${uid}`)
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "OK",
        data: null,
      });

      expect(isAdminMock).toHaveBeenCalledWith(uid);
    });
    it("should fail if user is no admin", async () => {
      await expectFailForNonAdmin(
        mockApp.get("/admin").set("authorization", `Uid ${uid}`)
      );
    });
    it("should fail if admin endpoints are disabled", async () => {
      await expectFailForDisabledEndpoint(
        mockApp.get("/admin").set("authorization", `Uid ${uid}`)
      );
    });
    it("should be rate limited", async () => {
      await expect(
        mockApp.get("/admin").set("authorization", `Uid ${uid}`)
      ).toBeRateLimited({ max: 1, windowMs: 5000 });
    });
  });

  describe("toggle ban", () => {
    const userBannedMock = vi.spyOn(UserDal, "setBanned");
    const georgeBannedMock = vi.spyOn(GeorgeQueue, "userBanned");
    const getUserMock = vi.spyOn(UserDal, "getPartialUser");

    beforeEach(() => {
      [userBannedMock, georgeBannedMock, getUserMock].forEach((it) =>
        it.mockReset()
      );
    });

    it("should ban user with discordId", async () => {
      //GIVEN
      const victimUid = new ObjectId().toHexString();
      getUserMock.mockResolvedValue({
        banned: false,
        discordId: "discordId",
      } as any);

      //WHEN
      const { body } = await mockApp
        .post("/admin/toggleBan")
        .send({ uid: victimUid })
        .set("authorization", `Uid ${uid}`)
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Ban toggled",
        data: { banned: true },
      });

      expect(getUserMock).toHaveBeenCalledWith(victimUid, "toggle ban", [
        "banned",
        "discordId",
      ]);
      expect(userBannedMock).toHaveBeenCalledWith(victimUid, true);
      expect(georgeBannedMock).toHaveBeenCalledWith("discordId", true);
    });
    it("should unban user without discordId", async () => {
      //GIVEN
      const victimUid = new ObjectId().toHexString();
      getUserMock.mockResolvedValue({
        banned: true,
      } as any);

      //WHEN
      const { body } = await mockApp
        .post("/admin/toggleBan")
        .send({ uid: victimUid })
        .set("authorization", `Uid ${uid}`)
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Ban toggled",
        data: { banned: false },
      });

      expect(getUserMock).toHaveBeenCalledWith(victimUid, "toggle ban", [
        "banned",
        "discordId",
      ]);
      expect(userBannedMock).toHaveBeenCalledWith(victimUid, false);
      expect(georgeBannedMock).not.toHaveBeenCalled();
    });
    it("should fail without mandatory properties", async () => {
      //GIVEN

      //WHEN
      const { body } = await mockApp
        .post("/admin/toggleBan")
        .send({})
        .set("authorization", `Uid ${uid}`)
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ['"uid" Required'],
      });
    });
    it("should fail with unknown properties", async () => {
      //GIVEN

      //WHEN
      const { body } = await mockApp
        .post("/admin/toggleBan")
        .send({ uid: new ObjectId().toHexString(), extra: "value" })
        .set("authorization", `Uid ${uid}`)
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });
    it("should fail if user is no admin", async () => {
      await expectFailForNonAdmin(
        mockApp
          .post("/admin/toggleBan")
          .send({ uid: new ObjectId().toHexString() })
          .set("authorization", `Uid ${uid}`)
      );
    });
    it("should fail if admin endpoints are disabled", async () => {
      //GIVEN
      await expectFailForDisabledEndpoint(
        mockApp
          .post("/admin/toggleBan")
          .send({ uid: new ObjectId().toHexString() })
          .set("authorization", `Uid ${uid}`)
      );
    });
    it("should be rate limited", async () => {
      //GIVEN
      const victimUid = new ObjectId().toHexString();
      getUserMock.mockResolvedValue({
        banned: false,
        discordId: "discordId",
      } as any);

      //WHEN
      await expect(
        mockApp
          .post("/admin/toggleBan")
          .send({ uid: victimUid })
          .set("authorization", `Uid ${uid}`)
      ).toBeRateLimited({ max: 1, windowMs: 5000 });
    });
  });
  describe("accept reports", () => {
    const getReportsMock = vi.spyOn(ReportDal, "getReports");
    const deleteReportsMock = vi.spyOn(ReportDal, "deleteReports");
    const addToInboxMock = vi.spyOn(UserDal, "addToInbox");

    beforeEach(() => {
      [getReportsMock, deleteReportsMock, addToInboxMock].forEach((it) =>
        it.mockReset()
      );
    });

    it("should accept reports", async () => {
      //GIVEN
      const reportOne = {
        id: "1",
        reason: "one",
      } as any as ReportDal.DBReport;
      const reportTwo = {
        id: "2",
        reason: "two",
      } as any as ReportDal.DBReport;
      getReportsMock.mockResolvedValue([reportOne, reportTwo]);

      //WHEN
      const { body } = await mockApp
        .post("/admin/report/accept")
        .send({
          reports: [{ reportId: reportOne.id }, { reportId: reportTwo.id }],
        })
        .set("authorization", `Uid ${uid}`)
        .expect(200);

      expect(body).toEqual({
        message: "Reports removed and users notified.",
        data: null,
      });

      expect(addToInboxMock).toBeCalledTimes(2);
      expect(deleteReportsMock).toHaveBeenCalledWith(["1", "2"]);
    });
    it("should fail wihtout mandatory properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/admin/report/accept")
        .send({})
        .set("authorization", `Uid ${uid}`)
        .expect(422);

      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ['"reports" Required'],
      });
    });
    it("should fail with empty reports", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/admin/report/accept")
        .send({ reports: [] })
        .set("authorization", `Uid ${uid}`)
        .expect(422);

      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: [
          '"reports" Array must contain at least 1 element(s)',
        ],
      });
    });
    it("should fail with unknown properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/admin/report/accept")
        .send({ reports: [{ reportId: "1", extra2: "value" }], extra: "value" })
        .set("authorization", `Uid ${uid}`)
        .expect(422);

      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: [
          `"reports.0" Unrecognized key(s) in object: 'extra2'`,
          "Unrecognized key(s) in object: 'extra'",
        ],
      });
    });
    it("should fail if user is no admin", async () => {
      await expectFailForNonAdmin(
        mockApp
          .post("/admin/report/accept")
          .send({ reports: [] })
          .set("authorization", `Uid ${uid}`)
      );
    });
    it("should fail if admin endpoints are disabled", async () => {
      //GIVEN
      await expectFailForDisabledEndpoint(
        mockApp
          .post("/admin/report/accept")
          .send({ reports: [] })
          .set("authorization", `Uid ${uid}`)
      );
    });
    it("should be rate limited", async () => {
      //GIVEN
      getReportsMock.mockResolvedValue([{ id: "1", reason: "one" } as any]);

      //WHEN
      await expect(
        mockApp
          .post("/admin/report/accept")
          .send({ reports: [{ reportId: "1" }] })
          .set("authorization", `Uid ${uid}`)
      ).toBeRateLimited({ max: 1, windowMs: 5000 });
    });
  });
  describe("reject reports", () => {
    const getReportsMock = vi.spyOn(ReportDal, "getReports");
    const deleteReportsMock = vi.spyOn(ReportDal, "deleteReports");
    const addToInboxMock = vi.spyOn(UserDal, "addToInbox");

    beforeEach(() => {
      [getReportsMock, deleteReportsMock, addToInboxMock].forEach((it) =>
        it.mockReset()
      );
    });

    it("should reject reports", async () => {
      //GIVEN
      const reportOne = {
        id: "1",
        reason: "one",
      } as any as ReportDal.DBReport;
      const reportTwo = {
        id: "2",
        reason: "two",
      } as any as ReportDal.DBReport;
      getReportsMock.mockResolvedValue([reportOne, reportTwo]);

      //WHEN
      const { body } = await mockApp
        .post("/admin/report/reject")
        .send({
          reports: [
            { reportId: reportOne.id, reason: "test" },
            { reportId: reportTwo.id },
          ],
        })
        .set("authorization", `Uid ${uid}`)
        .expect(200);

      expect(body).toEqual({
        message: "Reports removed and users notified.",
        data: null,
      });

      expect(addToInboxMock).toHaveBeenCalledTimes(2);
      expect(deleteReportsMock).toHaveBeenCalledWith(["1", "2"]);
    });
    it("should fail wihtout mandatory properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/admin/report/reject")
        .send({})
        .set("authorization", `Uid ${uid}`)
        .expect(422);

      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ['"reports" Required'],
      });
    });
    it("should fail with empty reports", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/admin/report/reject")
        .send({ reports: [] })
        .set("authorization", `Uid ${uid}`)
        .expect(422);

      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: [
          '"reports" Array must contain at least 1 element(s)',
        ],
      });
    });
    it("should fail with unknown properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/admin/report/reject")
        .send({ reports: [{ reportId: "1", extra2: "value" }], extra: "value" })
        .set("authorization", `Uid ${uid}`)
        .expect(422);

      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: [
          `"reports.0" Unrecognized key(s) in object: 'extra2'`,
          "Unrecognized key(s) in object: 'extra'",
        ],
      });
    });
    it("should fail if user is no admin", async () => {
      await expectFailForNonAdmin(
        mockApp
          .post("/admin/report/reject")
          .send({ reports: [] })
          .set("authorization", `Uid ${uid}`)
      );
    });
    it("should fail if admin endpoints are disabled", async () => {
      //GIVEN
      await expectFailForDisabledEndpoint(
        mockApp
          .post("/admin/report/reject")
          .send({ reports: [] })
          .set("authorization", `Uid ${uid}`)
      );
    });
    it("should be rate limited", async () => {
      //GIVEN
      getReportsMock.mockResolvedValue([{ id: "1", reason: "one" } as any]);

      //WHEN
      await expect(
        mockApp
          .post("/admin/report/reject")
          .send({ reports: [{ reportId: "1" }] })
          .set("authorization", `Uid ${uid}`)
      ).toBeRateLimited({ max: 1, windowMs: 5000 });
    });
  });
  describe("send forgot password email", () => {
    const sendForgotPasswordEmailMock = vi.spyOn(
      AuthUtil,
      "sendForgotPasswordEmail"
    );

    beforeEach(() => {
      sendForgotPasswordEmailMock.mockReset();
    });

    it("should send forgot password link", async () => {
      //GIVEN

      //WHEN
      const { body } = await mockApp
        .post("/admin/sendForgotPasswordEmail")
        .send({ email: "meowdec@example.com" })
        .set("authorization", `Uid ${uid}`)
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Password reset request email sent.",
        data: null,
      });

      expect(sendForgotPasswordEmailMock).toHaveBeenCalledWith(
        "meowdec@example.com"
      );
    });
    it("should be rate limited", async () => {
      //WHEN
      await expect(
        mockApp
          .post("/admin/sendForgotPasswordEmail")
          .send({ email: "meowdec@example.com" })
          .set("authorization", `Uid ${uid}`)
      ).toBeRateLimited({ max: 1, windowMs: 5000 });
    });
  });

  async function expectFailForNonAdmin(call: SuperTest): Promise<void> {
    isAdminMock.mockResolvedValue(false);
    const { body } = await call.expect(403);
    expect(body.message).toEqual("You don't have permission to do this.");
  }
  async function expectFailForDisabledEndpoint(call: SuperTest): Promise<void> {
    await enableAdminEndpoints(false);
    const { body } = await call.expect(503);
    expect(body.message).toEqual("Admin endpoints are currently disabled.");
  }
});
async function enableAdminEndpoints(enabled: boolean): Promise<void> {
  const mockConfig = _.merge(await configuration, {
    admin: { endpointsEnabled: enabled },
  });

  vi.spyOn(Configuration, "getCachedConfiguration").mockResolvedValue(
    mockConfig
  );
}
