import MonkeyError from "../utils/error";
import db from "../init/db";
class ReportDAO {
  static async createReport(
    report: MonkeyTypes.Report,
    maxReports: number,
    contentReportLimit: number
  ): Promise<void> {
    const reportsCount = await db
      .collection<MonkeyTypes.Report>("reports")
      .estimatedDocumentCount();

    if (reportsCount >= maxReports) {
      throw new MonkeyError(
        503,
        "Reports are not being accepted at this time. Please try again later."
      );
    }

    const sameReports = await db
      .collection<MonkeyTypes.Report>("reports")
      .find({ contentId: report.contentId })
      .toArray();

    if (sameReports.length >= contentReportLimit) {
      throw new MonkeyError(
        409,
        "A report limit for this content has been reached."
      );
    }

    await db.collection<MonkeyTypes.Report>("reports").insertOne(report);
  }
}

export default ReportDAO;
