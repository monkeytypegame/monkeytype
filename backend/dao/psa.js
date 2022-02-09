import { mongoDB } from "../init/mongodb";

class PsaDAO {
  static async get(_uid, _config) {
    return await mongoDB().collection("psa").find().toArray();
  }
}

export default PsaDAO;
