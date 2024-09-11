import GeorgeQueue from "../../../src/queues/george-queue";
import crypto from "crypto";
import request from "supertest";
import app from "../../../src/app";

const mockApp = request(app);

describe("WebhooksController", () => {
  describe("githubRelease", () => {
    const georgeSendReleaseAnnouncementMock = vi.spyOn(
      GeorgeQueue,
      "sendReleaseAnnouncement"
    );
    const timingSafeEqualMock = vi.spyOn(crypto, "timingSafeEqual");

    beforeEach(() => {
      vi.stubEnv("GITHUB_WEBHOOK_SECRET", "GITHUB_WEBHOOK_SECRET");

      georgeSendReleaseAnnouncementMock.mockReset();
      timingSafeEqualMock.mockReset().mockReturnValue(true);
    });

    it("should announce release", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/webhooks/githubRelease")
        .set("x-hub-signature-256", "the-signature")
        .send({ action: "published", release: { id: 1 } })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Added release announcement task to queue",
        data: null,
      });

      expect(georgeSendReleaseAnnouncementMock).toHaveBeenCalledWith("1");
      expect(timingSafeEqualMock).toHaveBeenCalledWith(
        Buffer.from(
          "sha256=ff0f3080539e9df19153f6b5b5780f66e558d61038e6cf5ecf4efdc7266a7751"
        ),
        Buffer.from("the-signature")
      );
    });
    it("should ignore non-published actions", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/webhooks/githubRelease")
        .set("x-hub-signature-256", "the-signature")
        .send({ action: "created" })
        .expect(200);

      //THEN
      expect(body.message).toEqual("No action taken");
      expect(georgeSendReleaseAnnouncementMock).not.toHaveBeenCalled();
    });
    it("should ignore additional properties", async () => {
      //WHEN
      await mockApp
        .post("/webhooks/githubRelease")
        .set("x-hub-signature-256", "the-signature")
        .send({
          action: "published",
          extra: "value",
          release: { id: 1, extra2: "value" },
        })
        .expect(200);
    });
    it("should fail with missing releaseId", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/webhooks/githubRelease")
        .set("x-hub-signature-256", "the-signature")
        .send({ action: "published" })
        .expect(422);

      //THEN
      expect(body.message).toEqual('Missing property "release.id".');
    });
    it("should fail with missing GITHUB_WEBHOOK_SECRET", async () => {
      //GIVEN
      vi.stubEnv("GITHUB_WEBHOOK_SECRET", "");
      //WHEN
      const { body } = await mockApp
        .post("/webhooks/githubRelease")
        .set("x-hub-signature-256", "the-signature")
        .send({ action: "published", release: { id: 1 } })
        .expect(500);

      //THEN
      expect(body.message).toEqual("Missing Github Webhook Secret");
    });
    it("should fail without signature header", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/webhooks/githubRelease")
        .send({ action: "published", release: { id: 1 } })
        .expect(401);

      //THEN
      expect(body.message).toEqual("Missing Github signature header");
    });
    it("should fail with mismatched signature", async () => {
      //GIVEN
      timingSafeEqualMock.mockReturnValue(false);

      //WHEN
      const { body } = await mockApp
        .post("/webhooks/githubRelease")
        .set("x-hub-signature-256", "the-signature")
        .send({ action: "published", release: { id: 1 } })
        .expect(401);

      //THEN
      expect(body.message).toEqual("Github webhook signature invalid");
    });
  });
});
