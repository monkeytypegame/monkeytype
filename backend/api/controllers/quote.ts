import _ from "lodash";
import { v4 as uuidv4 } from "uuid";
import UserDAO from "../../dao/user";
import ReportDAO from "../../dao/report";
import NewQuotesDao from "../../dao/new-quotes";
import QuoteRatingsDAO from "../../dao/quote-ratings";
import MonkeyError from "../../utils/error";
import { verify } from "../../utils/captcha";
import Logger from "../../utils/logger";
import { MonkeyResponse } from "../../utils/monkey-response";

async function verifyCaptcha(captcha: string): Promise<void> {
  if (!(await verify(captcha))) {
    throw new MonkeyError(422, "Captcha check failed");
  }
}

export async function getQuotes(
  _req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const data = await NewQuotesDao.get();
  return new MonkeyResponse("Quote submissions retrieved", data);
}

export async function addQuote(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { text, source, language, captcha } = req.body;

  await verifyCaptcha(captcha);

  await NewQuotesDao.add(text, source, language, uid);
  return new MonkeyResponse("Quote submission added");
}

export async function approveQuote(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { quoteId, editText, editSource } = req.body;

  const data = await NewQuotesDao.approve(quoteId, editText, editSource);
  Logger.logToDb("system_quote_approved", data, uid);

  return new MonkeyResponse(data.message, data.quote);
}

export async function refuseQuote(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { quoteId } = req.body;

  await NewQuotesDao.refuse(quoteId);
  return new MonkeyResponse("Quote refused");
}

export async function getRating(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { quoteId, language } = req.query;

  const data = await QuoteRatingsDAO.get(
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

  const user = await UserDAO.getUser(uid);
  if (!user) {
    throw new MonkeyError(401, "User not found.");
  }

  const normalizedQuoteId = parseInt(quoteId as string, 10);
  const normalizedRating = Math.round(parseInt(rating as string, 10));

  const userQuoteRatings = user.quoteRatings ?? {};
  const currentRating = userQuoteRatings[language]?.[normalizedQuoteId] ?? 0;

  const newRating = normalizedRating - currentRating;
  const shouldUpdateRating = currentRating !== 0;

  await QuoteRatingsDAO.submit(
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

  await UserDAO.updateQuoteRatings(uid, userQuoteRatings);

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
    id: uuidv4(),
    type: "quote",
    timestamp: new Date().getTime(),
    uid,
    contentId: `${quoteLanguage}-${quoteId}`,
    reason,
    comment,
  };

  await ReportDAO.createReport(newReport, maxReports, contentReportLimit);

  return new MonkeyResponse("Quote reported");
}
