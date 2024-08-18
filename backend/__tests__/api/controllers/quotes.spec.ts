import request from "supertest";
import app from "../../../src/app";
import * as Configuration from "../../../src/init/configuration";
import * as UserDal from "../../../src/dal/user";
import * as NewQuotesDAL from "../../../src/dal/new-quotes";
import * as Captcha from "../../../src/utils/captcha";
import { ObjectId } from "mongodb";
import _ from "lodash";
import { verify } from "crypto";

const mockApp = request(app);
const configuration = Configuration.getCachedConfiguration();

const uid = new ObjectId().toHexString();

describe("QuotesController", () => {
  beforeEach(() => {
    enableQuotes(true);
  });

  describe("getQuotes", () => {
    const getPartialUserMock = vi.spyOn(UserDal, "getPartialUser");
    const getUserMock = vi.spyOn(UserDal, "getUser"); //TODO remove
    const getQuotesMock = vi.spyOn(NewQuotesDAL, "get");

    beforeEach(() => {
      const user = { quoteMod: true } as any;

      getPartialUserMock.mockReset();
      getPartialUserMock.mockResolvedValue(user);

      getUserMock.mockReset();
      getUserMock.mockResolvedValue(user);

      getQuotesMock.mockReset();
      getQuotesMock.mockResolvedValue([]);
    });
    it("should return quotes", async () => {
      //GIVEN
      const quoteOne: MonkeyTypes.NewQuote = {
        _id: new ObjectId(),
        text: "test",
        source: "Bob",
        language: "english",
        submittedBy: "Kevin",
        timestamp: 1000,
        approved: true,
      };
      const quoteTwo: MonkeyTypes.NewQuote = {
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
      getPartialUserMock.mockResolvedValue({ quoteMod: "english" } as any);

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
      getPartialUserMock.mockResolvedValue({ quoteMod: false } as any);
      getUserMock.mockResolvedValue({ quoteMod: false } as any);

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
      getPartialUserMock.mockResolvedValue({ quoteMod: "" } as any);
      getUserMock.mockResolvedValue({ quoteMod: false } as any);

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
      await mockApp.get("/quotes").send().expect(401);
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
      enableQuotes(false);

      //WHEN
      const { body } = await mockApp
        .get("/quotes/isSubmissionEnabled")
        .expect(200);

      expect(body).toEqual({
        message: "Quote submission disabled",
        data: { isEnabled: false },
      });
    });
  });
  describe("addQuote", () => {
    const addQuoteMock = vi.spyOn(NewQuotesDAL, "add");
    const getPartialUserMock = vi.spyOn(UserDal, "getPartialUser");
    const verifyCaptchaMock = vi.spyOn(Captcha, "verify");

    beforeEach(() => {
      addQuoteMock.mockReset();
      addQuoteMock.mockResolvedValue({} as any);

      getPartialUserMock.mockReset();
      getPartialUserMock.mockResolvedValue({ name: "Bob" } as any);

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
      await mockApp.post("/quotes").send().expect(401);
    });
    it("should fail without mandatory properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/quotes")
        .set("authorization", `Uid ${uid}`)
        .expect(422);

      expect(body.message).toEqual("Please fill all the fields");
      /* TODO:
      expect(body).toEqual({
        message: "",
      });*/
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
      expect(body.message).toEqual("Please fill all the fields");
      /* TODO:
      expect(body).toEqual({
        message: "",
      });*/
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
});

async function enableQuotes(enabled: boolean): Promise<void> {
  const mockConfig = _.merge(await configuration, {
    quotes: { submissionsEnabled: enabled },
  });

  vi.spyOn(Configuration, "getCachedConfiguration").mockResolvedValue(
    mockConfig
  );
}
