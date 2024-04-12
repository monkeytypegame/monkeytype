import { MonkeyResponse } from "../../utils/monkey-response";
import { ObjectId } from "mongodb";
import * as db from "../../init/db";
import MonkeyError from "../../utils/error";
import { buildMonkeyMail } from "../../utils/monkey-mail";
import * as UserDAL from "../../dal/user";

export async function test(): Promise<MonkeyResponse> {
  return new MonkeyResponse("OK");
}

const REPORTS_COLLECTION = "reports";
async function removeReportFromDb(reportId: string): Promise<void> {
  const query = { _id: new ObjectId(reportId) };
  const result = await db
    .collection<MonkeyTypes.Report>(REPORTS_COLLECTION)
    .deleteOne(query);
  if (result.deletedCount === 0) {
    throw new MonkeyError(404, "Report not found.");
  }
}

export async function acceptReports(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { reports } = req.body;
  try {
    for (const { reportId } of reports) {
      const query = { _id: new ObjectId(reportId) };
      const report = await db
        .collection<MonkeyTypes.Report>(REPORTS_COLLECTION)
        .findOne(query);
      if (!report) {
        throw new MonkeyError(404, "Report not found.");
      }
      const mailBody = `Your report for the ${report.type}: ${report.contentId} (for ${report.reason}) was approved.`;
      const mail = buildMonkeyMail({
        subject: "Report approved",
        body: mailBody,
      });
      await UserDAL.addToInbox(
        report.uid,
        [mail],
        req.ctx.configuration.users.inbox
      );
      await removeReportFromDb(reportId);
    }
    return new MonkeyResponse("Accepted reports removed and users notified.");
  } catch (e) {
    return new MonkeyResponse(e.message, e.status);
  }
}

export async function rejectReports(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { reports } = req.body;
  try {
    for (const { reportId, reason } of reports) {
      const query = { _id: new ObjectId(reportId) };
      const report = await db
        .collection<MonkeyTypes.Report>(REPORTS_COLLECTION)
        .findOne(query);
      if (!report) {
        throw new MonkeyError(404, "Report not found.");
      }
      const mailBody =
        `Your report for the ${report.type}: ${report.contentId} (for ${report.reason}) was not approved.` +
        (reason !== undefined ? `\nReason: ${reason}` : "");
      const mail = buildMonkeyMail({
        subject: "Report not approved",
        body: mailBody,
      });
      await UserDAL.addToInbox(
        report.uid,
        [mail],
        req.ctx.configuration.users.inbox
      );
      await removeReportFromDb(reportId);
    }
    return new MonkeyResponse("Rejected reports removed and users notified.");
  } catch (e) {
    return new MonkeyResponse(e.message, e.status);
  }
}
