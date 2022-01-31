const MonkeyError = require("../handlers/error");
const { mongoDB } = require("../init/mongodb");

const MAX_REPORTS = 100;

class ReportDAO {
  static async createReport(report) {
    const reports = await mongoDB().collection("reports").find().toArray();

    if (reports.length >= MAX_REPORTS) {
      throw new MonkeyError(
        503,
        "Reports are not being accepted at this time. Please try again later."
      );
    }

    const reportAlreadyExists = reports.find((existingReport) => {
      return existingReport.details.contentId === report.details.contentId;
    });

    if (reportAlreadyExists) {
      throw new MonkeyError(409, "A report for this content already exists.");
    }

    await mongoDB().collection("reports").insertOne(report);
  }
}

module.exports = ReportDAO;
