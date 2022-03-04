import MonkeyError from "../utils/error";
import db from "../init/db";
class ReportDAO {
  static async createReport(report, maxReports, contentReportLimit) {
    const reports = await db.collection("reports").find().toArray();

    if (reports.length >= maxReports) {
      throw new MonkeyError(
        503,
        "Reports are not being accepted at this time. Please try again later."
      );
    }

    const sameReports = reports.filter((existingReport) => {
      return existingReport.details.contentId === report.details.contentId;
    });

    if (sameReports.length >= contentReportLimit) {
      throw new MonkeyError(
        409,
        "A report limit for this content has been reached."
      );
    }

    await db.collection("reports").insertOne(report);
  }
}

export default ReportDAO;
