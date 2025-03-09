import { MonkeyResponse } from "../../utils/monkey-response";
import { buildMonkeyMail } from "../../utils/monkey-mail";
import * as UserDAL from "../../dal/user";
import * as ReportDAL from "../../dal/report";
import GeorgeQueue from "../../queues/george-queue";
import { sendForgotPasswordEmail as authSendForgotPasswordEmail } from "../../utils/auth";
import {
  AcceptReportsRequest,
  RejectReportsRequest,
  SendForgotPasswordEmailRequest,
  ToggleBanRequest,
  ToggleBanResponse,
} from "@monkeytype/contracts/admin";
import MonkeyError, { getErrorMessage } from "../../utils/error";
import { Configuration } from "@monkeytype/contracts/schemas/configuration";
import { addImportantLog } from "../../dal/logs";
import { MonkeyRequest } from "../types";

export async function test(_req: MonkeyRequest): Promise<MonkeyResponse> {
  return new MonkeyResponse("OK", null);
}

export async function toggleBan(
  req: MonkeyRequest<undefined, ToggleBanRequest>
): Promise<ToggleBanResponse> {
  const { uid } = req.body;

  const user = await UserDAL.getPartialUser(uid, "toggle ban", [
    "banned",
    "discordId",
  ]);
  const discordId = user.discordId;
  const discordIdIsValid = discordId !== undefined && discordId !== "";

  await UserDAL.setBanned(uid, !user.banned);
  if (discordIdIsValid) await GeorgeQueue.userBanned(discordId, !user.banned);

  void addImportantLog("user_ban_toggled", { banned: !user.banned }, uid);

  return new MonkeyResponse(`Ban toggled`, {
    banned: !user.banned,
  });
}

export async function acceptReports(
  req: MonkeyRequest<undefined, AcceptReportsRequest>
): Promise<MonkeyResponse> {
  await handleReports(
    req.body.reports.map((it) => ({ ...it })),
    true,
    req.ctx.configuration.users.inbox
  );
  return new MonkeyResponse("Reports removed and users notified.", null);
}

export async function rejectReports(
  req: MonkeyRequest<undefined, RejectReportsRequest>
): Promise<MonkeyResponse> {
  await handleReports(
    req.body.reports.map((it) => ({ ...it })),
    false,
    req.ctx.configuration.users.inbox
  );
  return new MonkeyResponse("Reports removed and users notified.", null);
}

export async function handleReports(
  reports: { reportId: string; reason?: string }[],
  accept: boolean,
  inboxConfig: Configuration["users"]["inbox"]
): Promise<void> {
  const reportIds = reports.map(({ reportId }) => reportId);

  const reportsFromDb = await ReportDAL.getReports(reportIds);
  const reportById = new Map(reportsFromDb.map((it) => [it.id, it]));

  const existingReportIds = reportsFromDb.map((report) => report.id);
  const missingReportIds = reportIds.filter(
    (reportId) => !existingReportIds.includes(reportId)
  );

  if (missingReportIds.length > 0) {
    throw new MonkeyError(
      404,
      `Reports not found for some IDs ${missingReportIds.join(",")}`
    );
  }

  await ReportDAL.deleteReports(reportIds);

  for (const { reportId, reason } of reports) {
    try {
      const report = reportById.get(reportId);
      if (!report) {
        throw new MonkeyError(404, `Report not found for ID: ${reportId}`);
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
      await UserDAL.addToInbox(report.uid, [mail], inboxConfig);
    } catch (e) {
      if (e instanceof MonkeyError) {
        throw new MonkeyError(e.status, e.message);
      } else {
        throw new MonkeyError(
          500,
          "Error handling reports: " + getErrorMessage(e)
        );
      }
    }
  }
}

export async function sendForgotPasswordEmail(
  req: MonkeyRequest<undefined, SendForgotPasswordEmailRequest>
): Promise<MonkeyResponse> {
  const { email } = req.body;
  await authSendForgotPasswordEmail(email);
  return new MonkeyResponse("Password reset request email sent.", null);
}
