import db from "../init/db";

class QuoteRatingsDAO {
  static async submit(
    quoteId: number,
    language: string,
    rating: number,
    update: boolean
  ): Promise<void> {
    if (update) {
      await db
        .collection<MonkeyTypes.QuoteRating>("quote-rating")
        .updateOne(
          { quoteId, language },
          { $inc: { totalRating: rating } },
          { upsert: true }
        );
    } else {
      await db
        .collection<MonkeyTypes.QuoteRating>("quote-rating")
        .updateOne(
          { quoteId, language },
          { $inc: { ratings: 1, totalRating: rating } },
          { upsert: true }
        );
    }

    const quoteRating = await this.get(quoteId, language);
    const average = parseFloat(
      (
        Math.round((quoteRating!.totalRating / quoteRating!.ratings) * 10) / 10
      ).toFixed(1)
    );

    await db
      .collection<MonkeyTypes.QuoteRating>("quote-rating")
      .updateOne({ quoteId, language }, { $set: { average } });
  }

  static async get(
    quoteId: number,
    language: string
  ): Promise<MonkeyTypes.QuoteRating | null> {
    return await db
      .collection<MonkeyTypes.QuoteRating>("quote-rating")
      .findOne({ quoteId, language });
  }
}

export default QuoteRatingsDAO;
