import _ from "lodash";
import { isUsernameValid } from "../utils/validation";
import { updateUserEmail } from "../utils/auth";
import { checkAndUpdatePb } from "../utils/pb";
import db from "../init/db";
import MonkeyError from "../utils/error";
import { ObjectId } from "mongodb";

class UsersDAO {
  static async addUser(name, email, uid) {
    const user = await db.collection("users").findOne({ uid });
    if (user) {
      throw new MonkeyError(409, "User document already exists", "addUser");
    }
    return await db
      .collection("users")
      .insertOne({ name, email, uid, addedAt: Date.now() });
  }

  static async deleteUser(uid) {
    return await db.collection("users").deleteOne({ uid });
  }

  static async updateName(uid, name) {
    if (!this.isNameAvailable(name)) {
      throw new MonkeyError(409, "Username already taken", name);
    }
    let user = await db.collection("users").findOne({ uid });
    if (
      Date.now() - user.lastNameChange < 2592000000 &&
      isUsernameValid(user.name)
    ) {
      throw new MonkeyError(409, "You can change your name once every 30 days");
    }
    return await db
      .collection("users")
      .updateOne({ uid }, { $set: { name, lastNameChange: Date.now() } });
  }

  static async clearPb(uid) {
    return await db
      .collection("users")
      .updateOne({ uid }, { $set: { personalBests: {}, lbPersonalBests: {} } });
  }

  static async isNameAvailable(name) {
    const nameDocs = await db
      .collection("users")
      .find({ name })
      .collation({ locale: "en", strength: 1 })
      .limit(1)
      .toArray();
    if (nameDocs.length !== 0) {
      return false;
    } else {
      return true;
    }
  }

  static async updateQuoteRatings(uid, quoteRatings) {
    const user = await db.collection("users").findOne({ uid });
    if (!user) {
      throw new MonkeyError(404, "User not found", "updateQuoteRatings");
    }
    await db.collection("users").updateOne({ uid }, { $set: { quoteRatings } });
    return true;
  }

  static async updateEmail(uid, email) {
    const user = await db.collection("users").findOne({ uid });
    if (!user) throw new MonkeyError(404, "User not found", "update email");
    await updateUserEmail(uid, email);
    await db.collection("users").updateOne({ uid }, { $set: { email } });
    return true;
  }

  static async getUser(uid) {
    const user = await db.collection("users").findOne({ uid });
    if (!user) throw new MonkeyError(404, "User not found", "get user");
    return user;
  }

  static async isDiscordIdAvailable(discordId) {
    const user = await db.collection("users").findOne({ discordId });
    return _.isNil(user);
  }

  static async addTag(uid, name) {
    const _id = new ObjectId();
    await db
      .collection("users")
      .updateOne({ uid }, { $push: { tags: { _id, name } } });
    return {
      _id,
      name,
    };
  }

  static async getTags(uid) {
    const user = await db.collection("users").findOne({ uid });
    // if (!user) throw new MonkeyError(404, "User not found", "get tags");
    return user?.tags ?? [];
  }

  static async editTag(uid, _id, name) {
    const user = await db.collection("users").findOne({ uid });
    if (!user) throw new MonkeyError(404, "User not found", "edit tag");
    if (
      user.tags === undefined ||
      user.tags.filter((t) => t._id == _id).length === 0
    ) {
      throw new MonkeyError(404, "Tag not found");
    }
    return await db.collection("users").updateOne(
      {
        uid: uid,
        "tags._id": new ObjectId(_id),
      },
      { $set: { "tags.$.name": name } }
    );
  }

  static async removeTag(uid, _id) {
    const user = await db.collection("users").findOne({ uid });
    if (!user) throw new MonkeyError(404, "User not found", "remove tag");
    if (
      user.tags === undefined ||
      user.tags.filter((t) => t._id == _id).length === 0
    ) {
      throw new MonkeyError(404, "Tag not found");
    }
    return await db.collection("users").updateOne(
      {
        uid: uid,
        "tags._id": new ObjectId(_id),
      },
      { $pull: { tags: { _id: new ObjectId(_id) } } }
    );
  }

  static async removeTagPb(uid, _id) {
    const user = await db.collection("users").findOne({ uid });
    if (!user) throw new MonkeyError(404, "User not found", "remove tag pb");
    if (
      user.tags === undefined ||
      user.tags.filter((t) => t._id == _id).length === 0
    ) {
      throw new MonkeyError(404, "Tag not found");
    }
    return await db.collection("users").updateOne(
      {
        uid: uid,
        "tags._id": new ObjectId(_id),
      },
      { $set: { "tags.$.personalBests": {} } }
    );
  }

  static async updateLbMemory(uid, mode, mode2, language, rank) {
    const user = await db.collection("users").findOne({ uid });
    if (!user) throw new MonkeyError(404, "User not found", "update lb memory");
    if (user.lbMemory === undefined) user.lbMemory = {};
    if (user.lbMemory[mode] === undefined) user.lbMemory[mode] = {};
    if (user.lbMemory[mode][mode2] === undefined) {
      user.lbMemory[mode][mode2] = {};
    }
    user.lbMemory[mode][mode2][language] = rank;
    return await db.collection("users").updateOne(
      { uid },
      {
        $set: { lbMemory: user.lbMemory },
      }
    );
  }

