import request from "supertest";
import app from "../../../src/app";
import * as Configuration from "../../../src/init/configuration";
import * as UserDal from "../../../src/dal/user";
import * as NewQuotesDal from "../../../src/dal/new-quotes";
import type { DBNewQuote } from "../../../src/dal/new-quotes";
import * as QuoteRatingsDal from "../../../src/dal/quote-ratings";
import * as ReportDal from "../../../src/dal/report";
import * as Captcha from "../../../src/utils/captcha";
import { ObjectId } from "mongodb";
import _ from "lodash";
import { ApproveQuote } from "@monkeytype/contracts/schemas/quotes";

const mockApp = request(app);
const configuration = Configuration.getCachedConfiguration();

const uid = new ObjectId().toHexString();

describe("QuotesController", () => {
  const getPartialUserMock = vi.spyOn(UserDal, "getPartialUser");

  beforeEach(() => {
    enableQuotes(true);

    const user = { quoteMod: true, name: "Bob" } as any;
    getPartialUserMock.mockReset().mockResolvedValue(user);
  });

  describe("getQuotes", () => {
    const getQuotesMock = vi.spyOn(NewQuotesDal, "get");

    beforeEach(() => {
      getQuotesMock.mockReset();
      getQuotesMock.mockResolvedValue([]);
    });
    it("should return quotes", async () => {
      //GIVEN
      const quoteOne: DBNewQuote = {
        _id: new ObjectId(),
        text: "test",
        source: "Bob",
        language: "english",
        submittedBy: "Kevin",
        timestamp: 1000,
        approved: true,
      };
      const quoteTwo: DBNewQuote = {
        _id: new ObjectId(),
        text: "test2",
        source: "Stuart",
        language: "english",
        submittedBy: "Kevin",
        timestamp: 2000,
        approved: false,
      };
      getQuotesMock.mockResolvedValue([quoteOne, quoteTwo]);

      //WHEN
      const { body } = await mockApp
        .get("/quotes")
        .set("authorization", `Uid ${uid}`)
        .expect(200);

      //THEN
      expect(body.message).toEqual("Quote submissions retrieved");
      expect(body.data).toEqual([
        { ...quoteOne, _id: quoteOne._id.toHexString() },
        {
          ...quoteTwo,
          _id: quoteTwo._id.toHexString(),
        },
      ]);

      expect(getQuotesMock).toHaveBeenCalledWith("all");
    });
    it("should return quotes with quoteMod", async () => {
      //GIVEN
      getPartialUserMock
        .mockReset()
        .mockResolvedValue({ quoteMod: "english" } as any);

      //WHEN
      await mockApp
        .get("/quotes")
        .set("authorization", `Uid ${uid}`)
        .expect(200);

      //THEN

      expect(getQuotesMock).toHaveBeenCalledWith("english");
    });
    it("should fail with quoteMod false", async () => {
      //GIVEN
      getPartialUserMock
        .mockReset()
        .mockResolvedValue({ quoteMod: false } as any);

      //WHEN
      const { body } = await mockApp
        .get("/quotes")
        .set("authorization", `Uid ${uid}`)
        .expect(403);

      //THEN
      expect(body.message).toEqual("You don't have permission to do this.");

      expect(getQuotesMock).not.toHaveBeenCalled();
    });
    it("should fail with quoteMod empty", async () => {
      //GIVEN
      getPartialUserMock.mockReset().mockResolvedValue({ quoteMod: "" } as any);

      //WHEN
      const { body } = await mockApp
        .get("/quotes")
        .set("authorization", `Uid ${uid}`)
        .expect(403);

      //THEN
      expect(body.message).toEqual("You don't have permission to do this.");

      expect(getQuotesMock).not.toHaveBeenCalled();
    });
    it("should fail without authentication", async () => {
      await mockApp.get("/quotes").expect(401);
    });
  });
  describe("isSubmissionsEnabled", () => {
    it("should return for quotes enabled without authentication", async () => {
      //GIVEN
      enableQuotes(true);

      //WHEN
      const { body } = await mockApp
        .get("/quotes/isSubmissionEnabled")
        .expect(200);

      expect(body).toEqual({
        message: "Quote submission enabled",
        data: { isEnabled: true },
      });
    });
    it("should return for quotes disabled without authentication", async () => {
      //GIVEN

      //WHEN
      const { body } = await mockApp
        .get("/quotes/isSubmissionEnabled")
        .expect(200);

      expect(body).toEqual({
        message: "Quote submission enabled",
        data: { isEnabled: true },
      });
    });
  });
  describe("addQuote", () => {
    const addQuoteMock = vi.spyOn(NewQuotesDal, "add");
    const verifyCaptchaMock = vi.spyOn(Captcha, "verify");

    beforeEach(() => {
      addQuoteMock.mockReset();
      addQuoteMock.mockResolvedValue({} as any);

      verifyCaptchaMock.mockReset();
      verifyCaptchaMock.mockResolvedValue(true);
    });

    it("should add quote", async () => {
      //GIVEN
      const newQuote = {
        text: new Array(60).fill("a").join(""),
        source: "Bob",
        language: "english",
        captcha: "captcha",
      };

      //WHEN
      const { body } = await mockApp
        .post("/quotes")
        .set("authorization", `Uid ${uid}`)
        .send(newQuote)
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Quote submission added",
        data: null,
      });

      expect(addQuoteMock).toHaveBeenCalledWith(
        newQuote.text,
        newQuote.source,
        newQuote.language,
        uid
      );

      expect(verifyCaptchaMock).toHaveBeenCalledWith(newQuote.captcha);
    });
    it("should fail without authentication", async () => {
      await mockApp.post("/quotes").expect(401);
    });
    it("should fail if feature is disabled", async () => {
      //GIVEN
      enableQuotes(false);

      //WHEN
      const { body } = await mockApp
        .post("/quotes")
        .set("authorization", `Uid ${uid}`)
        .expect(503);

      //THEN
      expect(body.message).toEqual(
        "Quote submission is disabled temporarily. The queue is quite long and we need some time to catch up."
      );
    });
    it("should fail without mandatory properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/quotes")
        .set("authorization", `Uid ${uid}`)
        .expect(422);

      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: [
          '"text" Required',
          '"source" Required',
          '"language" Required',
          '"captcha" Required',
        ],
      });
    });
    it("should fail with unknown properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/quotes")
        .send({
          text: new Array(60).fill("a").join(""),
          source: "Bob",
          language: "english",
          captcha: "captcha",
          extra: "value",
        })
        .set("authorization", `Uid ${uid}`)
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });
    it("should fail with invalid capture", async () => {
      //GIVEN
      verifyCaptchaMock.mockResolvedValue(false);

      //WHEN
      const { body } = await mockApp
        .post("/quotes")
        .send({
          text: new Array(60).fill("a").join(""),
          source: "Bob",
          language: "english",
          captcha: "captcha",
        })
        .set("authorization", `Uid ${uid}`)
        .expect(422);

      //THEN
      expect(body.message).toEqual("Captcha check failed");
    });
  });
  describe("approveQuote", () => {
    const approveQuoteMock = vi.spyOn(NewQuotesDal, "approve");

    beforeEach(() => {
      approveQuoteMock.mockReset();
    });

    it("should approve", async () => {
      //GiVEN
      const quoteId = new ObjectId().toHexString();
      const quote: ApproveQuote = {
        id: 100,
        text: "text",
        source: "source",
        length: 10,
        approvedBy: "Kevin",
      };
      approveQuoteMock.mockResolvedValue({
        message: "ok",
        quote,
      });

      //WHEN
      const { body } = await mockApp
        .post("/quotes/approve")
        .set("authorization", `Uid ${uid}`)
        .send({
          quoteId,
          editText: "editedText",
          editSource: "editedSource",
        })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "ok",
        data: quote,
      });

      expect(approveQuoteMock).toHaveBeenCalledWith(
        quoteId,
        "editedText",
        "editedSource",
        "Bob"
      );
    });
    it("should approve with optional parameters as null", async () => {
      //GiVEN
      const quoteId = new ObjectId().toHexString();
      approveQuoteMock.mockResolvedValue({
        message: "ok",
        quote: {} as any,
      });

      //WHEN
      const { body } = await mockApp
        .post("/quotes/approve")
        .set("authorization", `Uid ${uid}`)
        .send({ quoteId, editText: null, editSource: null })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "ok",
        data: {},
      });

      expect(approveQuoteMock).toHaveBeenCalledWith(
        quoteId,
        undefined,
        undefined,
        "Bob"
      );
    });
    it("should approve without optional parameters", async () => {
      //GiVEN
      const quoteId = new ObjectId().toHexString();
      approveQuoteMock.mockResolvedValue({
        message: "ok",
        quote: {} as any,
      });

      //WHEN
      const { body } = await mockApp
        .post("/quotes/approve")
        .set("authorization", `Uid ${uid}`)
        .send({ quoteId })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "ok",
        data: {},
      });

      expect(approveQuoteMock).toHaveBeenCalledWith(
        quoteId,
        undefined,
        undefined,
        "Bob"
      );
    });
    it("should fail without mandatory properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/quotes/approve")
        .set("authorization", `Uid ${uid}`)
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ['"quoteId" Required'],
      });
    });
    it("should fail with unknown properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/quotes/approve")
        .set("authorization", `Uid ${uid}`)
        .send({ quoteId: new ObjectId().toHexString(), extra: "value" })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });
    it("should fail if user is no quote mod", async () => {
      //GIVEN
      getPartialUserMock.mockReset().mockResolvedValue({} as any);

      //WHEN
      const { body } = await mockApp
        .post("/quotes/approve")
        .set("authorization", `Uid ${uid}`)
        .send({ quoteId: new ObjectId().toHexString() })
        .expect(403);

      //THEN
      expect(body.message).toEqual("You don't have permission to do this.");
    });
    it("should fail without authentication", async () => {
      await mockApp
        .post("/quotes/approve")
        .send({ quoteId: new ObjectId().toHexString() })
        .expect(401);
    });
  });
  describe("refuseQuote", () => {
    const refuseQuoteMock = vi.spyOn(NewQuotesDal, "refuse");

    beforeEach(() => {
      refuseQuoteMock.mockReset();
    });

    it("should refuse quote", async () => {
      //GIVEN
      const quoteId = new ObjectId().toHexString();

      //WHEN
      const { body } = await mockApp
        .post("/quotes/reject")
        .set("authorization", `Uid ${uid}`)
        .send({ quoteId })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Quote refused",
        data: null,
      });
      expect(refuseQuoteMock).toHaveBeenCalledWith(quoteId);
    });
    it("should fail without mandatory properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/quotes/reject")
        .set("authorization", `Uid ${uid}`)

        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ['"quoteId" Required'],
      });
    });
    it("should fail with unknown properties", async () => {
      //GIVEN
      const quoteId = new ObjectId().toHexString();

      //WHEN
      const { body } = await mockApp
        .post("/quotes/reject")
        .set("authorization", `Uid ${uid}`)
        .send({ quoteId, extra: "value" })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });
    it("should fail if user is no quote mod", async () => {
      //GIVEN
      getPartialUserMock.mockReset().mockResolvedValue({} as any);
      const quoteId = new ObjectId().toHexString();

      //WHEN
      const { body } = await mockApp
        .post("/quotes/reject")
        .set("authorization", `Uid ${uid}`)
        .send({ quoteId })
        .expect(403);

      //THEN
      expect(body.message).toEqual("You don't have permission to do this.");
    });
    it("should fail without authentication", async () => {
      await mockApp
        .post("/quotes/reject")
        .send({ quoteId: new ObjectId().toHexString() })
        .expect(401);
    });
  });
  describe("getRating", () => {
    const getRatingMock = vi.spyOn(QuoteRatingsDal, "get");

    beforeEach(() => {
      getRatingMock.mockReset();
    });

    it("should get", async () => {
      //GIVEN
      const quoteRating = {
        _id: new ObjectId(),
        average: 2,
        language: "english",
        quoteId: 23,
        ratings: 100,
        totalRating: 122,
      };
      getRatingMock.mockResolvedValue(quoteRating);

      //WHEN
      const { body } = await mockApp
        .get("/quotes/rating")
        .query({ quoteId: 42, language: "english" })
        .set("authorization", `Uid ${uid}`)
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Rating retrieved",
        data: { ...quoteRating, _id: quoteRating._id.toHexString() },
      });

      expect(getRatingMock).toHaveBeenCalledWith(42, "english");
    });
    it("should fail without mandatory query parameters", async () => {
      //WHEN
      const { body } = await mockApp
        .get("/quotes/rating")
        .set("authorization", `Uid ${uid}`)
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid query schema",
        validationErrors: ['"quoteId" Invalid input', '"language" Required'],
      });
    });
    it("should fail with unknown query parameters", async () => {
      //WHEN
      const { body } = await mockApp
        .get("/quotes/rating")
        .set("authorization", `Uid ${uid}`)
        .query({ quoteId: 42, language: "english", extra: "value" })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid query schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });
    it("should fail without authentication", async () => {
      await mockApp
        .get("/quotes/rating")
        .query({ quoteId: 42, language: "english" })
        .expect(401);
    });
  });
  describe("submitRating", () => {
    const updateQuotesRatingsMock = vi.spyOn(UserDal, "updateQuoteRatings");
    const submitQuoteRating = vi.spyOn(QuoteRatingsDal, "submit");

    beforeEach(() => {
      getPartialUserMock
        .mockReset()
        .mockResolvedValue({ quoteRatings: null } as any);

      updateQuotesRatingsMock.mockReset();
      submitQuoteRating.mockReset();
    });
    it("should submit new rating", async () => {
      //GIVEN

      //WHEN
      const { body } = await mockApp
        .post("/quotes/rating")
        .set("authorization", `Uid ${uid}`)
        .send({
          quoteId: 23,
          rating: 4,
          language: "english",
        })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Rating submitted",
        data: null,
      });

      expect(submitQuoteRating).toHaveBeenCalledWith(23, "english", 4, false);

      expect(updateQuotesRatingsMock).toHaveBeenCalledWith(uid, {
        english: { "23": 4 },
      });
    });
    it("should update existing rating", async () => {
      //GIVEN

      getPartialUserMock.mockReset().mockResolvedValue({
        quoteRatings: { german: { "4": 1 }, english: { "5": 5, "23": 4 } },
      } as any);

      //WHEN
      const { body } = await mockApp
        .post("/quotes/rating")
        .set("authorization", `Uid ${uid}`)
        .send({
          quoteId: 23,
          rating: 2,
          language: "english",
        })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Rating updated",
        data: null,
      });

      expect(submitQuoteRating).toHaveBeenCalledWith(23, "english", -2, true);

      expect(updateQuotesRatingsMock).toHaveBeenCalledWith(uid, {
        german: { "4": 1 },
        english: { "5": 5, "23": 2 },
      });
    });

    it("should update existing rating with same rating", async () => {
      //GIVEN

      getPartialUserMock.mockReset().mockResolvedValue({
        quoteRatings: { german: { "4": 1 }, english: { "5": 5, "23": 4 } },
      } as any);

      //WHEN
      const { body } = await mockApp
        .post("/quotes/rating")
        .set("authorization", `Uid ${uid}`)
        .send({
          quoteId: 23,
          rating: 4,
          language: "english",
        })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Rating updated",
        data: null,
      });

      expect(submitQuoteRating).toHaveBeenCalledWith(23, "english", 0, true);

      expect(updateQuotesRatingsMock).toHaveBeenCalledWith(uid, {
        german: { "4": 1 },
        english: { "5": 5, "23": 4 },
      });
    });

    it("should fail with missing mandatory parameter", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/quotes/rating")
        .set("authorization", `Uid ${uid}`)
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: [
          '"quoteId" Invalid input',
          '"language" Required',
          '"rating" Required',
        ],
      });
    });
    it("should fail with unknown parameter", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/quotes/rating")
        .set("authorization", `Uid ${uid}`)
        .send({ quoteId: 23, language: "english", rating: 5, extra: "value" })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });
    it("should fail with zero rating", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/quotes/rating")
        .set("authorization", `Uid ${uid}`)
        .send({ quoteId: 23, language: "english", rating: 0 })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: [
          '"rating" Number must be greater than or equal to 1',
        ],
      });
    });
    it("should fail with rating bigger than 5", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/quotes/rating")
        .set("authorization", `Uid ${uid}`)
        .send({ quoteId: 23, language: "english", rating: 6 })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ['"rating" Number must be less than or equal to 5'],
      });
    });

    it("should fail with non-integer rating", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/quotes/rating")
        .set("authorization", `Uid ${uid}`)
        .send({ quoteId: 23, language: "english", rating: 2.5 })
        .expect(422);
      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ['"rating" Expected integer, received float'],
      });
    });

    it("should fail without authentication", async () => {
      await mockApp.post("/quotes/rating").expect(401);
    });
  });
  describe("reportQuote", () => {
    const verifyCaptchaMock = vi.spyOn(Captcha, "verify");
    const createReportMock = vi.spyOn(ReportDal, "createReport");

    beforeEach(() => {
      enableQuoteReporting(true);

      verifyCaptchaMock.mockReset();
      verifyCaptchaMock.mockResolvedValue(true);

      createReportMock.mockReset();
    });

    it("should report quote", async () => {
      //GIVEN
      //WHEN
      const { body } = await mockApp
        .post("/quotes/report")
        .set("authorization", `Uid ${uid}`)
        .send({
          quoteId: "23", //quoteId is string on this endpoint
          quoteLanguage: "english",
          reason: "Inappropriate content",
          comment: "I don't like this.",
          captcha: "captcha",
        });
      //.expect(200);

      //THEN
      expect(body).toEqual({
        message: "Quote reported",
        data: null,
      });

      expect(verifyCaptchaMock).toHaveBeenCalledWith("captcha");

      expect(createReportMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "quote",
          uid,
          contentId: "english-23",
          reason: "Inappropriate content",
          comment: "I don't like this.",
        }),
        10, //configuration maxReport
        20 //configuration contentReportLimit
      );
    });

    it("should report quote without comment", async () => {
      await mockApp
        .post("/quotes/report")
        .set("authorization", `Uid ${uid}`)
        .send({
          quoteId: "23", //quoteId is string on this endpoint
          quoteLanguage: "english",
          reason: "Inappropriate content",
          captcha: "captcha",
        })
        .expect(200);
    });
    it("should report quote with empty comment", async () => {
      await mockApp
        .post("/quotes/report")
        .set("authorization", `Uid ${uid}`)
        .send({
          quoteId: "23", //quoteId is string on this endpoint
          quoteLanguage: "english",
          reason: "Inappropriate content",
          comment: "",
          captcha: "captcha",
        })
        .expect(200);
    });
    it("should fail without mandatory properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/quotes/report")
        .set("authorization", `Uid ${uid}`)
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: [
          '"quoteId" Invalid input',
          '"quoteLanguage" Required',
          '"reason" Required',
          '"captcha" Required',
        ],
      });
    });
    it("should fail if feature is disabled", async () => {
      //GIVEN
      enableQuoteReporting(false);

      //WHEN
      const { body } = await mockApp
        .post("/quotes/report")
        .set("authorization", `Uid ${uid}`)
        .expect(503);

      //THEN
      expect(body.message).toEqual("Quote reporting is unavailable.");
    });
    it("should fail if user cannot report", async () => {
      //GIVEN
      getPartialUserMock
        .mockReset()
        .mockResolvedValue({ canReport: false } as any);

      //WHEN
      const { body } = await mockApp
        .post("/quotes/report")
        .set("authorization", `Uid ${uid}`)
        .expect(403);

      //THEN
      expect(body.message).toEqual("You don't have permission to do this.");
    });
  });
});

async function enableQuotes(enabled: boolean): Promise<void> {
  const mockConfig = _.merge(await configuration, {
    quotes: { submissionsEnabled: enabled },
  });

  vi.spyOn(Configuration, "getCachedConfiguration").mockResolvedValue(
    mockConfig
  );
}

async function enableQuoteReporting(enabled: boolean): Promise<void> {
  const mockConfig = _.merge(await configuration, {
    quotes: { reporting: { enabled, maxReports: 10, contentReportLimit: 20 } },
  });

  vi.spyOn(Configuration, "getCachedConfiguration").mockResolvedValue(
    mockConfig
  );
}
