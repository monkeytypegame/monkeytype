import _ from "lodash";
import { canFunboxGetPb, checkAndUpdatePb } from "../utils/pb";
import * as db from "../init/db";
import MonkeyError from "../utils/error";
import {
  Collection,
  ObjectId,
  Long,
  type UpdateFilter,
  type Filter,
} from "mongodb";
import { flattenObjectDeep, isToday, isYesterday } from "../utils/misc";
import { getCachedConfiguration } from "../init/configuration";
import { getDayOfYear } from "date-fns";
import { UTCDate } from "@date-fns/utc";
import {
  AllRewards,
  Badge,
  CustomTheme,
  MonkeyMail,
  UserInventory,
  UserProfileDetails,
  UserQuoteRatings,
  UserStreak,
  ResultFilters,
} from "@monkeytype/contracts/schemas/users";
import {
  Mode,
  Mode2,
  PersonalBest,
} from "@monkeytype/contracts/schemas/shared";
import { addImportantLog } from "./logs";
import { Result as ResultType } from "@monkeytype/contracts/schemas/results";
import { Configuration } from "@monkeytype/contracts/schemas/configuration";

const SECONDS_PER_HOUR = 3600;

type Result = Omit<ResultType<Mode>, "_id" | "name">;

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
    testActivity: {},
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
        testActivity: {},
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
  quoteRatings: UserQuoteRatings
): Promise<boolean> {
  await updateUser(
    { uid },
    { $set: { quoteRatings } },
    { stack: "update quote ratings" }
  );
  return true;
}

export async function updateEmail(
  uid: string,
  email: string
): Promise<boolean> {
  await updateUser({ uid }, { $set: { email } }, { stack: "update email" });

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

/**
 * Get user document only containing requested fields
 * @param uid  user id
 * @param stack stack description used in the error
 * @param fields list of fields
 * @returns partial DBUser only containing requested fields
 * @throws MonkeyError if user does not exist
 */
export async function getPartialUser<K extends keyof MonkeyTypes.DBUser>(
  uid: string,
  stack: string,
  fields: K[]
): Promise<Pick<MonkeyTypes.DBUser, K>> {
  const projection = new Map(fields.map((it) => [it, 1]));
  const results = await getUsersCollection().findOne({ uid }, { projection });
  if (results === null) throw new MonkeyError(404, "User not found", stack);

  return results;
}

export async function findByName(
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
  const user = await getUsersCollection().findOne(
    { discordId },
    { projection: { _id: 1 } }
  );
  return user === null;
}

export async function addResultFilterPreset(
  uid: string,
  resultFilter: ResultFilters,
  maxFiltersPerUser: number
): Promise<ObjectId> {
  if (maxFiltersPerUser === 0) {
    throw new MonkeyError(
      409,
      "Maximum number of custom filters reached",
      "add result filter preset"
    );
  }

  const _id = new ObjectId();
  const filter = { uid };
  filter[`resultFilterPresets.${maxFiltersPerUser - 1}`] = { $exists: false };

  await updateUser(
    filter,
    { $push: { resultFilterPresets: { ...resultFilter, _id } } },
    {
      statusCode: 409,
      message: "Maximum number of custom filters reached",
      stack: "add result filter preset",
    }
  );

  return _id;
}

export async function removeResultFilterPreset(
  uid: string,
  _id: string
): Promise<void> {
  const presetId = new ObjectId(_id);

  await updateUser(
    { uid, "resultFilterPresets._id": presetId },
    { $pull: { resultFilterPresets: { _id: presetId } } },
    {
      statusCode: 404,
      message: "Custom filter not found",
      stack: "remove result filter preset",
    }
  );
}

export async function addTag(
  uid: string,
  name: string
): Promise<MonkeyTypes.DBUserTag> {
  const toPush = {
    _id: new ObjectId(),
    name,
    personalBests: {
      time: {},
      words: {},
      quote: {},
      zen: {},
      custom: {},
    },
  };

  await updateUser(
    { uid, "tags.14": { $exists: false } },
    { $push: { tags: toPush } },
    {
      statusCode: 400,
      message: "Maximum number of tags reached",
      stack: "add tag",
    }
  );

  return toPush;
}

export async function getTags(uid: string): Promise<MonkeyTypes.DBUserTag[]> {
  const user = await getPartialUser(uid, "get tags", ["tags"]);

  return user.tags ?? [];
}

export async function editTag(
  uid: string,
  _id: string,
  name: string
): Promise<void> {
  const tagId = new ObjectId(_id);

  await updateUser(
    { uid, "tags._id": tagId },
    { $set: { "tags.$.name": name } },
    { statusCode: 404, message: "Tag not found", stack: "edit tag" }
  );
}

export async function removeTag(uid: string, _id: string): Promise<void> {
  const tagId = new ObjectId(_id);

  await updateUser(
    { uid, "tags._id": tagId },
    { $pull: { tags: { _id: tagId } } },
    { statusCode: 404, message: "Tag not found", stack: "remove tag" }
  );
}

export async function removeTagPb(uid: string, _id: string): Promise<void> {
  const tagId = new ObjectId(_id);

  await updateUser(
    { uid, "tags._id": tagId },
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
    },
    { statusCode: 404, message: "Tag not found", stack: "remove tag pb" }
  );
}

