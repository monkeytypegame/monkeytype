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
        .query({ language: "english", mode: "time", mode2: "60" })
        .expect(200);

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
      for (const mode of ["time", "words", "quote", "zen", "custom"]) {
        const response = await mockApp
          .get("/public/speedHistogram")
          .query({ language: "english", mode, mode2: "custom" });
        expect(response.status, "for mode " + mode).toEqual(200);
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
        const response = await mockApp
          .get("/public/speedHistogram")
          .query({ language: "english", mode: "words", mode2 });

        expect(response.status, "for mode2 " + mode2).toEqual(200);
      }
    });
    it("fails for missing query", async () => {
      const { body } = await mockApp.get("/public/speedHistogram").expect(422);

      expect(body).toEqual({
        message: "Invalid query schema",
        validationErrors: [
          '"language" Required',
          '"mode" Required',
          '"mode2" Needs to be either a number, "zen" or "custom".',
        ],
      });
    });
    it("fails for invalid query", async () => {
      const { body } = await mockApp
        .get("/public/speedHistogram")
        .query({
          language: "en?gli.sh",
          mode: "unknownMode",
          mode2: "unknownMode2",
        })
        .expect(422);

      expect(body).toEqual({
        message: "Invalid query schema",
        validationErrors: [
          '"language" Can only contain letters [a-zA-Z0-9_+]',
          `"mode" Invalid enum value. Expected 'time' | 'words' | 'quote' | 'custom' | 'zen', received 'unknownMode'`,
          '"mode2" Needs to be a number or a number represented as a string e.g. "10".',
        ],
      });
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

      expect(body).toEqual({
        message: "Invalid query schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
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
