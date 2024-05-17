import MonkeyError from "../utils/error";
import * as db from "../init/db";

const COLLECTION_NAME = "reports";
const reportCollection = () => db.collection<MonkeyTypes.Report>(COLLECTION_NAME);

async function getReports(reportIds: string[]): Promise<MonkeyTypes.Report[]> {
  return await reportCollection().find({ id: { $in: reportIds } }).toArray();
}

async function deleteReports(reportIds: string[]): Promise<void> {
  await reportCollection().deleteMany({ id: { $in: reportIds } });
}

async function createReport(report: MonkeyTypes.Report, maxReports: number, contentReportLimit: number): Promise<void> {
  if (report.type === "user" && report.contentId === report.uid) throw new MonkeyError(400, "You cannot report yourself.");

  if ((await reportCollection().estimatedDocumentCount()) >= maxReports) throw new MonkeyError(503, "Reports are not being accepted at this time due to a large backlog of reports. Please try again later.");

  const sameReports = await reportCollection().find({ contentId: report.contentId }).toArray();
  if (sameReports.length >= contentReportLimit) throw new MonkeyError(409, "A report limit for this content has been reached.");

  if (sameReports.some(r => r.uid === report.uid)) throw new MonkeyError(409, "You have already reported this content.");

  await reportCollection().insertOne(report);
}

export { getReports, deleteReports, createReport };
