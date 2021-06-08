const MonkeyError = require("../handlers/error");
const { mongoDB } = require("../init/mongodb");
const { checkAndUpdatePb } = require("../handlers/pb");

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
    if (nameDoc) throw new MonkeyError(409, "Username already taken");
    return await mongoDB()
      .collection("users")
      .updateOne({ uid }, { $set: { name } });
  }

  static async getUser(uid) {
    const user = await mongoDB().collection("users").findOne({ uid });
    if (!user) throw new MonkeyError(404, "User not found");
    return user;
  }

  static async addTag(uid, name) {
    return await mongoDB()
      .collection("users")
      .updateOne({ uid }, { $push: { tags: { name } } });
  }

  static async editTag(uid, id, name) {
    const user = await mongoDB().collection("users").findOne({ uid });
    if (!user) throw new MonkeyError(404, "User not found");
    if (
      user.tags === undefined ||
      user.tags.filter((t) => t._id === id).length === 0
    )
      throw new MonkeyError(404, "Tag not found");
    return await mongoDB()
      .collection("users")
      .updateOne(
        {
          uid: uid,
          "tags._id": id,
        },
        { $set: { tags: { name } } }
      );
  }

  static async removeTag(uid, id) {
    const user = await mongoDB().collection("users").findOne({ uid });
    if (!user) throw new MonkeyError(404, "User not found");
    if (
      user.tags === undefined ||
      user.tags.filter((t) => t._id === id).length === 0
    )
      throw new MonkeyError(404, "Tag not found");
    return await mongoDB()
      .collection("users")
      .updateOne({ uid }, { $pull: { id } });
  }

  static async removeTagPb(uid, id) {
    const user = await mongoDB().collection("users").findOne({ uid });
    if (!user) throw new MonkeyError(404, "User not found");
    if (
      user.tags === undefined ||
      user.tags.filter((t) => t._id === id).length === 0
    )
      throw new MonkeyError(404, "Tag not found");
    return await mongoDB()
      .collection("users")
      .updateOne(
        {
          uid: uid,
          "tags._id": id,
        },
        { $pull: { tags: { personalBests } } }
      );
  }

  static async checkIfPb(
    uid,
    mode,
    mode2,
    acc,
    consistency,
    difficulty,
    language,
    punctuation,
    raw,
    wpm
  ) {
    const user = await mongoDB().collection("users").findOne({ uid });
    if (!user) throw new MonkeyError(404, "User not found");

    let pb = checkAndUpdatePb(
      user.personalBests,
      mode,
      mode2,
      acc,
      consistency,
      difficulty,
      language,
      punctuation,
      raw,
      wpm
    );

    if (pb.isPb) {
      await mongoDB()
        .collection("users")
        .updateOne({ uid }, { $set: { personalBests: pb.obj } });
      return true;
    } else {
      return false;
    }
  }

  static async checkIfTagPb(
    uid,
    tags,
    mode,
    mode2,
    acc,
    consistency,
    difficulty,
    language,
    punctuation,
    raw,
    wpm
  ) {
    const user = await mongoDB().collection("users").findOne({ uid });
    if (!user) throw new MonkeyError(404, "User not found");

    if (user.tags === undefined || user.tags.length === 0) {
      return [];
    }

    let ret = [];

    tags.forEach(async (tag) => {
      let tagpb = checkAndUpdatePb(
        tag.personalBests,
        mode,
        mode2,
        acc,
        consistency,
        difficulty,
        language,
        punctuation,
        raw,
        wpm
      );
      if (tagpb.isPb) {
        ret.push(tag._id);
        await mongoDB()
          .collection("users")
          .updateOne({ uid }, { $set: { tags: { personalBests: tagpb.obj } } });
      }
    });

    return ret;
  }
}

module.exports = UsersDAO;
