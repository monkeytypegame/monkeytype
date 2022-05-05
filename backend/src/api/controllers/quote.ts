import _ from "lodash";
import { v4 as uuidv4 } from "uuid";
import { getUser, updateQuoteRatings } from "../../dal/user";
import * as ReportDAL from "../../dal/report";
import * as NewQuotesDAL from "../../dal/new-quotes";
import * as QuoteRatingsDAL from "../../dal/quote-ratings";
import MonkeyError from "../../utils/error";
import { verify } from "../../utils/captcha";
import Logger from "../../utils/logger";
import { MonkeyResponse } from "../../utils/monkey-response";
import { ObjectId } from "mongodb";

async function verifyCaptcha(captcha: string): Promise<void> {
  if (!(await verify(captcha))) {
    throw new MonkeyError(422, "Captcha check failed");
  }
}

export async function getQuotes(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const quoteMod: boolean | undefined | string = (
    await getUser(uid, "get quotes")
  ).quoteMod;
  let quoteModString: string;
  if (quoteMod === true) {
    quoteModString = "all";
  } else if (quoteMod !== false && quoteMod !== undefined) {
    quoteModString = quoteMod;
  } else {
    throw new MonkeyError(403, "You are not allowed to view submitted quotes");
  }
  const data = await NewQuotesDAL.get(quoteModString);
  return new MonkeyResponse("Quote submissions retrieved", data);
}

export async function addQuote(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { text, source, language, captcha } = req.body;

  await verifyCaptcha(captcha);

  await NewQuotesDAL.add(text, source, language, uid);
  return new MonkeyResponse("Quote submission added");
}

export async function approveQuote(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { quoteId, editText, editSource } = req.body;

  const { name } = await getUser(uid, "approve quote");

  if (!name) {
    throw new MonkeyError(500, "Missing name field");
  }

  const data = await NewQuotesDAL.approve(quoteId, editText, editSource, name);
  Logger.logToDb("system_quote_approved", data, uid);

  return new MonkeyResponse(data.message, data.quote);
}

export async function refuseQuote(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { quoteId } = req.body;

  await NewQuotesDAL.refuse(quoteId);
  return new MonkeyResponse("Quote refused");
}

export async function getRating(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { quoteId, language } = req.query;

  const data = await QuoteRatingsDAL.get(
    parseInt(quoteId as string, 10),
    language as string
  );

  return new MonkeyResponse("Rating retrieved", data);
}

export async function submitRating(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { quoteId, rating, language } = req.body;

  const user = await getUser(uid, "submit rating");

  const normalizedQuoteId = parseInt(quoteId as string, 10);
  const normalizedRating = Math.round(parseInt(rating as string, 10));

  const userQuoteRatings = user.quoteRatings ?? {};
  const currentRating = userQuoteRatings[language]?.[normalizedQuoteId] ?? 0;

  const newRating = normalizedRating - currentRating;
  const shouldUpdateRating = currentRating !== 0;

  await QuoteRatingsDAL.submit(
    quoteId,
    language,
    newRating,
    shouldUpdateRating
  );

  _.setWith(
    userQuoteRatings,
    `[${language}][${normalizedQuoteId}]`,
    normalizedRating,
    Object
  );

  await updateQuoteRatings(uid, userQuoteRatings);

  const responseMessage = `Rating ${
    shouldUpdateRating ? "updated" : "submitted"
  }`;
  return new MonkeyResponse(responseMessage);
}

export async function reportQuote(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const {
    quoteReport: { maxReports, contentReportLimit },
  } = req.ctx.configuration;

  const { quoteId, quoteLanguage, reason, comment, captcha } = req.body;

  await verifyCaptcha(captcha);

  const newReport: MonkeyTypes.Report = {
    _id: new ObjectId(),
    id: uuidv4(),
    type: "quote",
    timestamp: new Date().getTime(),
    uid,
    contentId: `${quoteLanguage}-${quoteId}`,
    reason,
    comment,
  };

  await ReportDAL.createReport(newReport, maxReports, contentReportLimit);

  return new MonkeyResponse("Quote reported");
}
