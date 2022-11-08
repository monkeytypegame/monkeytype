import _ from "lodash";
import { isUsernameValid } from "../utils/validation";
import { updateUserEmail } from "../utils/auth";
import { checkAndUpdatePb } from "../utils/pb";
import * as db from "../init/db";
import MonkeyError from "../utils/error";
import { Collection, ObjectId, WithId, Long, UpdateFilter } from "mongodb";
import Logger from "../utils/logger";
import { flattenObjectDeep, isToday, isYesterday } from "../utils/misc";

const SECONDS_PER_HOUR = 3600;

// Export for use in tests
export const getUsersCollection = (): Collection<WithId<MonkeyTypes.User>> =>
  db.collection<MonkeyTypes.User>("users");

export async function addUser(
  name: string,
  email: string,
  uid: string
): Promise<void> {
  const newUserDocument: MonkeyTypes.User = {
    name,
    email,
    uid,
    addedAt: Date.now(),
  };

  const result = await getUsersCollection().updateOne(
    { uid },
    { $setOnInsert: newUserDocument },
    { upsert: true }
  );

  if (result.upsertedCount === 0) {
    throw new MonkeyError(409, "User document already exists", "addUser");
  }
}

export async function deleteUser(uid: string): Promise<void> {
  await getUsersCollection().deleteOne({ uid });
}

export async function resetUser(uid: string): Promise<void> {
  await getUsersCollection().updateOne(
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
        completedTests: 0,
        startedTests: 0,
        timeTyping: 0,
        lbMemory: {},
        bananas: 0,
        profileDetails: {
          bio: "",
          keyboard: "",
          socialProfiles: {},
        },
        favoriteQuotes: {},
        customThemes: [],
        tags: [],
        xp: 0,
        streak: {
          length: 0,
          lastResultTimestamp: 0,
          maxLength: 0,
        },
      },
      $unset: {
        discordAvatar: "",
        discordId: "",
      },
    }
  );
}

const DAY_IN_SECONDS = 24 * 60 * 60;
const THIRTY_DAYS_IN_SECONDS = DAY_IN_SECONDS * 30;

export async function updateName(uid: string, name: string): Promise<void> {
  if (!isUsernameValid(name)) {
    throw new MonkeyError(400, "Invalid username");
  }
  if (!(await isNameAvailable(name))) {
    throw new MonkeyError(409, "Username already taken", name);
  }

  const user = await getUser(uid, "update name");

  const oldName = user.name;

  if (
    !user?.needsToChangeName &&
    Date.now() - (user.lastNameChange ?? 0) < THIRTY_DAYS_IN_SECONDS
  ) {
    throw new MonkeyError(409, "You can change your name once every 30 days");
  }

  await getUsersCollection().updateOne(
    { uid },
    {
      $set: { name, lastNameChange: Date.now() },
      $unset: { needsToChangeName: "" },
      $push: { nameHistory: oldName },
    }
  );
}