  static async checkIfPb(uid, user, result) {
    const { mode, funbox } = result;

    if (funbox !== "none" && funbox !== "plus_one" && funbox !== "plus_two") {
      return false;
    }

    if (mode === "quote") {
      return false;
    }

    let lbpb = user.lbPersonalBests;
    if (!lbpb) lbpb = {};

    let pb = checkAndUpdatePb(user.personalBests, lbpb, result);

    if (pb.isPb) {
      await db
        .collection("users")
        .updateOne({ uid }, { $set: { personalBests: pb.obj } });
      if (pb.lbObj) {
        await db
          .collection("users")
          .updateOne({ uid }, { $set: { lbPersonalBests: pb.lbObj } });
      }
      return true;
    } else {
      return false;
    }
  }

  static async checkIfTagPb(uid, user, result) {
    if (user.tags === undefined || user.tags.length === 0) {
      return [];
    }

    const { mode, tags, funbox } = result;

    if (funbox !== "none" && funbox !== "plus_one" && funbox !== "plus_two") {
      return [];
    }

    if (mode === "quote") {
      return [];
    }

    let tagsToCheck = [];
    user.tags.forEach((tag) => {
      tags.forEach((resultTag) => {
        if (resultTag == tag._id) {
          tagsToCheck.push(tag);
        }
      });
    });

    let ret = [];

    tagsToCheck.forEach(async (tag) => {
      let tagpb = checkAndUpdatePb(tag.personalBests, undefined, result);
      if (tagpb.isPb) {
        ret.push(tag._id);
        await db
          .collection("users")
          .updateOne(
            { uid, "tags._id": new ObjectId(tag._id) },
            { $set: { "tags.$.personalBests": tagpb.obj } }
          );
      }
    });

    return ret;
  }

  static async resetPb(uid) {
    const user = await db.collection("users").findOne({ uid });
    if (!user) throw new MonkeyError(404, "User not found", "reset pb");
    return await db
      .collection("users")
      .updateOne({ uid }, { $set: { personalBests: {} } });
  }

  static async updateTypingStats(uid, restartCount, timeTyping) {
    return await db.collection("users").updateOne(
      { uid },
      {
        $inc: {
          startedTests: restartCount + 1,
          completedTests: 1,
          timeTyping,
        },
      }
    );
  }

  static async linkDiscord(uid, discordId) {
    const user = await db.collection("users").findOne({ uid });
    if (!user) throw new MonkeyError(404, "User not found", "link discord");
    return await db
      .collection("users")
      .updateOne({ uid }, { $set: { discordId } });
  }

  static async unlinkDiscord(uid) {
    const user = await db.collection("users").findOne({ uid });
    if (!user) throw new MonkeyError(404, "User not found", "unlink discord");
    return await db
      .collection("users")
      .updateOne({ uid }, { $set: { discordId: null } });
  }

  static async incrementBananas(uid, wpm) {
    const user = await db.collection("users").findOne({ uid });
    if (!user) {
      throw new MonkeyError(404, "User not found", "increment bananas");
    }

    let best60;
    try {
      best60 = Math.max(...user.personalBests.time[60].map((best) => best.wpm));
    } catch (e) {
      best60 = undefined;
    }

    if (best60 === undefined || wpm >= best60 - best60 * 0.25) {
      //increment when no record found or wpm is within 25% of the record
      return await db
        .collection("users")
        .updateOne({ uid }, { $inc: { bananas: 1 } });
    } else {
      return null;
    }
  }

  static themeDoesNotExist(customThemes, id) {
    return (
      (customThemes ?? []).filter((t) => t._id.toString() === id).length === 0
    );
  }

  static async addTheme(uid, theme) {
    const user = await db.collection("users").findOne({ uid });
    if (!user) throw new MonkeyError(404, "User not found", "Add custom theme");

    if ((user.customThemes ?? []).length >= 10) {
      throw new MonkeyError(409, "Too many custom themes");
    }

    const _id = new ObjectId();
    await db.collection("users").updateOne(
      { uid },
      {
        $push: {
          customThemes: {
            _id,
            name: theme.name,
            colors: theme.colors,
          },
        },
      }
    );

    return {
      _id,
      name: theme.name,
    };
  }

  static async removeTheme(uid, _id) {
    const user = await db.collection("users").findOne({ uid });
    if (!user) {
      throw new MonkeyError(404, "User not found", "Remove custom theme");
    }

    if (this.themeDoesNotExist(user.customThemes, _id)) {
      throw new MonkeyError(404, "Custom theme not found");
    }

    return await db.collection("users").updateOne(
      {
        uid: uid,
        "customThemes._id": new ObjectId(_id),
      },
      { $pull: { customThemes: { _id: new ObjectId(_id) } } }
    );
  }

  static async editTheme(uid, _id, theme) {
    const user = await db.collection("users").findOne({ uid });
    if (!user) {
      throw new MonkeyError(404, "User not found", "Edit custom theme");
    }

    if (this.themeDoesNotExist(user.customThemes, _id)) {
      throw new MonkeyError(404, "Custom Theme not found");
    }

    return await db.collection("users").updateOne(
      {
        uid: uid,
        "customThemes._id": new ObjectId(_id),
      },
      {
        $set: {
          "customThemes.$.name": theme.name,
          "customThemes.$.colors": theme.colors,
        },
      }
    );
  }

  static async getThemes(uid) {
    const user = await db.collection("users").findOne({ uid });
    if (!user) {
      throw new MonkeyError(404, "User not found", "Get custom themes");
    }
    return user.customThemes ?? [];
  }

  static async getPersonalBests(uid, mode, mode2) {
    const user = await db.collection("users").findOne({ uid });
    if (mode2) {
      return user?.personalBests?.[mode]?.[mode2];
    } else {
      return user?.personalBests?.[mode];
    }
  }
}

export default UsersDAO;
