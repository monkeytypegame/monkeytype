import _ from "lodash";
import { isUsernameValid } from "../utils/validation";
import { updateUserEmail } from "../utils/auth";
import { canFunboxGetPb, checkAndUpdatePb } from "../utils/pb";
import * as db from "../init/db";
import MonkeyError from "../utils/error";
import { Collection, ObjectId, Long, UpdateFilter } from "mongodb";
import Logger from "../utils/logger";
import {
  dayOfTheYear,
  flattenObjectDeep,
  isToday,
  isYesterday,
} from "../utils/misc";
import { getCachedConfiguration } from "../init/configuration";

const SECONDS_PER_HOUR = 3600;

type Result = Omit<
  SharedTypes.DBResult<SharedTypes.Config.Mode>,
  "_id" | "name"
>;

// Export for use in tests
export const getUsersCollection = (): Collection<MonkeyTypes.DBUser> =>
  db.collection<MonkeyTypes.DBUser>("users");

export async function addUser(
  name: string,
  email: string,
  uid: string
): Promise<void> {
  const newUserDocument: Partial<MonkeyTypes.DBUser> = {
    name,
    email,
    uid,
    addedAt: Date.now(),
    personalBests: {
      time: {},
      words: {},
      quote: {},
      zen: {},
      custom: {},
    },
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
          time: {},
          words: {},
          quote: {},
          zen: {},
          custom: {},
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
        lbOptOut: "",
        inbox: "",
      },
    }
  );
}

export async function updateName(
  uid: string,
  name: string,
  previousName: string
): Promise<void> {
  if (name === previousName) {
    throw new MonkeyError(400, "New name is the same as the old name");
  }
  if (!isUsernameValid(name)) {
    throw new MonkeyError(400, "Invalid username");
  }

  if (
    name?.toLowerCase() !== previousName?.toLowerCase() &&
    !(await isNameAvailable(name, uid))
  ) {
    throw new MonkeyError(409, "Username already taken", name);
  }

  await getUsersCollection().updateOne(
    { uid },
    {
      $set: { name, lastNameChange: Date.now() },
      $unset: { needsToChangeName: "" },
      $push: { nameHistory: previousName },
    }
  );
}

export async function flagForNameChange(uid: string): Promise<void> {
  await getUsersCollection().updateOne(
    { uid },
    { $set: { needsToChangeName: true } }
  );
}

export async function clearPb(uid: string): Promise<void> {
  await getUsersCollection().updateOne(
    { uid },
    {
      $set: {
        personalBests: {
          time: {},
          words: {},
          quote: {},
          zen: {},
          custom: {},
        },
        lbPersonalBests: {
          time: {},
        },
      },
    }
  );
}

export async function optOutOfLeaderboards(uid: string): Promise<void> {
  await getUsersCollection().updateOne(
    { uid },
    {
      $set: {
        lbOptOut: true,
        lbPersonalBests: {
          time: {},
        },
      },
    }
  );
}

export async function updateQuoteRatings(
  uid: string,
  quoteRatings: SharedTypes.UserQuoteRatings
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
): Promise<MonkeyTypes.DBUser> {
  const user = await getUsersCollection().findOne({ uid });
  if (!user) throw new MonkeyError(404, "User not found", stack);
  return user;
}

async function findByName(
  name: string
): Promise<MonkeyTypes.DBUser | undefined> {
  return (
    await getUsersCollection()
      .find({ name })
      .collation({ locale: "en", strength: 1 })
      .limit(1)
      .toArray()
  )[0];
}

export async function isNameAvailable(
  name: string,
  uid: string
): Promise<boolean> {
  const user = await findByName(name);
  // if the user found by name is the same as the user we are checking for, then the name is available
  // this means that the user can update the casing of their name without it being taken
  return user === undefined || user.uid === uid;
}

export async function getUserByName(
  name: string,
  stack: string
): Promise<MonkeyTypes.DBUser> {
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
  filter: SharedTypes.ResultFilters,
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
    user.resultFilterPresets.filter((t) => t._id.toString() === _id).length ===
      0
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
): Promise<MonkeyTypes.DBUserTag> {
  const user = await getUser(uid, "add tag");

  if ((user?.tags?.length ?? 0) >= 15) {
    throw new MonkeyError(400, "You can only have up to 15 tags");
  }

  const _id = new ObjectId();
  const toPush = {
    _id,
    name,
    personalBests: {
      time: {},
      words: {},
      quote: {},
      zen: {},
      custom: {},
    },
  };

  await getUsersCollection().updateOne(
    { uid },
    {
      $push: {
        tags: toPush,
      },
    }
  );
  return toPush;
}

