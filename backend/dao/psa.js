import db from "../init/db";

class PsaDAO {
  static async get(_uid, _config) {
    return await db.collection("psa").find().toArray();
  }
}

export default PsaDAO;
