import request from "supertest";
import app from "../../../src/app";
import * as UserDal from "../../../src/dal/user";
import { ObjectId } from "mongodb";
const mockApp = request(app);

const uid = new ObjectId().toHexString();

describe("QuotesController", () => {
  describe("getQuotes", () => {
    const getPartialUserMock = vi.spyOn(UserDal, "getPartialUser");

    beforeEach(() => {
      getPartialUserMock.mockReset();
      getPartialUserMock.mockResolvedValue({
        quoteMod: true,
      } as MonkeyTypes.DBUser);
    });
    it("should return quotes", async () => {
      //GIVEN

      //WHEN
      const { body } = await mockApp
        .get("/quotes")
        .set("authorization", `Uid ${uid}`)
        .expect(200);

      //THEN
    });
  });
});
