import _ from "lodash";
import { isUsernameValid } from "../utils/validation";
import { updateUserEmail } from "../utils/auth";
import { checkAndUpdatePb } from "../utils/pb";
import db from "../init/db";
import MonkeyError from "../utils/error";
import { DeleteResult, InsertOneResult, ObjectId, UpdateResult } from "mongodb";

class UsersDAO {
  static async addUser(
    name: string,
    email: string,
    uid: string
  ): Promise<InsertOneResult<MonkeyTypes.User>> {
    const usersCollection = db.collection<MonkeyTypes.User>("users");

    const user = await usersCollection.findOne({ uid });
    if (user) {
      throw new MonkeyError(409, "User document already exists", "addUser");
    }

    const currentDate = Date.now();
    return await usersCollection.insertOne({
      name,
      email,
      uid,
      addedAt: currentDate,
      lastNameChange: currentDate,
      customThemes: [],
    });
  }

  static async deleteUser(uid): Promise<DeleteResult> {
    return await db.collection<MonkeyTypes.User>("users").deleteOne({ uid });
  }

  static async updateName(uid: string, name): Promise<UpdateResult> {
    if (!this.isNameAvailable(name)) {
      throw new MonkeyError(409, "Username already taken", name);
    }

    const user = await db
      .collection<MonkeyTypes.User>("users")
      .findOne({ uid });

    if (!user) {
      throw new MonkeyError(404, "User not found", "update name");
    }

    if (
      Date.now() - user.lastNameChange < 2592000000 &&
      isUsernameValid(user.name)
    ) {
      throw new MonkeyError(409, "You can change your name once every 30 days");
    }
    return await db
      .collection<MonkeyTypes.User>("users")
      .updateOne({ uid }, { $set: { name, lastNameChange: Date.now() } });
  }

  static async clearPb(uid): Promise<any> {
    return await db.collection<MonkeyTypes.User>("users").updateOne(
      { uid },
      {
        $set: {
          personalBests: {
            custom: {},
            quote: {},
            time: {},
            words: {},
            zen: {},
          },
          lbPersonalBests: {
            time: {},
          },
        },
      }
    );
  }