export async function clearPb(uid: string): Promise<void> {
  await getUsersCollection().updateOne(
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

async function findByName(name: string): Promise<MonkeyTypes.User | undefined> {
  return (
    await getUsersCollection()
      .find({ name })
      .collation({ locale: "en", strength: 1 })
      .limit(1)
      .toArray()
  )[0];
}

export async function isNameAvailable(name: string): Promise<boolean> {
  return (await findByName(name)) === undefined;
}

export async function getUserByName(
  name: string,
  stack: string
): Promise<MonkeyTypes.User> {
  const user = await findByName(name);
  if (!user) throw new MonkeyError(404, "User not found", stack);
  return user;
}

export async function isDiscordIdAvailable(
  discordId: string
): Promise<boolean> {
  const user = await getUsersCollection().findOne({ discordId });
  return _.isNil(user);
}

export async function addResultFilterPreset(
  uid: string,
  filter: MonkeyTypes.ResultFilters,
  maxFiltersPerUser: number
): Promise<ObjectId> {
  // ensure limit not reached
  const filtersCount = (
    (await getUser(uid, "Add Result filter")).resultFilterPresets ?? []
  ).length;

  if (filtersCount >= maxFiltersPerUser) {
    throw new MonkeyError(
      409,
      "Maximum number of custom filters reached for user."
    );
  }

  const _id = new ObjectId();
  await getUsersCollection().updateOne(
    { uid },
    { $push: { resultFilterPresets: { ...filter, _id } } }
  );
  return _id;
}

export async function removeResultFilterPreset(
  uid: string,
  _id: string
): Promise<void> {
  const user = await getUser(uid, "remove result filter");
  const filterId = new ObjectId(_id);
  if (
    user.resultFilterPresets === undefined ||
    user.resultFilterPresets.filter((t) => t._id.toHexString() === _id)
      .length === 0
  ) {
    throw new MonkeyError(404, "Custom filter not found");
  }

  await getUsersCollection().updateOne(
    {
      uid,
      "resultFilterPresets._id": filterId,
    },
    { $pull: { resultFilterPresets: { _id: filterId } } }
  );
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
): Promise<void> {
  const user = await getUser(uid, "edit tag");
  if (
    user.tags === undefined ||
    user.tags.filter((t) => t._id.toHexString() === _id).length === 0
  ) {
    throw new MonkeyError(404, "Tag not found");
  }
  await getUsersCollection().updateOne(
    {
      uid: uid,
      "tags._id": new ObjectId(_id),
    },
    { $set: { "tags.$.name": name } }
  );
}

export async function removeTag(uid: string, _id: string): Promise<void> {
  const user = await getUser(uid, "remove tag");
  if (
    user.tags === undefined ||
    user.tags.filter((t) => t._id.toHexString() == _id).length === 0
  ) {
    throw new MonkeyError(404, "Tag not found");
  }
  await getUsersCollection().updateOne(
    {
      uid: uid,
      "tags._id": new ObjectId(_id),
    },
    { $pull: { tags: { _id: new ObjectId(_id) } } }
  );
}

export async function removeTagPb(uid: string, _id: string): Promise<void> {
  const user = await getUser(uid, "remove tag pb");
  if (
    user.tags === undefined ||
    user.tags.filter((t) => t._id.toHexString() == _id).length === 0
  ) {
    throw new MonkeyError(404, "Tag not found");
  }
  await getUsersCollection().updateOne(
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
): Promise<void> {
  const user = await getUser(uid, "update lb memory");
  if (user.lbMemory === undefined) user.lbMemory = {};
  if (user.lbMemory[mode] === undefined) user.lbMemory[mode] = {};
  if (user.lbMemory[mode][mode2] === undefined) {
    user.lbMemory[mode][mode2] = {};
  }
  user.lbMemory[mode][mode2][language] = rank;
  await getUsersCollection().updateOne(
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
  if (
    funbox !== undefined &&
    funbox !== "none" &&
    funbox !== "plus_one" &&
    funbox !== "plus_two"
  ) {
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

  for (const tag of tagsToCheck) {
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
  }

  return ret;
}

export async function resetPb(uid: string): Promise<void> {
  await getUser(uid, "reset pb");
  await getUsersCollection().updateOne(
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
): Promise<void> {
  await getUsersCollection().updateOne(
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
  discordId: string,
  discordAvatar?: string
): Promise<void> {
  const updates = _.pickBy({ discordId, discordAvatar }, _.identity);
  const result = await getUsersCollection().updateOne(
    { uid },
    { $set: updates }
  );

  if (result.matchedCount === 0) {
    throw new MonkeyError(404, "User not found");
  }
}

export async function unlinkDiscord(uid: string): Promise<void> {
  await getUser(uid, "unlink discord");

  await getUsersCollection().updateOne(
    { uid },
    { $unset: { discordId: "", discordAvatar: "" } }
  );
}

export async function incrementBananas(uid: string, wpm): Promise<void> {
  const user = await getUser(uid, "increment bananas");

  let best60: number | undefined;
  const personalBests60 = user.personalBests?.time[60];

  if (personalBests60) {
    best60 = Math.max(...personalBests60.map((best) => best.wpm));
  }

  if (best60 === undefined || wpm >= best60 - best60 * 0.25) {
    //increment when no record found or wpm is within 25% of the record
    await getUsersCollection().updateOne({ uid }, { $inc: { bananas: 1 } });
  }
}

export async function incrementXp(uid: string, xp: number): Promise<void> {
  if (isNaN(xp)) xp = 0;
  await getUsersCollection().updateOne({ uid }, { $inc: { xp: new Long(xp) } });
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

export async function removeTheme(uid: string, _id): Promise<void> {
  const user = await getUser(uid, "remove theme");

  if (themeDoesNotExist(user.customThemes, _id)) {
    throw new MonkeyError(404, "Custom theme not found");
  }

  await getUsersCollection().updateOne(
    {
      uid: uid,
      "customThemes._id": new ObjectId(_id),
    },
    { $pull: { customThemes: { _id: new ObjectId(_id) } } }
  );
}

export async function editTheme(uid: string, _id, theme): Promise<void> {
  const user = await getUser(uid, "edit theme");

  if (themeDoesNotExist(user.customThemes, _id)) {
    throw new MonkeyError(404, "Custom Theme not found");
  }

  await getUsersCollection().updateOne(
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

export async function recordAutoBanEvent(
  uid: string,
  maxCount: number,
  maxHours: number
): Promise<boolean> {
  const user = await getUser(uid, "record auto ban event");

  let ret = false;

  if (user.banned) return ret;

  const autoBanTimestamps = user.autoBanTimestamps ?? [];

  const now = Date.now();

  //remove any old events
  const recentAutoBanTimestamps = autoBanTimestamps.filter(
    (timestamp) => timestamp >= now - maxHours * SECONDS_PER_HOUR * 1000
  );

  //push new event
  recentAutoBanTimestamps.push(now);

  //update user, ban if needed
  const updateObj: Partial<MonkeyTypes.User> = {
    autoBanTimestamps: recentAutoBanTimestamps,
  };
  if (recentAutoBanTimestamps.length > maxCount) {
    updateObj.banned = true;
    ret = true;
  }

  await getUsersCollection().updateOne({ uid }, { $set: updateObj });
  Logger.logToDb("user_auto_banned", { autoBanTimestamps }, uid);
  return ret;
}

export async function updateProfile(
  uid: string,
  profileDetailUpdates: Partial<MonkeyTypes.UserProfileDetails>,
  inventory?: MonkeyTypes.UserInventory
): Promise<void> {
  const profileUpdates = _.omitBy(
    flattenObjectDeep(profileDetailUpdates, "profileDetails"),
    (value) =>
      value === undefined || (_.isPlainObject(value) && _.isEmpty(value))
  );

  const updates = {
    $set: {
      ...profileUpdates,
      inventory,
    },
  };
  if (inventory === undefined) delete updates.$set.inventory;

  await getUsersCollection().updateOne(
    {
      uid,
    },
    updates
  );
}

export async function getInbox(
  uid: string
): Promise<MonkeyTypes.User["inbox"]> {
  const user = await getUser(uid, "get inventory");
  return user.inbox ?? [];
}

interface AddToInboxBulkEntry {
  uid: string;
  mail: MonkeyTypes.MonkeyMail[];
}

export async function addToInboxBulk(
  entries: AddToInboxBulkEntry[],
  inboxConfig: MonkeyTypes.Configuration["users"]["inbox"]
): Promise<void> {
  const { enabled, maxMail } = inboxConfig;

  if (!enabled) {
    return;
  }

  const bulk = getUsersCollection().initializeUnorderedBulkOp();

  entries.forEach((entry) => {
    bulk.find({ uid: entry.uid }).updateOne({
      $push: {
        inbox: {
          $each: entry.mail,
          $position: 0, // Prepends to the inbox
          $slice: maxMail, // Keeps inbox size to maxInboxSize, maxMail the oldest
        },
      },
    });
  });

  await bulk.execute();
}

export async function addToInbox(
  uid: string,
  mail: MonkeyTypes.MonkeyMail[],
  inboxConfig: MonkeyTypes.Configuration["users"]["inbox"]
): Promise<void> {
  const { enabled, maxMail } = inboxConfig;

  if (!enabled) {
    return;
  }

  await getUsersCollection().updateOne(
    {
      uid,
    },
    {
      $push: {
        inbox: {
          $each: mail,
          $position: 0, // Prepends to the inbox
          $slice: maxMail, // Keeps inbox size to maxMail, discarding the oldest
        },
      },
    }
  );
}

function buildRewardUpdates(
  rewards: MonkeyTypes.AllRewards[],
  inventoryIsNull = false
): UpdateFilter<WithId<MonkeyTypes.User>> {
  let totalXp = 0;
  const newBadges: MonkeyTypes.Badge[] = [];

  rewards.forEach((reward) => {
    if (reward.type === "xp") {
      totalXp += isNaN(reward.item) ? 0 : reward.item;
    } else if (reward.type === "badge") {
      const item = _.omit(reward.item, "selected");
      newBadges.push(item);
    }
  });

  const baseUpdate = {
    $inc: {
      xp: _.isNumber(totalXp) ? totalXp : 0,
    },
  };

  if (inventoryIsNull) {
    return {
      ...baseUpdate,
      $set: {
        inventory: {
          badges: newBadges,
        },
      },
    };
  } else {
    return {
      ...baseUpdate,
      $push: {
        "inventory.badges": { $each: newBadges },
      },
    };
  }
}

export async function updateInbox(
  uid: string,
  mailToRead: string[],
  mailToDelete: string[]
): Promise<void> {
  const user = await getUser(uid, "update inbox");

  const inbox = user.inbox ?? [];

  const mailToReadSet = new Set(mailToRead);
  const mailToDeleteSet = new Set(mailToDelete);

  const allRewards: MonkeyTypes.AllRewards[] = [];

  const newInbox = inbox
    .filter((mail) => {
      const { id, rewards } = mail;

      if (mailToReadSet.has(id) && !mail.read) {
        mail.read = true;
        if (rewards.length > 0) {
          allRewards.push(...rewards);
          mail.rewards = [];
        }
      }

      return !mailToDeleteSet.has(id);
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  const baseUpdate = {
    $set: {
      inbox: newInbox,
    },
  };
  const rewardUpdates = buildRewardUpdates(allRewards, user.inventory === null);
  const mergedUpdates = _.merge(baseUpdate, rewardUpdates);

  await getUsersCollection().updateOne({ uid }, mergedUpdates);
}

export async function updateStreak(
  uid: string,
  timestamp: number
): Promise<number> {
  const user = await getUser(uid, "calculate streak");
  const streak: MonkeyTypes.UserStreak = {
    lastResultTimestamp: user.streak?.lastResultTimestamp ?? 0,
    length: user.streak?.length ?? 0,
    maxLength: user.streak?.maxLength ?? 0,
  };

  if (isYesterday(streak.lastResultTimestamp)) {
    streak.length += 1;
  } else if (!isToday(streak.lastResultTimestamp)) {
    Logger.logToDb("streak_lost", { streak }, uid);
    streak.length = 1;
  }

  if (streak.length > streak.maxLength) {
    streak.maxLength = streak.length;
  }

  streak.lastResultTimestamp = timestamp;
  await getUsersCollection().updateOne({ uid }, { $set: { streak } });

  return streak.length;
}
