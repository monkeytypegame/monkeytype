const MonkeyError = require("../handlers/error");
const { mongoDB } = require("../init/mongodb");

class NewQuotesDAO {
  static async add(text, source, language, uid) {
    //additional properties: length
    let quote = {
      text: text,
      source: source,
      langauge: language,
      userUID: uid,
      timestamp: Date.now(),
    };
    //check for duplicate first, give chance of being a duplicate score
    return await mongoDB().collection("new-quotes").insertOne(quote);
  }

  static async get() {
    return await mongoDB().collection("new-quotes").find().toArray();
  }
}

module.exports = NewQuotesDAO;
