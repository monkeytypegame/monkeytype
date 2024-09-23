import { QuoteRating } from "@monkeytype/contracts/schemas/quotes";
import * as db from "../init/db";
import { Collection } from "mongodb";
import { WithObjectId } from "../utils/misc";

type DBQuoteRating = WithObjectId<QuoteRating>;

// Export for use in tests
export const getQuoteRatingCollection = (): Collection<DBQuoteRating> =>
  db.collection<DBQuoteRating>("quote-rating");

export async function submit(
  quoteId: number,
  language: string,
  rating: number,
  update: boolean
): Promise<void> {
  if (update) {
    await getQuoteRatingCollection().updateOne(
      { quoteId, language },
      { $inc: { totalRating: rating } },
      { upsert: true }
    );
  } else {
    await getQuoteRatingCollection().updateOne(
      { quoteId, language },
      { $inc: { ratings: 1, totalRating: rating } },
      { upsert: true }
    );
  }

  const quoteRating = await get(quoteId, language);
  if (quoteRating === null) {
    throw new Error("Quote rating is null after adding rating?");
  }
  const average = parseFloat(
    (
      Math.round((quoteRating.totalRating / quoteRating.ratings) * 10) / 10
    ).toFixed(1)
  );

  await getQuoteRatingCollection().updateOne(
    { quoteId, language },
    { $set: { average } }
  );
}

export async function get(
  quoteId: number,
  language: string
): Promise<DBQuoteRating | null> {
  return await getQuoteRatingCollection().findOne({ quoteId, language });
}
