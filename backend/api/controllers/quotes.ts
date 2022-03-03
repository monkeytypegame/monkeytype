import _ from "lodash";
import { v4 as uuidv4 } from "uuid";
import UserDAO from "../../dao/user";
import ReportDAO from "../../dao/report";
import NewQuotesDao from "../../dao/new-quotes";
import QuoteRatingsDAO from "../../dao/quote-ratings";
import MonkeyError from "../../handlers/error";
import { verify } from "../../handlers/captcha";
import Logger from "../../handlers/logger";
import { MonkeyResponse } from "../../handlers/monkey-response";

class QuotesController {
  static async getQuotes(_req: MonkeyTypes.Request): Promise<MonkeyResponse> {
    const data = await NewQuotesDao.get();
    return new MonkeyResponse("Quote submissions retrieved", data);
  }

  static async addQuote(req: MonkeyTypes.Request): Promise<MonkeyResponse> {
    const { uid } = req.ctx.decodedToken;
    const { text, source, language, captcha } = req.body;

    if (!(await verify(captcha))) {
      throw new MonkeyError(400, "Captcha check failed");
    }

    await NewQuotesDao.add(text, source, language, uid);
    return new MonkeyResponse("Quote submission added");
  }

  static async approveQuote(req: MonkeyTypes.Request): Promise<MonkeyResponse> {
    const { uid } = req.ctx.decodedToken;
    const { quoteId, editText, editSource } = req.body;

    const data = await NewQuotesDao.approve(quoteId, editText, editSource);
    Logger.log("system_quote_approved", data, uid);

    return new MonkeyResponse(data.message, data.quote);
  }

  static async refuseQuote(req: MonkeyTypes.Request): Promise<MonkeyResponse> {
    const { quoteId } = req.body;

    await NewQuotesDao.refuse(quoteId);
    return new MonkeyResponse("Quote refused");
  }

  static async getRating(req: MonkeyTypes.Request): Promise<MonkeyResponse> {
    const { quoteId, language } = req.query;

    const data = await QuoteRatingsDAO.get(
      parseInt(quoteId as string),
      language
    );

    return new MonkeyResponse("Rating retrieved", data);
  }

  static async submitRating(req: MonkeyTypes.Request): Promise<MonkeyResponse> {
    const { uid } = req.ctx.decodedToken;
    const { quoteId, rating, language } = req.body;

    const user = await UserDAO.getUser(uid);
    if (!user) {
      throw new MonkeyError(401, "User not found.");
    }

    const normalizedQuoteId = parseInt(quoteId as string);
    const normalizedRating = Math.round(parseInt(rating as string));

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

  static async reportQuote(req: MonkeyTypes.Request): Promise<MonkeyResponse> {
    const { uid } = req.ctx.decodedToken;
    const {
      quoteReport: { maxReports, contentReportLimit },
    } = req.ctx.configuration;

    const { quoteId, quoteLanguage, reason, comment, captcha } = req.body;

    if (!(await verify(captcha))) {
      throw new MonkeyError(400, "Captcha check failed.");
    }

    const newReport = {
      id: uuidv4(),
      type: "quote",
      timestamp: new Date().getTime(),
      uid,
      details: {
        contentId: `${quoteLanguage}-${quoteId}`,
        reason,
        comment,
      },
    };

    await ReportDAO.createReport(newReport, maxReports, contentReportLimit);

    Logger.log("report_created", {
      type: newReport.type,
      details: newReport.details,
    });

    return new MonkeyResponse("Quote reported");
  }
}

export default QuotesController;
