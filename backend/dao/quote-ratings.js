const { mongoDB } = require("../init/mongodb");

class QuoteRatingsDAO {
  static async submit(quoteId, language, rating, update) {
    if (update) {
      await mongoDB()
        .collection("quote-rating")
        .updateOne(
          { quoteId, language },
          { $inc: { totalRating: rating } },
          { upsert: true }
        );
    } else {
      await mongoDB()
        .collection("quote-rating")
        .updateOne(
          { quoteId, language },
          { $inc: { ratings: 1, totalRating: rating } },
          { upsert: true }
        );
    }
    let quoteRating = await this.get(quoteId, language);

    let average = parseFloat(
      (
        Math.round((quoteRating.totalRating / quoteRating.ratings) * 10) / 10
      ).toFixed(1)
    );

    return await mongoDB()
      .collection("quote-rating")
      .updateOne({ quoteId, language }, { $set: { average } });
  }

  static async get(quoteId, language) {
    return await mongoDB()
      .collection("quote-rating")
      .findOne({ quoteId, language });
  }
}

module.exports = QuoteRatingsDAO;
