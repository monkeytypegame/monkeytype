import request from "supertest";
import app from "../../../src/app";

import { ObjectId } from "mongodb";
import * as Misc from "../../../src/utils/misc";

const uid = new ObjectId().toHexString();
const mockApp = request(app);

describe("DevController", () => {
  describe("generate testData", () => {
    const isDevEnvironmentMock = vi.spyOn(Misc, "isDevEnvironment");

    beforeEach(() => {
      isDevEnvironmentMock.mockReset();
      isDevEnvironmentMock.mockReturnValue(true);
    });
    it("should fail on prod", async () => {
      //GIVEN
      isDevEnvironmentMock.mockReturnValue(false);
      //WHEN
      const { body } = await mockApp
        .post("/dev/generateData")
        .send({ username: "test" })
        .expect(503);
      //THEN
      expect(body.message).toEqual(
        "Development endpoints are only available in DEV mode."
      );
    });
  });
});
