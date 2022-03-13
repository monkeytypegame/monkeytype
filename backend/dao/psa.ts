import db from "../init/db";

class PsaDAO {
  static async get(): Promise<MonkeyTypes.PSA[]> {
    return await db.collection<MonkeyTypes.PSA>("psa").find().toArray();
  }
}

export default PsaDAO;
