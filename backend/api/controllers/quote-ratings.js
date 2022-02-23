import MonkeyError from "../../handlers/error";
import UserDAO from "../../dao/user";
import QuoteRatingsDAO from "../../dao/quote-ratings";
import { MonkeyResponse } from "../../handlers/monkey-response";

class QuoteRatingsController {
  static async getRating(req, _res) {
    const { quoteId, language } = req.query;
    const data = await QuoteRatingsDAO.get(parseInt(quoteId), language);
    return new MonkeyResponse("Rating retrieved", data);
  }

  static async submitRating(req, _res) {
    const { uid } = req.ctx.decodedToken;
    let { quoteId, rating, language } = req.body;

    quoteId = parseInt(quoteId);
    rating = Math.round(parseInt(rating));

    //check if user already submitted a rating
    const user = await UserDAO.getUser(uid);

    if (!user) {
      throw new MonkeyError(401, "User not found.");
    }
    let quoteRatings = user.quoteRatings;

    if (quoteRatings === undefined) quoteRatings = {};
    if (quoteRatings[language] === undefined) quoteRatings[language] = {};
    if (quoteRatings[language][quoteId] == undefined)
      quoteRatings[language][quoteId] = undefined;

    const quoteRating = quoteRatings[language][quoteId];

    let newRating;
    let update;
    if (quoteRating) {
      //user already voted for this
      newRating = rating - quoteRating;
      update = true;
    } else {
      //user has not voted for this
      newRating = rating;
      update = false;
    }

    await QuoteRatingsDAO.submit(quoteId, language, newRating, update);
    quoteRatings[language][quoteId] = rating;
    await UserDAO.updateQuoteRatings(uid, quoteRatings);
    return new MonkeyResponse("Rating updated");
  }
}

export default QuoteRatingsController;