export async function getTags(uid: string): Promise<MonkeyTypes.DBUserTag[]> {
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
    user.tags.filter((t) => t._id.toHexString() === _id).length === 0
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
    user.tags.filter((t) => t._id.toHexString() === _id).length === 0
  ) {
    throw new MonkeyError(404, "Tag not found");
  }
  await getUsersCollection().updateOne(
    {
      uid: uid,
      "tags._id": new ObjectId(_id),
    },
    {
      $set: {
        "tags.$.personalBests": {
          time: {},
          words: {},
          quote: {},
          zen: {},
          custom: {},
        },
      },
    }
  );
}

export async function updateLbMemory(
  uid: string,
  mode: SharedTypes.Config.Mode,
  mode2: SharedTypes.Config.Mode2<SharedTypes.Config.Mode>,
  language: string,
  rank: number
): Promise<void> {
  const user = await getUser(uid, "update lb memory");
  if (user.lbMemory === undefined) user.lbMemory = {};
  if (user.lbMemory[mode] === undefined) user.lbMemory[mode] = {};
  if (user.lbMemory[mode]?.[mode2] === undefined) {
    //@ts-expect-error guarded above
    user.lbMemory[mode][mode2] = {};
  }
  //@ts-expect-error guarded above
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
  user: MonkeyTypes.DBUser,
  result: Result
): Promise<boolean> {
  const { mode } = result;

  if (!canFunboxGetPb(result)) return false;

  if (mode === "quote") {
    return false;
  }

  user.personalBests ??= {
    time: {},
    custom: {},
    quote: {},
    words: {},
    zen: {},
  };
  user.lbPersonalBests ??= {
    time: {},
  };

  const pb = checkAndUpdatePb(user.personalBests, user.lbPersonalBests, result);

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
  user: MonkeyTypes.DBUser,
  result: Result
): Promise<string[]> {
  if (user.tags === undefined || user.tags.length === 0) {
    return [];
  }

  const { mode, tags: resultTags } = result;
  if (!canFunboxGetPb(result)) return [];

  if (mode === "quote") {
    return [];
  }

  const tagsToCheck: MonkeyTypes.DBUserTag[] = [];
  user.tags.forEach((userTag) => {
    for (const resultTag of resultTags ?? []) {
      if (resultTag === userTag._id.toHexString()) {
        tagsToCheck.push(userTag);
      }
    }
  });

  const ret: string[] = [];

  for (const tag of tagsToCheck) {
    tag.personalBests ??= {
      time: {},
      words: {},
      quote: {},
      zen: {},
      custom: {},
    };

    const tagpb = checkAndUpdatePb(tag.personalBests, undefined, result);
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
          words: {},
          quote: {},
          zen: {},
          custom: {},
        },
      },
    }
  );
}

