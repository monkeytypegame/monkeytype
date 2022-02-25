import _ from "lodash";
import { v4 as uuidv4 } from "uuid";
import UserDAO from "../../dao/user";
import ReportDAO from "../../dao/report";
import QuoteRatingsDAO from "../../dao/quote-ratings";
import UsersDAO from "../../dao/user";
import MonkeyError from "../../handlers/error";
import { verify } from "../../handlers/captcha";
import Logger from "../../handlers/logger";
import { MonkeyResponse } from "../../handlers/monkey-response";

class QuotesController {
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

    const user = await UsersDAO.getUser(uid);
    if (user.cannotReport) {
      throw new MonkeyError(403, "You don't have permission to do this.");
    }

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
