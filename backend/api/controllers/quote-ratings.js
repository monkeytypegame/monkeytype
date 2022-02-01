const QuoteRatingsDAO = require("../../dao/quote-ratings");
const UserDAO = require("../../dao/user");
const MonkeyError = require("../../handlers/error");

class QuoteRatingsController {
  static async getRating(req, res) {
    const { quoteId, language } = req.query;
    let data = await QuoteRatingsDAO.get(parseInt(quoteId), language);
    return res.status(200).json(data);
  }
  static async submitRating(req, res) {
    let { uid } = req.decodedToken;
    let { quoteId, rating, language } = req.body;
    quoteId = parseInt(quoteId);
    rating = parseInt(rating);
    if (isNaN(quoteId) || isNaN(rating)) {
      throw new MonkeyError(
        400,
        "Bad request. Quote id or rating is not a number."
      );
    }
    if (typeof language !== "string") {
      throw new MonkeyError(400, "Bad request. Language is not a string.");
    }

    if (rating < 1 || rating > 5) {
      throw new MonkeyError(
        400,
        "Bad request. Rating must be between 1 and 5."
      );
    }

    rating = Math.round(rating);

    //check if user already submitted a rating
    let user = await UserDAO.getUser(uid);

    if (!user) {
      throw new MonkeyError(401, "User not found.");
    }
    let quoteRatings = user.quoteRatings;

    if (quoteRatings === undefined) quoteRatings = {};
    if (quoteRatings[language] === undefined) quoteRatings[language] = {};
    if (quoteRatings[language][quoteId] == undefined)
      quoteRatings[language][quoteId] = undefined;

    let quoteRating = quoteRatings[language][quoteId];

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

    return res.sendStatus(200);
  }
}

module.exports = QuoteRatingsController;