export async function updateLastHashes(
  uid: string,
  lastHashes: string[]
): Promise<void> {
  await getUsersCollection().updateOne(
    { uid },
    {
      $set: {
        lastReultHashes: lastHashes,
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
  const updates: Partial<MonkeyTypes.DBUser> = _.pickBy(
    { discordId, discordAvatar },
    _.identity
  );
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
  const personalBests60 = user.personalBests?.time["60"];

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

export async function incrementTestsByYearAndDate(
  user: MonkeyTypes.DBUser,
  timestamp: number
): Promise<void> {
  const date = new Date(timestamp);
  const dayOfYear = dayOfTheYear(date);
  const year = date.getFullYear();

  if (
    user.testsByYearAndDay === undefined || //TODO initial fill from results collection in this case
    user.testsByYearAndDay[year] === undefined
  ) {
    await getUsersCollection().updateOne(
      { uid: user.uid },
      { $set: { [`testsByYearAndDay.${date.getFullYear()}`]: [] } }
    );
  }

  await getUsersCollection().updateOne(
    { uid: user.uid },
    { $inc: { [`testsByYearAndDay.${date.getFullYear()}.${dayOfYear}`]: 1 } }
  );
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
): Promise<MonkeyTypes.DBCustomTheme[]> {
  const user = await getUser(uid, "get themes");
  return user.customThemes ?? [];
}

export async function getPersonalBests(
  uid: string,
  mode: string,
  mode2?: string
): Promise<SharedTypes.PersonalBest> {
  const user = await getUser(uid, "get personal bests");

  if (mode2 !== undefined) {
    return user.personalBests?.[mode]?.[mode2];
  }

  return user.personalBests?.[mode];
}

export async function getStats(
  uid: string
): Promise<Record<string, number | undefined>> {
  const user = await getUser(uid, "get stats");

  return {
    startedTests: user.startedTests,
    completedTests: user.completedTests,
    timeTyping: user.timeTyping,
  };
}

export async function getFavoriteQuotes(
  uid
): Promise<MonkeyTypes.DBUser["favoriteQuotes"]> {
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
    if (user.favoriteQuotes[language]?.includes(quoteId)) {
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

  if (!user.favoriteQuotes?.[language]?.includes(quoteId)) {
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

  //only keep events within the last maxHours
  const recentAutoBanTimestamps = autoBanTimestamps.filter(
    (timestamp) => timestamp >= now - maxHours * SECONDS_PER_HOUR * 1000
  );

  //push new event
  recentAutoBanTimestamps.push(now);

  //update user, ban if needed
  const updateObj: Partial<MonkeyTypes.DBUser> = {
    autoBanTimestamps: recentAutoBanTimestamps,
  };
  let banningUser = false;
  if (recentAutoBanTimestamps.length > maxCount) {
    updateObj.banned = true;
    banningUser = true;
    ret = true;
  }

  await getUsersCollection().updateOne({ uid }, { $set: updateObj });
  void Logger.logToDb(
    "user_auto_banned",
    { autoBanTimestamps, banningUser },
    uid
  );
  return ret;
}

export async function updateProfile(
  uid: string,
  profileDetailUpdates: Partial<SharedTypes.UserProfileDetails>,
  inventory?: SharedTypes.UserInventory
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
): Promise<MonkeyTypes.DBUser["inbox"]> {
  const user = await getUser(uid, "get inventory");
  return user.inbox ?? [];
}

type AddToInboxBulkEntry = {
  uid: string;
  mail: SharedTypes.MonkeyMail[];
};

export async function addToInboxBulk(
  entries: AddToInboxBulkEntry[],
  inboxConfig: SharedTypes.Configuration["users"]["inbox"]
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
  mail: SharedTypes.MonkeyMail[],
  inboxConfig: SharedTypes.Configuration["users"]["inbox"]
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
  rewards: SharedTypes.AllRewards[],
  inventoryIsNull = false
): UpdateFilter<MonkeyTypes.DBUser> {
  let totalXp = 0;
  const newBadges: SharedTypes.Badge[] = [];

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

  const allRewards: SharedTypes.AllRewards[] = [];

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
  const streak: SharedTypes.UserStreak = {
    lastResultTimestamp: user.streak?.lastResultTimestamp ?? 0,
    length: user.streak?.length ?? 0,
    maxLength: user.streak?.maxLength ?? 0,
    hourOffset: user.streak?.hourOffset,
  };

  if (isYesterday(streak.lastResultTimestamp, streak.hourOffset ?? 0)) {
    streak.length += 1;
  } else if (!isToday(streak.lastResultTimestamp, streak.hourOffset ?? 0)) {
    void Logger.logToDb("streak_lost", JSON.parse(JSON.stringify(streak)), uid);
    streak.length = 1;
  }

  if (streak.length > streak.maxLength) {
    streak.maxLength = streak.length;
  }

  streak.lastResultTimestamp = timestamp;

  if (user.streak?.hourOffset === 0) {
    // todo this needs to be removed after a while
    delete streak.hourOffset;
  }

  await getUsersCollection().updateOne({ uid }, { $set: { streak } });

  return streak.length;
}

export async function setStreakHourOffset(
  uid: string,
  hourOffset: number
): Promise<void> {
  await getUsersCollection().updateOne(
    { uid },
    {
      $set: {
        "streak.hourOffset": hourOffset,
        "streak.lastResultTimestamp": Date.now(),
      },
    }
  );
}

export async function setBanned(uid: string, banned: boolean): Promise<void> {
  if (banned) {
    await getUsersCollection().updateOne({ uid }, { $set: { banned: true } });
  } else {
    await getUsersCollection().updateOne({ uid }, { $unset: { banned: "" } });
  }
}

export async function checkIfUserIsPremium(
  uid: string,
  userInfoOverride?: MonkeyTypes.DBUser
): Promise<boolean> {
  const premiumFeaturesEnabled = (await getCachedConfiguration(true)).users
    .premium.enabled;
  if (!premiumFeaturesEnabled) {
    return false;
  }
  const user = userInfoOverride ?? (await getUser(uid, "checkIfUserIsPremium"));
  const expirationDate = user.premium?.expirationTimestamp;

  if (expirationDate === undefined) return false;
  if (expirationDate === -1) return true; //lifetime
  return expirationDate > Date.now();
}

export async function logIpAddress(
  uid: string,
  ip: string,
  userInfoOverride?: MonkeyTypes.DBUser
): Promise<void> {
  const user = userInfoOverride ?? (await getUser(uid, "logIpAddress"));
  const currentIps = user.ips ?? [];
  const ipIndex = currentIps.indexOf(ip);
  if (ipIndex !== -1) {
    currentIps.splice(ipIndex, 1);
  }
  currentIps.unshift(ip);
  if (currentIps.length > 10) {
    currentIps.pop();
  }
  await getUsersCollection().updateOne({ uid }, { $set: { ips: currentIps } });
}
