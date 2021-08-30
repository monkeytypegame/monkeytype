const { mongoDB } = require("../init/mongodb");

class PsaDAO {
  static async get(uid, config) {
    return await mongoDB().collection("psa").find().toArray();
  }
}

module.exports = PsaDAO;
