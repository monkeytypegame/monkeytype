import request from "supertest";
import app from "../../../src/app";
import * as PsaDal from "../../../src/dal/psa";
import * as Prometheus from "../../../src/utils/prometheus";
import { ObjectId } from "mongodb";
import { mockBearerAuthentication } from "../../__testData__/auth";
const mockApp = request(app);
const uid = new ObjectId().toHexString();
const mockAuth = mockBearerAuthentication(uid);

describe("Psa Controller", () => {
  describe("get psa", () => {
    const getPsaMock = vi.spyOn(PsaDal, "get");
    const recordClientVersionMock = vi.spyOn(Prometheus, "recordClientVersion");

    afterEach(() => {
      getPsaMock.mockReset();
      recordClientVersionMock.mockReset();
      mockAuth.beforeEach();
    });

    it("get psas without authorization", async () => {
      //GIVEN
      const psaOne: PsaDal.DBPSA = {
        _id: new ObjectId(),
        message: "test2",
        date: 1000,
        level: 1,
        sticky: true,
      };
      const psaTwo: PsaDal.DBPSA = {
        _id: new ObjectId(),
        message: "test2",
        date: 2000,
        level: 2,
        sticky: false,
      };
      getPsaMock.mockResolvedValue([psaOne, psaTwo]);

      //WHEN
      const { body } = await mockApp.get("/psas").expect(200);

      //THEN
      expect(body).toEqual({
        message: "PSAs retrieved",
        data: [
          {
            _id: psaOne._id.toHexString(),
            date: 1000,
            level: 1,
            message: "test2",
            sticky: true,
          },
          {
            _id: psaTwo._id.toHexString(),
            date: 2000,
            level: 2,
            message: "test2",
            sticky: false,
          },
        ],
      });

      expect(recordClientVersionMock).toHaveBeenCalledWith("unknown");
    });
    it("get psas with authorization", async () => {
      await mockApp
        .get("/psas")
        .set("Authorization", `Bearer ${uid}`)
        .expect(200);
    });

    it("get psas records x-client-version", async () => {
      await mockApp.get("/psas").set("x-client-version", "1.0").expect(200);

      expect(recordClientVersionMock).toHaveBeenCalledWith("1.0");
    });
    it("get psas records client-version", async () => {
      await mockApp.get("/psas").set("client-version", "2.0").expect(200);

      expect(recordClientVersionMock).toHaveBeenCalledWith("2.0");
    });
  });
});
