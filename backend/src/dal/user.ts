import _ from "lodash";
import { isUsernameValid } from "../utils/validation";
import { updateUserEmail } from "../utils/auth";
import { checkAndUpdatePb } from "../utils/pb";
import * as db from "../init/db";
import MonkeyError from "../utils/error";
import {
  Collection,
  DeleteResult,
  InsertOneResult,
  ObjectId,
  UpdateResult,
  WithId,
} from "mongodb";

// Export for use in tests
export const getUsersCollection = (): Collection<WithId<MonkeyTypes.User>> =>
  db.collection<MonkeyTypes.User>("users");

export async function addUser(
  name: string,
  email: string,
  uid: string
): Promise<InsertOneResult<MonkeyTypes.User>> {
  const user = await getUsersCollection().findOne({ uid });
  if (user) {
    throw new MonkeyError(409, "User document already exists", "addUser");
  }

  const currentDate = Date.now();
  return await getUsersCollection().insertOne({
    _id: new ObjectId(),
    name,
    email,
    uid,
    addedAt: currentDate,
  });
}

export async function deleteUser(uid: string): Promise<DeleteResult> {
  return await getUsersCollection().deleteOne({ uid });
}

const DAY_IN_SECONDS = 24 * 60 * 60;
const THIRTY_DAYS_IN_SECONDS = DAY_IN_SECONDS * 30;

export async function updateName(
  uid: string,
  name: string
): Promise<UpdateResult> {
  if (!isUsernameValid(name)) {
    throw new MonkeyError(400, "Invalid username");
  }
  if (!(await isNameAvailable(name))) {
    throw new MonkeyError(409, "Username already taken", name);
  }

  const user = await getUser(uid, "update name");

  if (
    !user?.needsToChangeName &&
    Date.now() - (user.lastNameChange ?? 0) < THIRTY_DAYS_IN_SECONDS
  ) {
    throw new MonkeyError(409, "You can change your name once every 30 days");
  }

  return await getUsersCollection().updateOne(
    { uid },
    {
      $set: { name, lastNameChange: Date.now() },
      $unset: { needsToChangeName: "" },
    }
  );
}

