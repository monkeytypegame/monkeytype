import { MonkeyResponse } from "../../utils/monkey-response";
import { ObjectId } from "mongodb";
import { buildMonkeyMail } from "../../utils/monkey-mail";
import * as UserDAL from "../../dal/user";
import * as ReportDAL from "../../dal/report";

export async function test(): Promise<MonkeyResponse> {
  return new MonkeyResponse("OK");
}

export async function acceptReports(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  return handleReports(req, true);
}

export async function rejectReports(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  return handleReports(req, false);
}

export async function handleReports(
  req: MonkeyTypes.Request,
  accept: boolean
): Promise<MonkeyResponse> {
  const { reports } = req.body;
  const reportIds = reports.map(({ reportId }) => new ObjectId(reportId));

  const reportsFromDb = await ReportDAL.getReports(reportIds);
  const existingReportIds = reportsFromDb.map((report) =>
    report._id.toString()
  );
  const missingReportIds = reportIds.filter(
    (reportId) => !existingReportIds.includes(reportId.toString())
  );

  if (missingReportIds.length > 0) {
    return new MonkeyResponse(
      `Reports not found for some IDs`,
      missingReportIds,
      404
    );
  }

  await ReportDAL.deleteReports(reportIds);

  // sorting both the arrays ensures one to one mapping as no reports are missing
  reports.sort((a, b) => a.reportId.localeCompare(b.reportId));
  reportsFromDb.sort((a, b) =>
    a._id.toString().localeCompare(b._id.toString())
  );
  for (let i = 0; i < reports.length; i++) {
    reports[i].report = reportsFromDb[i];
  }

  for (const { _, reason, report } of reports) {
    try {
      const mailBody =
        `Your report for the ${report.type}: ${report.contentId} (for ${report.reason}) was ` +
        (accept ? `approved.` : `denied.`) +
        (reason !== undefined ? `\nReason: ${reason}` : "");
      const mailSubject = accept ? "Report approved" : "Report denied";
      const mail = buildMonkeyMail({
        subject: mailSubject,
        body: mailBody,
      });
      await UserDAL.addToInbox(
        report.uid,
        [mail],
        req.ctx.configuration.users.inbox
      );
    } catch (e) {
      return new MonkeyResponse(e.message, null, e.status);
    }
  }
  return new MonkeyResponse("Reports removed and users notified.");
}
