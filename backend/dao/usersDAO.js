const { mongoDB } = require("../init/mongodb");
class UsersDAO {
  static async addUser(name, email, uid) {
    return await mongoDB()
      .collection("users")
      .insertOne({ name, email, uid, addedAt: Date.now() });
  }

  static async updateName(uid, name) {
    const nameDoc = await mongoDB()
      .collection("users")
      .findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
    if (nameDoc) throw new Error("Username already taken");
    return await mongoDB()
      .collection("users")
      .updateOne({ uid }, { $set: { name } });
  }

  static async getUser(uid) {
    const user = await mongoDB().collection("users").findOne({ uid });
    if (!user) throw new Error("User not found");
    return user;
  }
}

module.exports = UsersDAO;
