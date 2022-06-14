import * as db from "../init/db";

export async function submit(
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

  const quoteRating = await get(quoteId, language);
  const average = parseFloat(
    (
      Math.round((quoteRating!.totalRating / quoteRating!.ratings) * 10) / 10
    ).toFixed(1)
  );

  await db
    .collection<MonkeyTypes.QuoteRating>("quote-rating")
    .updateOne({ quoteId, language }, { $set: { average } });
}

export async function get(
  quoteId: number,
  language: string
): Promise<MonkeyTypes.QuoteRating | null> {
  return await db
    .collection<MonkeyTypes.QuoteRating>("quote-rating")
    .findOne({ quoteId, language });
}