export async function updateLbMemory(
  uid: string,
  mode: Mode,
  mode2: Mode2<Mode>,
  language: string,
  rank: number
): Promise<void> {
  const partialUpdate = {};
  partialUpdate[`lbMemory.${mode}.${mode2}.${language}`] = rank;

  await updateUser(
    { uid },
    { $set: partialUpdate },
    { stack: "update lb memory" }
  );
}

export async function checkIfPb(
  uid: string,
  user: Pick<MonkeyTypes.DBUser, "personalBests" | "lbPersonalBests">,
  result: Result
): Promise<boolean> {
  const { mode } = result;

  if (!canFunboxGetPb(result)) return false;
  if ("stopOnLetter" in result && result.stopOnLetter === true) return false;

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
  user: Pick<MonkeyTypes.DBUser, "tags">,
  result: Result
): Promise<string[]> {
  if (user.tags === undefined || user.tags.length === 0) {
    return [];
  }

  const { mode, tags: resultTags } = result;
  if (!canFunboxGetPb(result)) return [];
  if ("stopOnLetter" in result && result.stopOnLetter === true) return [];

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
  await updateUser(
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
    },
    { stack: "reset pb" }
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
        lastReultHashes: lastHashes, //TODO fix typo
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
  await updateUser({ uid }, { $set: updates }, { stack: "link discord" });
}

export async function unlinkDiscord(uid: string): Promise<void> {
  await updateUser(
    { uid },
    { $unset: { discordId: "", discordAvatar: "" } },
    { stack: "unlink discord" }
  );
}

export async function incrementBananas(
  uid: string,
  wpm: number
): Promise<void> {
  //don't throw on missing user
  await getUsersCollection().updateOne(
    {
      uid,
      "personalBests.time.60": { $exists: true, $not: { $size: 0 } },
      $expr: {
        // wpm needs to be >= 75% of the the highest  time 60 PB
        $gte: [
          wpm,
          {
            $multiply: [
              //highest wpm with 0.75
              {
                $reduce: {
                  //find highest wpm from time 60 PBs
                  input: "$personalBests.time.60",
                  initialValue: 0,
                  in: {
                    $cond: [
                      { $gte: ["$$this.wpm", "$$value"] },
                      "$$this.wpm",
                      "$$value",
                    ],
                  },
                },
              },
              0.75,
            ],
          },
        ],
      },
    },
    { $inc: { bananas: 1 } }
  );
}

export async function incrementXp(uid: string, xp: number): Promise<void> {
  if (isNaN(xp)) xp = 0;
  await getUsersCollection().updateOne({ uid }, { $inc: { xp: new Long(xp) } });
}

export async function incrementTestActivity(
  user: MonkeyTypes.DBUser,
  timestamp: number
): Promise<void> {
  if (user.testActivity === undefined) {
    //migration script did not run yet
    return;
  }

  const date = new UTCDate(timestamp);
  const dayOfYear = getDayOfYear(date);
  const year = date.getFullYear();

  if (user.testActivity[year] === undefined) {
    await getUsersCollection().updateOne(
      { uid: user.uid },
      { $set: { [`testActivity.${date.getFullYear()}`]: [] } }
    );
  }

  await getUsersCollection().updateOne(
    { uid: user.uid },
    { $inc: { [`testActivity.${date.getFullYear()}.${dayOfYear - 1}`]: 1 } }
  );
}

export async function addTheme(
  uid: string,
  { name, colors }: Omit<CustomTheme, "_id">
): Promise<{ _id: ObjectId; name: string }> {
  const _id = new ObjectId();

  await updateUser(
    { uid, "customThemes.9": { $exists: false } },
    {
      $push: {
        customThemes: {
          _id,
          name: name,
          colors: colors,
        },
      },
    },
    {
      statusCode: 409,
      message: "Maximum number of custom themes reached",
      stack: "add theme",
    }
  );

  return {
    _id,
    name,
  };
}