  static async isNameAvailable(name): Promise<boolean> {
    const nameDocs = await db
      .collection<MonkeyTypes.User>("users")
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

  static async updateQuoteRatings(uid: string, quoteRatings): Promise<boolean> {
    const user = await db
      .collection<MonkeyTypes.User>("users")
      .findOne({ uid });
    if (!user) {
      throw new MonkeyError(404, "User not found", "updateQuoteRatings");
    }

    await db
      .collection<MonkeyTypes.User>("users")
      .updateOne({ uid }, { $set: { quoteRatings } });
    return true;
  }

  static async updateEmail(uid: string, email): Promise<boolean> {
    const user = await db
      .collection<MonkeyTypes.User>("users")
      .findOne({ uid });
    if (!user) throw new MonkeyError(404, "User not found", "update email");
    await updateUserEmail(uid, email);
    await db
      .collection<MonkeyTypes.User>("users")
      .updateOne({ uid }, { $set: { email } });
    return true;
  }

  static async getUser(uid): Promise<MonkeyTypes.User> {
    const user = await db
      .collection<MonkeyTypes.User>("users")
      .findOne({ uid });
    if (!user) throw new MonkeyError(404, "User not found", "get user");
    return user;
  }

  static async isDiscordIdAvailable(discordId): Promise<boolean> {
    const user = await db
      .collection<MonkeyTypes.User>("users")
      .findOne({ discordId });
    return _.isNil(user);
  }

  static async addTag(uid: string, name): Promise<MonkeyTypes.UserTag> {
    const _id = new ObjectId();
    await db
      .collection<MonkeyTypes.User>("users")
      .updateOne({ uid }, { $push: { tags: { _id, name } } });
    return {
      _id,
      name,
    };
  }

  static async getTags(uid: string): Promise<MonkeyTypes.UserTag[]> {
    const user = await db
      .collection<MonkeyTypes.User>("users")
      .findOne({ uid });

    if (!user) throw new MonkeyError(404, "User not found", "get tags");

    return user.tags ?? [];
  }

  static async editTag(uid: string, _id, name): Promise<UpdateResult> {
    const user = await db
      .collection<MonkeyTypes.User>("users")
      .findOne({ uid });
    if (!user) throw new MonkeyError(404, "User not found", "edit tag");
    if (
      user.tags === undefined ||
      user.tags.filter((t) => t._id == _id).length === 0
    ) {
      throw new MonkeyError(404, "Tag not found");
    }
    return await db.collection<MonkeyTypes.User>("users").updateOne(
      {
        uid: uid,
        "tags._id": new ObjectId(_id),
      },
      { $set: { "tags.$.name": name } }
    );
  }

  static async removeTag(uid: string, _id: string): Promise<UpdateResult> {
    const user = await db
      .collection<MonkeyTypes.User>("users")
      .findOne({ uid });
    if (!user) throw new MonkeyError(404, "User not found", "remove tag");
    if (
      user.tags === undefined ||
      user.tags.filter((t) => t._id.toHexString() == _id).length === 0
    ) {
      throw new MonkeyError(404, "Tag not found");
    }
    return await db.collection<MonkeyTypes.User>("users").updateOne(
      {
        uid: uid,
        "tags._id": new ObjectId(_id),
      },
      { $pull: { tags: { _id: new ObjectId(_id) } } }
    );
  }

  static async removeTagPb(uid: string, _id: string): Promise<UpdateResult> {
    const usersCollection = db.collection<MonkeyTypes.User>("users");
    const user = await usersCollection.findOne({ uid });
    if (!user) throw new MonkeyError(404, "User not found", "remove tag pb");
    if (
      user.tags === undefined ||
      user.tags.filter((t) => t._id.toHexString() == _id).length === 0
    ) {
      throw new MonkeyError(404, "Tag not found");
    }
    return await usersCollection.updateOne(
      {
        uid: uid,
        "tags._id": new ObjectId(_id),
      },
      { $set: { "tags.$.personalBests": {} } }
    );
  }

  static async updateLbMemory(
    uid: string,
    mode,
    mode2,
    language,
    rank
  ): Promise<UpdateResult> {
    const user = await db
      .collection<MonkeyTypes.User>("users")
      .findOne({ uid });
    if (!user) throw new MonkeyError(404, "User not found", "update lb memory");
    if (user.lbMemory === undefined) user.lbMemory = {};
    if (user.lbMemory[mode] === undefined) user.lbMemory[mode] = {};
    if (user.lbMemory[mode][mode2] === undefined) {
      user.lbMemory[mode][mode2] = {};
    }
    user.lbMemory[mode][mode2][language] = rank;
    return await db.collection<MonkeyTypes.User>("users").updateOne(
      { uid },
      {
        $set: { lbMemory: user.lbMemory },
      }
    );
  }

  static async checkIfPb(uid: string, user, result): Promise<boolean> {
    const { mode, funbox } = result;

    if (funbox !== "none" && funbox !== "plus_one" && funbox !== "plus_two") {
      return false;
    }

    if (mode === "quote") {
      return false;
    }

    let lbpb = user.lbPersonalBests;
    if (!lbpb) lbpb = {};

    const pb = checkAndUpdatePb(user.personalBests, lbpb, result);

    if (pb.isPb) {
      await db
        .collection<MonkeyTypes.User>("users")
        .updateOne({ uid }, { $set: { personalBests: pb.obj } });
      if (pb.lbObj) {
        await db
          .collection<MonkeyTypes.User>("users")
          .updateOne({ uid }, { $set: { lbPersonalBests: pb.lbObj } });
      }
      return true;
    } else {
      return false;
    }
  }

  static async checkIfTagPb(
    uid: string,
    user: MonkeyTypes.User,
    result
  ): Promise<string[]> {
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

    const tagsToCheck: MonkeyTypes.UserTag[] = [];
    user.tags.forEach((tag) => {
      tags.forEach((resultTag) => {
        if (resultTag == tag._id) {
          tagsToCheck.push(tag);
        }
      });
    });

    const ret: string[] = [];

    tagsToCheck.forEach(async (tag) => {
      const tagpb = checkAndUpdatePb(tag.personalBests, undefined, result);
      if (tagpb.isPb) {
        ret.push(tag._id.toHexString());
        await db
          .collection<MonkeyTypes.User>("users")
          .updateOne(
            { uid, "tags._id": new ObjectId(tag._id) },
            { $set: { "tags.$.personalBests": tagpb.obj } }
          );
      }
    });

    return ret;
  }

  static async resetPb(uid): Promise<any> {
    const user = await db
      .collection<MonkeyTypes.User>("users")
      .findOne({ uid });
    if (!user) throw new MonkeyError(404, "User not found", "reset pb");
    return await db.collection<MonkeyTypes.User>("users").updateOne(
      { uid },
      {
        $set: {
          personalBests: {
            time: {},
            custom: {},
            quote: {},
            words: {},
            zen: {},
          },
        },
      }
    );
  }

  static async updateTypingStats(
    uid: string,
    restartCount,
    timeTyping
  ): Promise<UpdateResult> {
    return await db.collection<MonkeyTypes.User>("users").updateOne(
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

  static async linkDiscord(uid: string, discordId): Promise<UpdateResult> {
    const user = await db
      .collection<MonkeyTypes.User>("users")
      .findOne({ uid });
    if (!user) throw new MonkeyError(404, "User not found", "link discord");
    return await db
      .collection<MonkeyTypes.User>("users")
      .updateOne({ uid }, { $set: { discordId } });
  }

  static async unlinkDiscord(uid: string): Promise<UpdateResult> {
    const usersCollection = db.collection<MonkeyTypes.User>("users");
    const user = await usersCollection.findOne({ uid });
    if (!user) throw new MonkeyError(404, "User not found", "unlink discord");

    return await usersCollection.updateOne(
      { uid },
      { $set: { discordId: undefined } }
    );
  }

  static async incrementBananas(
    uid: string,
    wpm
  ): Promise<UpdateResult | null> {
    const user = await db
      .collection<MonkeyTypes.User>("users")
      .findOne({ uid });
    if (!user) {
      throw new MonkeyError(404, "User not found", "increment bananas");
    }

    let best60;
    const personalBests60 = user.personalBests?.time[60];

    if (personalBests60) {
      best60 = Math.max(...personalBests60.map((best) => best.wpm));
    } else {
      best60 = undefined;
    }

    if (best60 === undefined || wpm >= best60 - best60 * 0.25) {
      //increment when no record found or wpm is within 25% of the record
      return await db
        .collection<MonkeyTypes.User>("users")
        .updateOne({ uid }, { $inc: { bananas: 1 } });
    } else {
      return null;
    }
  }

  static themeDoesNotExist(customThemes, id): boolean {
    return (
      (customThemes ?? []).filter((t) => t._id.toString() === id).length === 0
    );
  }

  static async addTheme(
    uid: string,
    theme
  ): Promise<{ _id: ObjectId; name: string }> {
    const user = await db
      .collection<MonkeyTypes.User>("users")
      .findOne({ uid });
    if (!user) throw new MonkeyError(404, "User not found", "Add custom theme");

    if ((user.customThemes ?? []).length >= 10) {
      throw new MonkeyError(409, "Too many custom themes");
    }

    const _id = new ObjectId();
    await db.collection<MonkeyTypes.User>("users").updateOne(
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

  static async removeTheme(uid: string, _id): Promise<UpdateResult> {
    const user = await db
      .collection<MonkeyTypes.User>("users")
      .findOne({ uid });
    if (!user) {
      throw new MonkeyError(404, "User not found", "Remove custom theme");
    }

    if (this.themeDoesNotExist(user.customThemes, _id)) {
      throw new MonkeyError(404, "Custom theme not found");
    }

    return await db.collection<MonkeyTypes.User>("users").updateOne(
      {
        uid: uid,
        "customThemes._id": new ObjectId(_id),
      },
      { $pull: { customThemes: { _id: new ObjectId(_id) } } }
    );
  }

  static async editTheme(uid: string, _id, theme): Promise<UpdateResult> {
    const user = await db
      .collection<MonkeyTypes.User>("users")
      .findOne({ uid });
    if (!user) {
      throw new MonkeyError(404, "User not found", "Edit custom theme");
    }

    if (this.themeDoesNotExist(user.customThemes, _id)) {
      throw new MonkeyError(404, "Custom Theme not found");
    }

    return await db.collection<MonkeyTypes.User>("users").updateOne(
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

  static async getThemes(uid): Promise<MonkeyTypes.CustomTheme[]> {
    const user = await db
      .collection<MonkeyTypes.User>("users")
      .findOne({ uid });
    if (!user) {
      throw new MonkeyError(404, "User not found", "Get custom themes");
    }
    return user.customThemes ?? [];
  }

  static async getPersonalBests(
    uid: string,
    mode: string,
    mode2?: string
  ): Promise<MonkeyTypes.PersonalBest> {
    const user = await db
      .collection<MonkeyTypes.User>("users")
      .findOne({ uid });

    if (!user) {
      throw new MonkeyError(404, "User not found", "Get personal bests");
    }

    if (mode2) {
      return user?.personalBests?.[mode]?.[mode2];
    } else {
      return user?.personalBests?.[mode];
    }
  }
}

export default UsersDAO;
