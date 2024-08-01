import request from "supertest";
import app from "../../../src/app";
import * as PublicDal from "../../../src/dal/public";
const mockApp = request(app);

describe("PublicController", () => {
  describe("get speed histogram", () => {
    const getSpeedHistogramMock = vi.spyOn(PublicDal, "getSpeedHistogram");

    afterEach(() => {
      getSpeedHistogramMock.mockReset();
    });

    it("gets for english time 60", async () => {
      //GIVEN
      getSpeedHistogramMock.mockResolvedValue({ "0": 1, "10": 2 });

      //WHEN
      const { body } = await mockApp
        .get("/public/speedHistogram")
        .query({ language: "english", mode: "time", mode2: "60" });
      //.expect(200);
      console.log(body);

      //THEN
      expect(body).toEqual({
        message: "Public speed histogram retrieved",
        data: { "0": 1, "10": 2 },
      });

      expect(getSpeedHistogramMock).toHaveBeenCalledWith(
        "english",
        "time",
        "60"
      );
    });

    it("gets for mode", async () => {
      for (const mode in ["time", "words", "quote", "zen", "custom"]) {
        await mockApp
          .get("/public/speedHistogram")
          .query({ language: "english", mode, mode2: "custom" })
          .expect(200);
      }
    });

    it("gets for mode2", async () => {
      for (const mode2 of [
        "10",
        "25",
        "50",
        "100",
        "15",
        "30",
        "60",
        "120",
        "zen",
        "custom",
      ]) {
        await mockApp
          .get("/public/speedHistogram")
          .query({ language: "english", mode: "words", mode2 })
          .expect(200);
      }
    });

    it("fails for missing query", async () => {
      const { body } = await mockApp.get("/public/speedHistogram").expect(422);

      //TODO
      /*expect(body).toEqual({
        message: "...",
        data: null,
      });
      */
    });
    it("fails for unknown query", async () => {
      const { body } = await mockApp
        .get("/public/speedHistogram")
        .query({
          language: "english",
          mode: "time",
          mode2: "60",
          extra: "value",
        })
        .expect(422);

      //TODO
      /*expect(body).toEqual({
          message: "...",
          data: null,
        });
        */
    });
  });
  describe("get typing stats", () => {
    const getTypingStatsMock = vi.spyOn(PublicDal, "getTypingStats");

    afterEach(() => {
      getTypingStatsMock.mockReset();
    });

    it("gets without authentication", async () => {
      //GIVEN
      getTypingStatsMock.mockResolvedValue({
        testsCompleted: 23,
        testsStarted: 42,
        timeTyping: 1000,
      } as any);

      //WHEN
      const { body } = await mockApp.get("/public/typingStats").expect(200);

      //THEN
      expect(body).toEqual({
        message: "Public typing stats retrieved",
        data: {
          testsCompleted: 23,
          testsStarted: 42,
          timeTyping: 1000,
        },
      });
    });
  });
});