export async function removeTheme(uid: string, id: string): Promise<void> {
  const themeId = new ObjectId(id);
  await updateUser(
    { uid, "customThemes._id": themeId },
    { $pull: { customThemes: { _id: themeId } } },
    {
      statusCode: 404,
      message: "Custom theme not found",
      stack: "remove theme",
    }
  );
}

export async function editTheme(
  uid: string,
  id: string,
  { name, colors }: Omit<CustomTheme, "_id">
): Promise<void> {
  const themeId = new ObjectId(id);

  await updateUser(
    { uid, "customThemes._id": themeId },
    {
      $set: {
        "customThemes.$.name": name,
        "customThemes.$.colors": colors,
      },
    },
    { statusCode: 404, message: "Custom theme not found", stack: "edit theme" }
  );
}

export async function getThemes(
  uid: string
): Promise<MonkeyTypes.DBCustomTheme[]> {
  const user = await getPartialUser(uid, "get themes", ["customThemes"]);
  return user.customThemes ?? [];
}

export async function getPersonalBests(
  uid: string,
  mode: string,
  mode2?: string
): Promise<PersonalBest> {
  const user = await getPartialUser(uid, "get personal bests", [
    "personalBests",
  ]);

  if (mode2 !== undefined) {
    return user.personalBests?.[mode]?.[mode2] as PersonalBest;
  }

  return user.personalBests?.[mode] as PersonalBest;
}

export async function getStats(
  uid: string
): Promise<
  Pick<MonkeyTypes.DBUser, "startedTests" | "completedTests" | "timeTyping">
> {
  const user = await getPartialUser(uid, "get stats", [
    "startedTests",
    "completedTests",
    "timeTyping",
  ]);

  return user;
}

export async function getFavoriteQuotes(
  uid: string
): Promise<NonNullable<MonkeyTypes.DBUser["favoriteQuotes"]>> {
  const user = await getPartialUser(uid, "get favorite quotes", [
    "favoriteQuotes",
  ]);

  return user.favoriteQuotes ?? {};
}

export async function addFavoriteQuote(
  uid: string,
  language: string,
  quoteId: string,
  maxQuotes: number
): Promise<void> {
  await updateUser(
    {
      uid,
      $expr: {
        //total amount of quotes need to be lower than maxQuotes
        $lt: [
          {
            $reduce: {
              input: { $objectToArray: "$favoriteQuotes" },
              initialValue: 0,
              in: { $add: ["$$value", { $size: "$$this.v" }] },
            },
          },
          maxQuotes,
        ],
      },
    },
    {
      $addToSet: {
        //ensure quoteId is unique in the array
        [`favoriteQuotes.${language}`]: quoteId,
      },
    },
    {
      statusCode: 409,
      message: "Maximum number of favorite quotes reached",
      stack: "add favorite quote",
    }
  );
}

export async function removeFavoriteQuote(
  uid: string,
  language: string,
  quoteId: string
): Promise<void> {
  await updateUser(
    { uid },
    { $pull: { [`favoriteQuotes.${language}`]: quoteId } },
    { stack: "remove favorite quote" }
  );
}

export async function recordAutoBanEvent(
  uid: string,
  maxCount: number,
  maxHours: number
): Promise<boolean> {
  const user = await getPartialUser(uid, "record auto ban event", [
    "banned",
    "autoBanTimestamps",
  ]);

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
  void addImportantLog(
    "user_auto_banned",
    { autoBanTimestamps, banningUser },
    uid
  );
  return ret;
}

export async function updateProfile(
  uid: string,
  profileDetailUpdates: Partial<UserProfileDetails>,
  inventory?: UserInventory
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
): Promise<NonNullable<MonkeyTypes.DBUser["inbox"]>> {
  const user = await getPartialUser(uid, "get inbox", ["inbox"]);
  return user.inbox ?? [];
}

type AddToInboxBulkEntry = {
  uid: string;
  mail: MonkeyMail[];
};

