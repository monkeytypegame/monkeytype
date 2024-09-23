import _ from "lodash";
import { v4 as uuidv4 } from "uuid";
import { getPartialUser, updateQuoteRatings } from "../../dal/user";
import * as ReportDAL from "../../dal/report";
import * as NewQuotesDAL from "../../dal/new-quotes";
import * as QuoteRatingsDAL from "../../dal/quote-ratings";
import MonkeyError from "../../utils/error";
import { verify } from "../../utils/captcha";
import { MonkeyResponse } from "../../utils/monkey-response";
import { ObjectId } from "mongodb";
import { addLog } from "../../dal/logs";
import {
  AddQuoteRatingRequest,
  AddQuoteRequest,
  ApproveQuoteRequest,
  ApproveQuoteResponse,
  GetQuoteRatingQuery,
  GetQuoteRatingResponse,
  GetQuotesResponse,
  IsSubmissionEnabledResponse,
  RejectQuoteRequest,
  ReportQuoteRequest,
} from "@monkeytype/contracts/quotes";
import { replaceObjectId, replaceObjectIds } from "../../utils/misc";
import { MonkeyRequest } from "../types";

async function verifyCaptcha(captcha: string): Promise<void> {
  if (!(await verify(captcha))) {
    throw new MonkeyError(422, "Captcha check failed");
  }
}

export async function getQuotes(
  req: MonkeyRequest
): Promise<GetQuotesResponse> {
  const { uid } = req.ctx.decodedToken;
  const quoteMod = (await getPartialUser(uid, "get quotes", ["quoteMod"]))
    .quoteMod;
  const quoteModString = quoteMod === true ? "all" : (quoteMod as string);

  const data = await NewQuotesDAL.get(quoteModString);
  return new MonkeyResponse(
    "Quote submissions retrieved",
    replaceObjectIds(data)
  );
}

export async function isSubmissionEnabled(
  req: MonkeyRequest
): Promise<IsSubmissionEnabledResponse> {
  const { submissionsEnabled } = req.ctx.configuration.quotes;
  return new MonkeyResponse(
    "Quote submission " + (submissionsEnabled ? "enabled" : "disabled"),
    { isEnabled: submissionsEnabled }
  );
}

export async function addQuote(
  req: MonkeyRequest<undefined, AddQuoteRequest>
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { text, source, language, captcha } = req.body;

  await verifyCaptcha(captcha);

  await NewQuotesDAL.add(text, source, language, uid);
  return new MonkeyResponse("Quote submission added", null);
}

export async function approveQuote(
  req: MonkeyRequest<undefined, ApproveQuoteRequest>
): Promise<ApproveQuoteResponse> {
  const { uid } = req.ctx.decodedToken;
  const { quoteId, editText, editSource } = req.body;

  const { name } = await getPartialUser(uid, "approve quote", ["name"]);

  if (!name) {
    throw new MonkeyError(500, "Missing name field");
  }

  const data = await NewQuotesDAL.approve(quoteId, editText, editSource, name);
  void addLog("system_quote_approved", data, uid);

  return new MonkeyResponse(data.message, data.quote);
}

export async function refuseQuote(
  req: MonkeyRequest<undefined, RejectQuoteRequest>
): Promise<MonkeyResponse> {
  const { quoteId } = req.body;

  await NewQuotesDAL.refuse(quoteId);
  return new MonkeyResponse("Quote refused", null);
}

export async function getRating(
  req: MonkeyRequest<GetQuoteRatingQuery>
): Promise<GetQuoteRatingResponse> {
  const { quoteId, language } = req.query;

  const data = await QuoteRatingsDAL.get(quoteId, language);

  return new MonkeyResponse("Rating retrieved", replaceObjectId(data));
}

export async function submitRating(
  req: MonkeyRequest<undefined, AddQuoteRatingRequest>
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { quoteId, rating, language } = req.body;

  const user = await getPartialUser(uid, "submit rating", ["quoteRatings"]);

  const userQuoteRatings = user.quoteRatings ?? {};
  const currentRating = userQuoteRatings[language]?.[quoteId] ?? 0;

  const newRating = rating - currentRating;
  const shouldUpdateRating = currentRating !== 0;

  await QuoteRatingsDAL.submit(
    quoteId,
    language,
    newRating,
    shouldUpdateRating
  );

  _.setWith(userQuoteRatings, `[${language}][${quoteId}]`, rating, Object);

  await updateQuoteRatings(uid, userQuoteRatings);

  const responseMessage = `Rating ${
    shouldUpdateRating ? "updated" : "submitted"
  }`;
  return new MonkeyResponse(responseMessage, null);
}

export async function reportQuote(
  req: MonkeyRequest<undefined, ReportQuoteRequest>
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const {
    reporting: { maxReports, contentReportLimit },
  } = req.ctx.configuration.quotes;

  const { quoteId, quoteLanguage, reason, comment, captcha } = req.body;

  await verifyCaptcha(captcha);

  const newReport: ReportDAL.DBReport = {
    _id: new ObjectId(),
    id: uuidv4(),
    type: "quote",
    timestamp: new Date().getTime(),
    uid,
    contentId: `${quoteLanguage}-${quoteId}`,
    reason,
    comment: comment ?? "",
  };

  await ReportDAL.createReport(newReport, maxReports, contentReportLimit);

  return new MonkeyResponse("Quote reported", null);
}
