import db from "../init/db";

class QuoteRatingsDAO {
  static async submit(quoteId, language, rating, update) {
    if (update) {
      await db
        .collection("quote-rating")
        .updateOne(
          { quoteId, language },
          { $inc: { totalRating: rating } },
          { upsert: true }
        );
    } else {
      await db
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

    return await db
      .collection("quote-rating")
      .updateOne({ quoteId, language }, { $set: { average } });
  }

  static async get(quoteId, language) {
    return await db.collection("quote-rating").findOne({ quoteId, language });
  }
}

export default QuoteRatingsDAO;