export async function addToInboxBulk(
  entries: AddToInboxBulkEntry[],
  inboxConfig: Configuration["users"]["inbox"]
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
  mail: MonkeyMail[],
  inboxConfig: Configuration["users"]["inbox"]
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

export async function updateInbox(
  uid: string,
  mailToRead: string[],
  mailToDelete: string[]
): Promise<void> {
  const deleteSet = [...new Set(mailToDelete)];

  //we don't need to read mails that are going to be deleted because
  //Rewards will be claimed on unread mails on deletion
  const readSet = [...new Set(mailToRead)].filter(
    (it) => !deleteSet.includes(it)
  );

  const update = await getUsersCollection().updateOne({ uid }, [
    {
      $addFields: {
        tmp: {
          $function: {
            lang: "js",
            args: ["$inbox", "$xp", "$inventory", deleteSet, readSet],
            body: function (
              inbox: MonkeyMail[],
              xp: number,
              inventory: UserInventory,
              deletedIds: string[],
              readIds: string[]
            ): Pick<MonkeyTypes.DBUser, "xp" | "inventory" | "inbox"> {
              const toBeDeleted = inbox.filter((it) =>
                deletedIds.includes(it.id)
              );

              const toBeRead = inbox.filter(
                (it) => readIds.includes(it.id) && !it.read
              );

              //flatMap rewards
              const rewards: AllRewards[] = [...toBeRead, ...toBeDeleted]
                .filter((it) => !it.read)
                .reduce((arr, current) => {
                  return [...arr, ...current.rewards];
                }, []);

              const xpGain = rewards
                .filter((it) => it.type === "xp")
                .map((it) => it.item)
                .reduce((s, a) => s + a, 0);

              const badgesToClaim = rewards
                .filter((it) => it.type === "badge")
                .map((it) => it.item);

              if (inventory === null)
                inventory = {
                  badges: [],
                };
              if (inventory.badges === null) inventory.badges = [];

              const uniqueBadgeIds = new Set();
              const newBadges: Badge[] = [];

              for (const badge of [...inventory.badges, ...badgesToClaim]) {
                if (uniqueBadgeIds.has(badge.id)) continue;
                uniqueBadgeIds.add(badge.id);
                newBadges.push(badge);
              }
              inventory.badges = newBadges;

              //remove deleted mail from inbox, sort by timestamp descending
              const inboxUpdate = inbox
                .filter((it) => !deletedIds.includes(it.id))
                .sort((a, b) => b.timestamp - a.timestamp);

              //mark read mail as read, remove rewards
              toBeRead.forEach((it) => {
                it.read = true;
                it.rewards = [];
              });

              return {
                xp: xp + xpGain,
                inbox: inboxUpdate,
                inventory: inventory,
              };
            }.toString(),
          },
        },
      },
    },
    {
      $set: {
        xp: "$tmp.xp",
        inbox: "$tmp.inbox",
        inventory: "$tmp.inventory",
      },
    },
    { $unset: "tmp" },
  ]);

  if (update.matchedCount !== 1)
    throw new MonkeyError(404, "User not found", "update inbox");
}

export async function updateStreak(
  uid: string,
  timestamp: number
): Promise<number> {
  const user = await getPartialUser(uid, "calculate streak", ["streak"]);
  const streak: UserStreak = {
    lastResultTimestamp: user.streak?.lastResultTimestamp ?? 0,
    length: user.streak?.length ?? 0,
    maxLength: user.streak?.maxLength ?? 0,
    hourOffset: user.streak?.hourOffset,
  };

  if (isYesterday(streak.lastResultTimestamp, streak.hourOffset ?? 0)) {
    streak.length += 1;
  } else if (!isToday(streak.lastResultTimestamp, streak.hourOffset ?? 0)) {
    void addImportantLog(
      "streak_lost",
      JSON.parse(JSON.stringify(streak)) as Record<string, unknown>,
      uid
    );
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
  userInfoOverride?: Pick<MonkeyTypes.DBUser, "premium">
): Promise<boolean> {
  const premiumFeaturesEnabled = (await getCachedConfiguration(true)).users
    .premium.enabled;
  if (!premiumFeaturesEnabled) {
    return false;
  }
  const user =
    userInfoOverride ??
    (await getPartialUser(uid, "checkIfUserIsPremium", ["premium"]));
  const expirationDate = user.premium?.expirationTimestamp;

  if (expirationDate === undefined) return false;
  if (expirationDate === -1) return true; //lifetime
  return expirationDate > Date.now();
}

export async function logIpAddress(
  uid: string,
  ip: string,
  userInfoOverride?: Pick<MonkeyTypes.DBUser, "ips">
): Promise<void> {
  const user =
    userInfoOverride ?? (await getPartialUser(uid, "logIpAddress", ["ips"]));
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

/**
 * Update user document. Requires the user to exist
 * @param filter user filter
 * @param update update document
 * @param error stack description used in the error or statusCode and message of the error
 * @throws MonkeyError if user does not exist
 */
async function updateUser(
  filter: Filter<MonkeyTypes.DBUser>,
  update: UpdateFilter<MonkeyTypes.DBUser>,
  error: { stack: string; statusCode?: number; message?: string }
): Promise<void> {
  const result = await getUsersCollection().updateOne(filter, update);

  if (result.matchedCount !== 1)
    throw new MonkeyError(
      error.statusCode ?? 404,
      error.message ?? "User not found",
      error.stack
    );
}
