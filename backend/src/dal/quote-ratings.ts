import * as db from "../init/db";

type QuoteRating = MonkeyTypes.QuoteRating;

const quoteRatingCollection = () => db.collection<QuoteRating>("quote-rating");

async function get(quoteId: number, language: string): Promise<QuoteRating | null> {
  return await quoteRatingCollection().findOne({ quoteId, language });
}

async function submit(quoteId: number, language: string, rating: number, update: boolean): Promise<void> {
  const increment = update ? { totalRating: rating } : { ratings: 1, totalRating: rating };
  await quoteRatingCollection().updateOne({ quoteId, language }, { $inc: increment }, { upsert: true });

  const quoteRating = await get(quoteId, language);
  if (!quoteRating) throw new Error("Quote rating is null after adding rating?");

  const average = parseFloat((Math.round((quoteRating.totalRating / quoteRating.ratings) * 10) / 10).toFixed(1));
  await quoteRatingCollection().updateOne({ quoteId, language }, { $set: { average } });
}

export { get, submit };