export async function clearPb(uid: string): Promise<UpdateResult> {
  return await getUsersCollection().updateOne(
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

export async function isNameAvailable(name: string): Promise<boolean> {
  const nameDocs = await getUsersCollection()
    .find({ name })
    .collation({ locale: "en", strength: 1 })
    .limit(1)
    .toArray();

  return nameDocs.length === 0;
}

export async function updateQuoteRatings(
  uid: string,
  quoteRatings: MonkeyTypes.UserQuoteRatings
): Promise<boolean> {
  await getUser(uid, "update quote ratings");

  await getUsersCollection().updateOne({ uid }, { $set: { quoteRatings } });
  return true;
}

export async function updateEmail(
  uid: string,
  email: string
): Promise<boolean> {
  await getUser(uid, "update email"); // To make sure that the user exists
  await updateUserEmail(uid, email);
  await getUsersCollection().updateOne({ uid }, { $set: { email } });
  return true;
}

export async function getUser(
  uid: string,
  stack: string
): Promise<MonkeyTypes.User> {
  const user = await getUsersCollection().findOne({ uid });
  if (!user) throw new MonkeyError(404, "User not found", stack);
  return user;
}

export async function isDiscordIdAvailable(
  discordId: string
): Promise<boolean> {
  const user = await getUsersCollection().findOne({ discordId });
  return _.isNil(user);
}

export async function addTag(
  uid: string,
  name: string
): Promise<MonkeyTypes.UserTag> {
  const _id = new ObjectId();
  await getUsersCollection().updateOne(
    { uid },
    { $push: { tags: { _id, name } } }
  );
  return {
    _id,
    name,
  };
}

export async function getTags(uid: string): Promise<MonkeyTypes.UserTag[]> {
  const user = await getUser(uid, "get tags");

  return user.tags ?? [];
}

export async function editTag(
  uid: string,
  _id: string,
  name: string
): Promise<UpdateResult> {
  const user = await getUser(uid, "edit tag");
  if (
    user.tags === undefined ||
    user.tags.filter((t) => t._id.toHexString() === _id).length === 0
  ) {
    throw new MonkeyError(404, "Tag not found");
  }
  return await getUsersCollection().updateOne(
    {
      uid: uid,
      "tags._id": new ObjectId(_id),
    },
    { $set: { "tags.$.name": name } }
  );
}

export async function removeTag(
  uid: string,
  _id: string
): Promise<UpdateResult> {
  const user = await getUser(uid, "remove tag");
  if (
    user.tags === undefined ||
    user.tags.filter((t) => t._id.toHexString() == _id).length === 0
  ) {
    throw new MonkeyError(404, "Tag not found");
  }
  return await getUsersCollection().updateOne(
    {
      uid: uid,
      "tags._id": new ObjectId(_id),
    },
    { $pull: { tags: { _id: new ObjectId(_id) } } }
  );
}

export async function removeTagPb(
  uid: string,
  _id: string
): Promise<UpdateResult> {
  const user = await getUser(uid, "remove tag pb");
  if (
    user.tags === undefined ||
    user.tags.filter((t) => t._id.toHexString() == _id).length === 0
  ) {
    throw new MonkeyError(404, "Tag not found");
  }
  return await getUsersCollection().updateOne(
    {
      uid: uid,
      "tags._id": new ObjectId(_id),
    },
    { $set: { "tags.$.personalBests": {} } }
  );
}

export async function updateLbMemory(
  uid: string,
  mode: MonkeyTypes.Mode,
  mode2: MonkeyTypes.Mode2<MonkeyTypes.Mode>,
  language: string,
  rank: number
): Promise<UpdateResult> {
  const user = await getUser(uid, "update lb memory");
  if (user.lbMemory === undefined) user.lbMemory = {};
  if (user.lbMemory[mode] === undefined) user.lbMemory[mode] = {};
  if (user.lbMemory[mode][mode2] === undefined) {
    user.lbMemory[mode][mode2] = {};
  }
  user.lbMemory[mode][mode2][language] = rank;
  return await getUsersCollection().updateOne(
    { uid },
    {
      $set: { lbMemory: user.lbMemory },
    }
  );
}

export async function checkIfPb(
  uid: string,
  user: MonkeyTypes.User,
  result: MonkeyTypes.Result<MonkeyTypes.Mode>
): Promise<boolean> {
  const { mode, funbox } = result;

  if (funbox !== "none" && funbox !== "plus_one" && funbox !== "plus_two") {
    return false;
  }

  if (mode === "quote") {
    return false;
  }

  let lbPb = user.lbPersonalBests;
  if (!lbPb) lbPb = { time: {} };

  const pb = checkAndUpdatePb(
    user.personalBests ?? {
      time: {},
      custom: {},
      quote: {},
      words: {},
      zen: {},
    },
    lbPb,
    result
  );

  if (!pb.isPb) return false;

  await getUsersCollection().updateOne(
    { uid },
    { $set: { personalBests: pb.personalBests } }
  );

  if (pb.lbPersonalBests) {
    await getUsersCollection().updateOne(
      { uid },
      { $set: { lbPersonalBests: pb.lbPersonalBests } }
    );
  }
  return true;
}

export async function checkIfTagPb(
  uid: string,
  user: MonkeyTypes.User,
  result: MonkeyTypes.Result<MonkeyTypes.Mode>
): Promise<string[]> {
  if (user.tags === undefined || user.tags.length === 0) {
    return [];
  }

  const { mode, tags: resultTags, funbox } = result;

  if (funbox !== "none" && funbox !== "plus_one" && funbox !== "plus_two") {
    return [];
  }

  if (mode === "quote") {
    return [];
  }

  const tagsToCheck: MonkeyTypes.UserTag[] = [];
  user.tags.forEach((userTag) => {
    resultTags.forEach((resultTag) => {
      if (resultTag === userTag._id.toHexString()) {
        tagsToCheck.push(userTag);
      }
    });
  });

  const ret: string[] = [];

  tagsToCheck.forEach(async (tag) => {
    const tagPbs: MonkeyTypes.PersonalBests = tag.personalBests ?? {
      time: {},
      words: {},
      zen: {},
      custom: {},
      quote: {},
    };

    const tagpb = checkAndUpdatePb(tagPbs, undefined, result);
    if (tagpb.isPb) {
      ret.push(tag._id.toHexString());
      await getUsersCollection().updateOne(
        { uid, "tags._id": new ObjectId(tag._id) },
        { $set: { "tags.$.personalBests": tagpb.personalBests } }
      );
    }
  });

  return ret;
}

export async function resetPb(uid: string): Promise<UpdateResult> {
  await getUser(uid, "reset pb");
  return await getUsersCollection().updateOne(
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

export async function updateTypingStats(
  uid: string,
  restartCount: number,
  timeTyping: number
): Promise<UpdateResult> {
  return await getUsersCollection().updateOne(
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

export async function linkDiscord(
  uid: string,
  discordId: string
): Promise<UpdateResult> {
  await getUser(uid, "link discord");
  return await getUsersCollection().updateOne({ uid }, { $set: { discordId } });
}

export async function unlinkDiscord(uid: string): Promise<UpdateResult> {
  await getUser(uid, "unlink discord");

  return await getUsersCollection().updateOne(
    { uid },
    { $set: { discordId: undefined } }
  );
}

export async function incrementBananas(
  uid: string,
  wpm
): Promise<UpdateResult | null> {
  const user = await getUser(uid, "increment bananas");

  let best60: number | undefined;
  const personalBests60 = user.personalBests?.time[60];

  if (personalBests60) {
    best60 = Math.max(...personalBests60.map((best) => best.wpm));
  }

  if (best60 === undefined || wpm >= best60 - best60 * 0.25) {
    //increment when no record found or wpm is within 25% of the record
    return await getUsersCollection().updateOne(
      { uid },
      { $inc: { bananas: 1 } }
    );
  }

  return null;
}

export function themeDoesNotExist(customThemes, id): boolean {
  return (
    (customThemes ?? []).filter((t) => t._id.toString() === id).length === 0
  );
}

export async function addTheme(
  uid: string,
  theme
): Promise<{ _id: ObjectId; name: string }> {
  const user = await getUser(uid, "add theme");

  if ((user.customThemes ?? []).length >= 10) {
    throw new MonkeyError(409, "Too many custom themes");
  }

  const _id = new ObjectId();
  await getUsersCollection().updateOne(
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

export async function removeTheme(uid: string, _id): Promise<UpdateResult> {
  const user = await getUser(uid, "remove theme");

  if (themeDoesNotExist(user.customThemes, _id)) {
    throw new MonkeyError(404, "Custom theme not found");
  }

  return await getUsersCollection().updateOne(
    {
      uid: uid,
      "customThemes._id": new ObjectId(_id),
    },
    { $pull: { customThemes: { _id: new ObjectId(_id) } } }
  );
}

export async function editTheme(
  uid: string,
  _id,
  theme
): Promise<UpdateResult> {
  const user = await getUser(uid, "edit theme");

  if (themeDoesNotExist(user.customThemes, _id)) {
    throw new MonkeyError(404, "Custom Theme not found");
  }

  return await getUsersCollection().updateOne(
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

export async function getThemes(
  uid: string
): Promise<MonkeyTypes.CustomTheme[]> {
  const user = await getUser(uid, "get themes");
  return user.customThemes ?? [];
}

export async function getPersonalBests(
  uid: string,
  mode: string,
  mode2?: string
): Promise<MonkeyTypes.PersonalBest> {
  const user = await getUser(uid, "get personal bests");

  if (mode2) {
    return user.personalBests?.[mode]?.[mode2];
  }

  return user.personalBests?.[mode];
}

export async function getStats(
  uid: string
): Promise<{ [key: string]: number | undefined }> {
  const user = await getUser(uid, "get stats");

  return {
    startedTests: user.startedTests,
    completedTests: user.completedTests,
    timeTyping: user.timeTyping,
  };
}

export async function getFavoriteQuotes(
  uid
): Promise<MonkeyTypes.User["favoriteQuotes"]> {
  const user = await getUser(uid, "get favorite quotes");

  return user.favoriteQuotes ?? {};
}

export async function addFavoriteQuote(
  uid: string,
  language: string,
  quoteId: string,
  maxQuotes: number
): Promise<void> {
  const user = await getUser(uid, "add favorite quote");

  if (user.favoriteQuotes) {
    if (
      user.favoriteQuotes[language] &&
      user.favoriteQuotes[language].includes(quoteId)
    ) {
      return;
    }

    const quotesLength = _.sumBy(
      Object.values(user.favoriteQuotes),
      (favQuotes) => favQuotes.length
    );

    if (quotesLength >= maxQuotes) {
      throw new MonkeyError(
        409,
        "Too many favorite quotes",
        "addFavoriteQuote"
      );
    }
  }

  await getUsersCollection().updateOne(
    { uid },
    {
      $push: {
        [`favoriteQuotes.${language}`]: quoteId,
      },
    }
  );
}

export async function removeFavoriteQuote(
  uid: string,
  language: string,
  quoteId: string
): Promise<void> {
  const user = await getUser(uid, "remove favorite quote");

  if (
    !user.favoriteQuotes ||
    !user.favoriteQuotes[language] ||
    !user.favoriteQuotes[language].includes(quoteId)
  ) {
    return;
  }

  await getUsersCollection().updateOne(
    { uid },
    { $pull: { [`favoriteQuotes.${language}`]: quoteId } }
  );
}
