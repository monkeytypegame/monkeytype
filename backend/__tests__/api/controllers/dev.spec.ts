import { describe, it, expect, beforeEach, vi } from "vitest";
import { setup } from "../../__testData__/controller-test";
import * as Misc from "../../../src/utils/misc";

const { mockApp } = setup();
describe("DevController", () => {
  describe("generate testData", () => {
    const isDevEnvironmentMock = vi.spyOn(Misc, "isDevEnvironment");

    beforeEach(() => {
      isDevEnvironmentMock.mockClear();
      isDevEnvironmentMock.mockReturnValue(true);
    });

    it("should fail on prod", async () => {
      //GIVEN
      isDevEnvironmentMock.mockReturnValue(false);
      //WHEN
      const { body } = await mockApp
        .post("/dev/generateData")
        .set("Authorization", "Bearer 123456789")
        .send({ username: "test" })
        .expect(503);
      //THEN
      expect(body.message).toEqual(
        "Development endpoints are only available in DEV mode."
      );
    });
    it("should fail without mandatory properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/dev/generateData")
        .send({})
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: [`"username" Required`],
      });
    });
    it("should fail with unknown properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/dev/generateData")
        .send({ username: "Bob", extra: "value" })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });
  });
});
