import { MonkeyResponse } from "../../utils/monkey-response";
import { ObjectId } from "mongodb";
import * as db from "../../init/db";
import MonkeyError from "../../utils/error";
import { buildMonkeyMail } from "../../utils/monkey-mail";
import * as UserDAL from "../../dal/user";

export async function test(): Promise<MonkeyResponse> {
  return new MonkeyResponse("OK");
}

const COLLECTION_NAME = "reports";
async function removeReportFromDb(reportId: string): Promise<void> {
  const query = { _id: new ObjectId(reportId) };
  const result = await db
    .collection<MonkeyTypes.Report>(COLLECTION_NAME)
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
    let acceptedReports = 0;
    console.log("code added");
    for (const { reportId, verdict } of reports) {
      if (verdict === true) {
        acceptedReports++;
        const query = { _id: new ObjectId(reportId) };
        const report = await db
          .collection<MonkeyTypes.Report>(COLLECTION_NAME)
          .findOne(query);
        if (!report) {
          throw new MonkeyError(404, "Report not found.");
        }
        const mail = buildMonkeyMail({
          subject: "Report approved",
          body: `Your report for the ${report.type}: ${report.contentId} was approved. Thanks.`,
        });
        await UserDAL.addToInbox(
          report.uid,
          [mail],
          req.ctx.configuration.users.inbox
        );
        await removeReportFromDb(reportId);
      }
    }
    if (acceptedReports === 0) {
      return new MonkeyResponse("No accepted reports.");
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
    let rejectedReports = 0;
    for (const { reportId, verdict } of reports) {
      if (verdict === false) {
        rejectedReports++;
        const query = { _id: new ObjectId(reportId) };
        const report = await db
          .collection<MonkeyTypes.Report>(COLLECTION_NAME)
          .findOne(query);
        if (!report) {
          throw new MonkeyError(404, "Report not found.");
        }
        const mail = buildMonkeyMail({
          subject: "Report not approved",
          body: `Your report for the ${report.type}: ${report.contentId} was not approved.`,
        });
        await UserDAL.addToInbox(
          report.uid,
          [mail],
          req.ctx.configuration.users.inbox
        );
        await removeReportFromDb(reportId);
      }
    }
    if (rejectedReports === 0) {
      return new MonkeyResponse("No rejected reports.");
    }
    return new MonkeyResponse("Rejected reports removed and users notified.");
  } catch (e) {
    return new MonkeyResponse(e.message, e.status);
  }
}
