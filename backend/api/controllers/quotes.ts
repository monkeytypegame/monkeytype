import { v4 as uuidv4 } from "uuid";
import ReportDAO from "../../dao/report";
import UsersDAO from "../../dao/user";
import MonkeyError from "../../handlers/error";
import { verify } from "../../handlers/captcha";
import Logger from "../../handlers/logger";
import { MonkeyResponse } from "../../handlers/monkey-response";

class QuotesController {
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

    return new MonkeyResponse("Quote reported successfully");
  }
}

export default QuotesController;
