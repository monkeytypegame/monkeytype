import MonkeyTypes, { Id } from "@monkeytype/types";
import * as db from "../init/db";
import MonkeyError from "../utils/error";

const COLLECTION_NAME = "reports";

export async function createReport(
  report: Id<MonkeyTypes.Report>,
  maxReports: number,
  contentReportLimit: number
): Promise<void> {
  const reportsCount = await db
    .collection<MonkeyTypes.Report>(COLLECTION_NAME)
    .estimatedDocumentCount();

  if (reportsCount >= maxReports) {
    throw new MonkeyError(
      503,
      "Reports are not being accepted at this time. Please try again later."
    );
  }

  const sameReports = await db
    .collection<MonkeyTypes.Report>(COLLECTION_NAME)
    .find({ contentId: report.contentId })
    .toArray();

  if (sameReports.length >= contentReportLimit) {
    throw new MonkeyError(
      409,
      "A report limit for this content has been reached."
    );
  }

  await db.collection<MonkeyTypes.Report>(COLLECTION_NAME).insertOne(report);
}
