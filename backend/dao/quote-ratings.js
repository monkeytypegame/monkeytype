const MonkeyError = require("../handlers/error");
const { mongoDB } = require("../init/mongodb");

class QuoteRatingsDAO {
  static async submit(quoteId, language, rating, update) {
    if (update) {
      return await mongoDB()
        .collection("quote-rating")
        .updateOne(
          { quoteId, language },
          { $inc: { totalRating: rating } },
          { upsert: true }
        );
    } else {
      return await mongoDB()
        .collection("quote-rating")
        .updateOne(
          { quoteId, language },
          { $inc: { ratings: 1, totalRating: rating } },
          { upsert: true }
        );
    }
  }

  static async get(quoteId, language) {
    return await mongoDB()
      .collection("quote-rating")
      .findOne({ quoteId, language });
  }
}

module.exports = QuoteRatingsDAO;
