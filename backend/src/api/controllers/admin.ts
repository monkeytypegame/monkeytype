import { MonkeyResponse } from "../../utils/monkey-response";
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
  const reportIds = reports.map(({ reportId }) => reportId);

  const reportsFromDb = await ReportDAL.getReports(reportIds);
  const reportById = new Map(reportsFromDb.map((it) => [it.id, it]));

  const existingReportIds = reportsFromDb.map((report) => report.id);
  const missingReportIds = reportIds.filter(
    (reportId) => !existingReportIds.includes(reportId)
  );

  if (missingReportIds.length > 0) {
    return new MonkeyResponse(
      `Reports not found for some IDs`,
      missingReportIds,
      404
    );
  }

  await ReportDAL.deleteReports(reportIds);

  for (const { reportId, reason } of reports) {
    try {
      const report = reportById.get(reportId);
      if (!report) {
        return new MonkeyResponse(
          `Report not found for ID: ${reportId}`,
          null,
          404
        );
      }

      let mailBody = "";
      if (accept) {
        mailBody = `Your report regarding ${report.type} ${
          report.contentId
        } (${report.reason.toLowerCase()}) has been approved. Thank you.`;
      } else {
        mailBody = `Sorry, but your report regarding ${report.type} ${
          report.contentId
        } (${report.reason.toLowerCase()}) has been denied. ${
          reason !== undefined ? `\nReason: ${reason}` : ""
        }`;
      }

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
