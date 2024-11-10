import Ape from "./ape";
import * as Notifications from "./elements/notifications";
import * as LoadingPage from "./pages/loading";
import DefaultConfig from "./constants/default-config";
import { isAuthenticated } from "./firebase";
import * as ConnectionState from "./states/connection";
import { lastElementFromArray } from "./utils/arrays";
import { getFunboxList } from "./utils/json-data";
import { migrateConfig } from "./utils/config";
import * as Dates from "date-fns";
import {
  TestActivityCalendar,
  ModifiableTestActivityCalendar,
} from "./elements/test-activity-calendar";
import * as Loader from "./elements/loader";

import {
  Badge,
  CustomTheme,
  ResultFilters,
  User,
  UserProfileDetails,
  UserTag,
} from "@monkeytype/contracts/schemas/users";
import { Config, Difficulty } from "@monkeytype/contracts/schemas/configs";
import {
  Mode,
  Mode2,
  PersonalBest,
  PersonalBests,
} from "@monkeytype/contracts/schemas/shared";
import { Preset } from "@monkeytype/contracts/schemas/presets";
import defaultSnapshot from "./constants/default-snapshot";
import { Result } from "@monkeytype/contracts/schemas/results";

export type SnapshotUserTag = UserTag & {
  active?: boolean;
  display: string;
};

export type SnapshotResult<M extends Mode> = Omit<
  Result<M>,
  | "_id"
  | "bailedOut"
  | "blindMode"
  | "lazyMode"
  | "difficulty"
  | "funbox"
  | "language"
  | "numbers"
  | "punctuation"
  | "quoteLength"
  | "restartCount"
  | "incompleteTestSeconds"
  | "afkDuration"
  | "tags"
> & {
  _id: string;
  bailedOut: boolean;
  blindMode: boolean;
  lazyMode: boolean;
  difficulty: string;
  funbox: string;
  language: string;
  numbers: boolean;
  punctuation: boolean;
  quoteLength: number;
  restartCount: number;
  incompleteTestSeconds: number;
  afkDuration: number;
  tags: string[];
};

export type Snapshot = Omit<
  User,
  | "timeTyping"
  | "startedTests"
  | "completedTests"
  | "profileDetails"
  | "streak"
  | "resultFilterPresets"
  | "tags"
  | "xp"
  | "testActivity"
> & {
  typingStats: {
    timeTyping: number;
    startedTests: number;
    completedTests: number;
  };
  details?: UserProfileDetails;
  inboxUnreadSize: number;
  streak: number;
  maxStreak: number;
  filterPresets: ResultFilters[];
  isPremium: boolean;
  streakHourOffset?: number;
  config: Config;
  tags: SnapshotUserTag[];
  presets: SnapshotPreset[];
  results?: SnapshotResult<Mode>[];
  xp: number;
  testActivity?: ModifiableTestActivityCalendar;
  testActivityByYear?: { [key: string]: TestActivityCalendar };
};

export type SnapshotPreset = Preset & {
  display: string;
};

let dbSnapshot: Snapshot | undefined;

export class SnapshotInitError extends Error {
  constructor(message: string, public responseCode: number) {
    super(message);
    this.name = "SnapshotInitError";
    this.responseCode = responseCode;
  }
}

export function getSnapshot(): Snapshot | undefined {
  return dbSnapshot;
}

export function setSnapshot(newSnapshot: Snapshot | undefined): void {
  const originalBanned = dbSnapshot?.banned;
  const originalVerified = dbSnapshot?.verified;
  const lbOptOut = dbSnapshot?.lbOptOut;

  //not allowing user to override these values i guess?
  try {
    delete newSnapshot?.banned;
  } catch {}
  try {
    delete newSnapshot?.verified;
  } catch {}
  try {
    delete newSnapshot?.lbOptOut;
  } catch {}
  dbSnapshot = newSnapshot;
  if (dbSnapshot) {
    dbSnapshot.banned = originalBanned;
    dbSnapshot.verified = originalVerified;
    dbSnapshot.lbOptOut = lbOptOut;
  }
}

export async function initSnapshot(): Promise<Snapshot | number | boolean> {
  //send api request with token that returns tags, presets, and data needed for snap
  const snap = defaultSnapshot as Snapshot;
  try {
    if (!isAuthenticated()) return false;
    // if (ActivePage.get() === "loading") {
    //   LoadingPage.updateBar(22.5);
    // } else {
    //   LoadingPage.updateBar(16);
    // }
    // LoadingPage.updateText("Downloading user...");

    const [userResponse, configResponse, presetsResponse] = await Promise.all([
      Ape.users.get(),
      Ape.configs.get(),
      Ape.presets.get(),
    ]);

    if (userResponse.status !== 200) {
      throw new SnapshotInitError(
        `${userResponse.body.message} (user)`,
        userResponse.status
      );
    }
    if (configResponse.status !== 200) {
      throw new SnapshotInitError(
        `${configResponse.body.message} (config)`,
        configResponse.status
      );
    }
    if (presetsResponse.status !== 200) {
      throw new SnapshotInitError(
        `${presetsResponse.body.message} (presets)`,
        presetsResponse.status
      );
    }

    const userData = userResponse.body.data;
    const configData = configResponse.body.data;
    const presetsData = presetsResponse.body.data;

    if (userData === null) {
      throw new SnapshotInitError(
        `Request was successful but user data is null`,
        200
      );
    }

    if (configData !== null && "config" in configData) {
      throw new Error(
        "Config data is not in the correct format. Please refresh the page or contact support."
      );
    }

    snap.name = userData.name;
    snap.personalBests = userData.personalBests;
    snap.personalBests ??= {
      time: {},
      words: {},
      quote: {},
      zen: {},
      custom: {},
    };

    for (const mode of ["time", "words", "quote", "zen", "custom"]) {
      snap.personalBests[mode as keyof PersonalBests] ??= {};
    }

    snap.banned = userData.banned;
    snap.lbOptOut = userData.lbOptOut;
    snap.verified = userData.verified;
    snap.discordId = userData.discordId;
    snap.discordAvatar = userData.discordAvatar;
    snap.needsToChangeName = userData.needsToChangeName;
    snap.typingStats = {
      timeTyping: userData.timeTyping ?? 0,
      startedTests: userData.startedTests ?? 0,
      completedTests: userData.completedTests ?? 0,
    };
    snap.quoteMod = userData.quoteMod;
    snap.favoriteQuotes = userData.favoriteQuotes ?? {};
    snap.quoteRatings = userData.quoteRatings;
    snap.details = userData.profileDetails;
    snap.addedAt = userData.addedAt;
    snap.inventory = userData.inventory;
    snap.xp = userData.xp ?? 0;
    snap.inboxUnreadSize = userData.inboxUnreadSize ?? 0;
    snap.streak = userData?.streak?.length ?? 0;
    snap.maxStreak = userData?.streak?.maxLength ?? 0;
    snap.filterPresets = userData.resultFilterPresets ?? [];
    snap.isPremium = userData?.isPremium ?? false;
    snap.allTimeLbs = userData.allTimeLbs;

    if (userData.testActivity !== undefined) {
      snap.testActivity = new ModifiableTestActivityCalendar(
        userData.testActivity.testsByDays,
        new Date(userData.testActivity.lastDay)
      );
    }

    const hourOffset = userData?.streak?.hourOffset;
    snap.streakHourOffset =
      hourOffset === undefined || hourOffset === null ? undefined : hourOffset;

    if (userData.lbMemory !== undefined) {
      snap.lbMemory = userData.lbMemory;
    }
    // if (ActivePage.get() === "loading") {
    //   LoadingPage.updateBar(45);
    // } else {
    //   LoadingPage.updateBar(32);
    // }
    // LoadingPage.updateText("Downloading config...");
    if (configData === undefined || configData === null) {
      snap.config = {
        ...DefaultConfig,
      };
    } else {
      snap.config = migrateConfig(configData);
    }
    // if (ActivePage.get() === "loading") {
    //   LoadingPage.updateBar(67.5);
    // } else {
    //   LoadingPage.updateBar(48);
    // }
    // LoadingPage.updateText("Downloading tags...");
    snap.customThemes = userData.customThemes ?? [];

    // const userDataTags: MonkeyTypes.UserTagWithDisplay[] = userData.tags ?? [];

    // userDataTags.forEach((tag) => {
    //   tag.display = tag.name.replaceAll("_", " ");
    //   tag.personalBests ??= {
    //     time: {},
    //     words: {},
    //     quote: {},
    //     zen: {},
    //     custom: {},
    //   };

    //   for (const mode of ["time", "words", "quote", "zen", "custom"]) {
    //     tag.personalBests[mode as keyof PersonalBests] ??= {};
    //   }
    // });

    // snap.tags = userDataTags;

    snap.tags =
      userData.tags?.map((tag) => ({
        ...tag,
        display: tag.name.replaceAll("_", " "),
      })) ?? [];

    snap.tags = snap.tags?.sort((a, b) => {
      if (a.name > b.name) {
        return 1;
      } else if (a.name < b.name) {
        return -1;
      } else {
        return 0;
      }
    });

    // if (ActivePage.get() === "loading") {
    //   LoadingPage.updateBar(90);
    // } else {
    //   LoadingPage.updateBar(64);
    // }
    // LoadingPage.updateText("Downloading presets...");

    if (presetsData !== undefined && presetsData !== null) {
      const presetsWithDisplay = presetsData.map((preset) => {
        return {
          ...preset,
          display: preset.name.replace(/_/gi, " "),
        };
      }) as SnapshotPreset[];
      snap.presets = presetsWithDisplay;

      snap.presets = snap.presets?.sort(
        (a: SnapshotPreset, b: SnapshotPreset) => {
          if (a.name > b.name) {
            return 1;
          } else if (a.name < b.name) {
            return -1;
          } else {
            return 0;
          }
        }
      );
    }

    dbSnapshot = snap;
    return dbSnapshot;
  } catch (e) {
    dbSnapshot = defaultSnapshot;
    throw e;
  }
}

export async function getUserResults(offset?: number): Promise<boolean> {
  if (!isAuthenticated()) return false;

  if (!dbSnapshot) return false;
  if (
    dbSnapshot.results !== undefined &&
    (offset === undefined || dbSnapshot.results.length > offset)
  ) {
    return false;
  }

  if (!ConnectionState.get()) {
    return false;
  }

  if (dbSnapshot.results === undefined) {
    LoadingPage.updateText("Downloading results...");
    LoadingPage.updateBar(90);
  }

  const response = await Ape.results.get({ query: { offset } });

  if (response.status !== 200) {
    Notifications.add("Error getting results: " + response.body.message, -1);
    return false;
  }

  const results: SnapshotResult<Mode>[] = response.body.data.map((result) => {
    if (result.bailedOut === undefined) result.bailedOut = false;
    if (result.blindMode === undefined) result.blindMode = false;
    if (result.lazyMode === undefined) result.lazyMode = false;
    if (result.difficulty === undefined) result.difficulty = "normal";
    if (result.funbox === undefined) result.funbox = "none";
    if (result.language === undefined || result.language === null) {
      result.language = "english";
    }
    if (result.numbers === undefined) result.numbers = false;
    if (result.punctuation === undefined) result.punctuation = false;
    if (result.numbers === undefined) result.numbers = false;
    if (result.quoteLength === undefined) result.quoteLength = -1;
    if (result.restartCount === undefined) result.restartCount = 0;
    if (result.incompleteTestSeconds === undefined) {
      result.incompleteTestSeconds = 0;
    }
    if (result.afkDuration === undefined) result.afkDuration = 0;
    if (result.tags === undefined) result.tags = [];
    return result as SnapshotResult<Mode>;
  });
  results?.sort((a, b) => b.timestamp - a.timestamp);

  if (dbSnapshot.results !== undefined && dbSnapshot.results.length > 0) {
    //merge
    const oldestTimestamp = lastElementFromArray(dbSnapshot.results)
      ?.timestamp as number;
    const resultsWithoutDuplicates = results.filter(
      (it) => it.timestamp < oldestTimestamp
    );
    dbSnapshot.results.push(...resultsWithoutDuplicates);
  } else {
    dbSnapshot.results = results;
  }
  return true;
}

function _getCustomThemeById(themeID: string): CustomTheme | undefined {
  return dbSnapshot?.customThemes?.find((t) => t._id === themeID);
}

export async function addCustomTheme(
  theme: Omit<CustomTheme, "_id">
): Promise<boolean> {
  if (!dbSnapshot) return false;

  if (dbSnapshot.customThemes === undefined) {
    dbSnapshot.customThemes = [];
  }

  if (dbSnapshot.customThemes.length >= 20) {
    Notifications.add("Too many custom themes!", 0);
    return false;
  }

  const response = await Ape.users.addCustomTheme({ body: { ...theme } });
  if (response.status !== 200) {
    Notifications.add(
      "Error adding custom theme: " + response.body.message,
      -1
    );
    return false;
  }

  if (response.body.data === null) {
    Notifications.add("Error adding custom theme: No data returned", -1);
    return false;
  }

  const newCustomTheme: CustomTheme = {
    ...theme,
    _id: response.body.data._id,
  };

  dbSnapshot.customThemes.push(newCustomTheme);
  return true;
}

export async function editCustomTheme(
  themeId: string,
  newTheme: Omit<CustomTheme, "_id">
): Promise<boolean> {
  if (!isAuthenticated()) return false;
  if (!dbSnapshot) return false;

  if (dbSnapshot.customThemes === undefined) {
    dbSnapshot.customThemes = [];
  }

  const customTheme = dbSnapshot.customThemes?.find((t) => t._id === themeId);
  if (!customTheme) {
    Notifications.add(
      "Editing failed: Custom theme with id: " + themeId + " does not exist",
      -1
    );
    return false;
  }

  const response = await Ape.users.editCustomTheme({
    body: { themeId, theme: newTheme },
  });
  if (response.status !== 200) {
    Notifications.add(
      "Error editing custom theme: " + response.body.message,
      -1
    );
    return false;
  }

  const newCustomTheme: CustomTheme = {
    ...newTheme,
    _id: themeId,
  };

  dbSnapshot.customThemes[dbSnapshot.customThemes.indexOf(customTheme)] =
    newCustomTheme;

  return true;
}

export async function deleteCustomTheme(themeId: string): Promise<boolean> {
  if (!isAuthenticated()) return false;
  if (!dbSnapshot) return false;

  const customTheme = dbSnapshot.customThemes?.find((t) => t._id === themeId);
  if (!customTheme) return false;

  const response = await Ape.users.deleteCustomTheme({ body: { themeId } });
  if (response.status !== 200) {
    Notifications.add(
      "Error deleting custom theme: " + response.body.message,
      -1
    );
    return false;
  }

  dbSnapshot.customThemes = dbSnapshot.customThemes?.filter(
    (t) => t._id !== themeId
  );

  return true;
}

export async function getUserAverage10<M extends Mode>(
  mode: M,
  mode2: Mode2<M>,
  punctuation: boolean,
  numbers: boolean,
  language: string,
  difficulty: Difficulty,
  lazyMode: boolean
): Promise<[number, number]> {
  const snapshot = getSnapshot();

  if (!snapshot) return [0, 0];

  function cont(): [number, number] {
    const activeTagIds: string[] = [];
    snapshot?.tags?.forEach((tag) => {
      if (tag.active === true) {
        activeTagIds.push(tag._id);
      }
    });

    let wpmSum = 0;
    let accSum = 0;
    let last10Wpm = 0;
    let last10Acc = 0;
    let count = 0;
    let last10Count = 0;

    if (snapshot?.results !== undefined) {
      for (const result of snapshot.results) {
        if (
          result.mode === mode &&
          (result.punctuation ?? false) === punctuation &&
          (result.numbers ?? false) === numbers &&
          result.language === language &&
          result.difficulty === difficulty &&
          (result.lazyMode === lazyMode ||
            (result.lazyMode === undefined && !lazyMode)) &&
          (activeTagIds.length === 0 ||
            activeTagIds.some((tagId) => result.tags?.includes(tagId)))
        ) {
          // Continue if the mode2 doesn't match and it's not a quote
          if (
            `${result.mode2}` !== `${mode2 as string | number}` &&
            mode !== "quote"
          ) {
            //using template strings because legacy results might use numbers in mode2
            continue;
          }

          // Grab the most recent results from the current mode
          if (last10Count < 10) {
            last10Wpm += result.wpm;
            last10Acc += result.acc;
            last10Count++;
          }

          // Check if the mode2 matches and if it does, add it to the sum, for quotes, this is the quote id
          if (`${result.mode2}` === `${mode2 as string | number}`) {
            //using template strings because legacy results might use numbers in mode2
            wpmSum += result.wpm;
            accSum += result.acc;
            count++;

            if (count >= 10) break;
          }
        }
      }
    }

    // Return the last 10 average wpm & acc for quote
    // if the current quote id has never been completed before by the user
    if (count === 0 && mode === "quote") {
      return [last10Wpm / last10Count, last10Acc / last10Count];
    }

    return [wpmSum / count, accSum / count];
  }

  const retval: [number, number] =
    snapshot === null || (await getUserResults()) === null ? [0, 0] : cont();

  return retval;
}

export async function getUserDailyBest<M extends Mode>(
  mode: M,
  mode2: Mode2<M>,
  punctuation: boolean,
  numbers: boolean,
  language: string,
  difficulty: Difficulty,
  lazyMode: boolean
): Promise<number> {
  const snapshot = getSnapshot();

  if (!snapshot) return 0;

  function cont(): number {
    const activeTagIds: string[] = [];
    snapshot?.tags?.forEach((tag) => {
      if (tag.active === true) {
        activeTagIds.push(tag._id);
      }
    });

    let bestWpm = 0;

    if (snapshot?.results !== undefined) {
      for (const result of snapshot.results) {
        if (
          result.mode === mode &&
          (result.punctuation ?? false) === punctuation &&
          (result.numbers ?? false) === numbers &&
          result.language === language &&
          result.difficulty === difficulty &&
          (result.lazyMode === lazyMode ||
            (result.lazyMode === undefined && !lazyMode)) &&
          (activeTagIds.length === 0 ||
            activeTagIds.some((tagId) => result.tags?.includes(tagId)))
        ) {
          if (result.timestamp < Date.now() - 86400000) {
            continue;
          }

          // Continue if the mode2 doesn't match and it's not a quote
          if (
            `${result.mode2}` !== `${mode2 as string | number}` &&
            mode !== "quote"
          ) {
            //using template strings because legacy results might use numbers in mode2
            continue;
          }

          if (result.wpm > bestWpm) {
            bestWpm = result.wpm;
          }
        }
      }
    }

    return bestWpm;
  }

  const retval: number =
    snapshot === null || (await getUserResults()) === null ? 0 : cont();

  return retval;
}

export async function getActiveTagsPB<M extends Mode>(
  mode: M,
  mode2: Mode2<M>,
  punctuation: boolean,
  numbers: boolean,
  language: string,
  difficulty: Difficulty,
  lazyMode: boolean
): Promise<number> {
  const snapshot = getSnapshot();
  if (!snapshot) return 0;

  let tagPbWpm = 0;
  for (const tag of snapshot.tags) {
    if (!tag.active) continue;
    const currTagPB = await getLocalTagPB(
      tag._id,
      mode,
      mode2,
      punctuation,
      numbers,
      language,
      difficulty,
      lazyMode
    );
    if (currTagPB > tagPbWpm) tagPbWpm = currTagPB;
  }

  return tagPbWpm;
}

export async function getLocalPB<M extends Mode>(
  mode: M,
  mode2: Mode2<M>,
  punctuation: boolean,
  numbers: boolean,
  language: string,
  difficulty: Difficulty,
  lazyMode: boolean,
  funbox: string
): Promise<PersonalBest | undefined> {
  const funboxes = (await getFunboxList()).filter((fb) => {
    return funbox?.split("#").includes(fb.name);
  });

  if (!funboxes.every((f) => f.canGetPb)) {
    return undefined;
  }

  const pbs = dbSnapshot?.personalBests?.[mode]?.[mode2] as
    | PersonalBest[]
    | undefined;

  return pbs?.find(
    (pb) =>
      (pb.punctuation ?? false) === punctuation &&
      (pb.numbers ?? false) === numbers &&
      pb.difficulty === difficulty &&
      pb.language === language &&
      (pb.lazyMode ?? false) === lazyMode
  );
}

export async function saveLocalPB<M extends Mode>(
  mode: M,
  mode2: Mode2<M>,
  punctuation: boolean,
  numbers: boolean,
  language: string,
  difficulty: Difficulty,
  lazyMode: boolean,
  wpm: number,
  acc: number,
  raw: number,
  consistency: number
): Promise<void> {
  if (mode === "quote") return;
  if (!dbSnapshot) return;
  function cont(): void {
    if (!dbSnapshot) return;
    let found = false;

    dbSnapshot.personalBests ??= {
      time: {},
      words: {},
      quote: {},
      zen: {},
      custom: {},
    };

    dbSnapshot.personalBests[mode] ??= {
      [mode2]: [],
    };

    dbSnapshot.personalBests[mode][mode2] ??=
      [] as unknown as PersonalBests[M][Mode2<M>];

    (
      dbSnapshot.personalBests[mode][mode2] as unknown as PersonalBest[]
    ).forEach((pb) => {
      if (
        (pb.punctuation ?? false) === punctuation &&
        (pb.numbers ?? false) === numbers &&
        pb.difficulty === difficulty &&
        pb.language === language &&
        (pb.lazyMode ?? false) === lazyMode
      ) {
        found = true;
        pb.wpm = wpm;
        pb.acc = acc;
        pb.raw = raw;
        pb.timestamp = Date.now();
        pb.consistency = consistency;
        pb.lazyMode = lazyMode;
      }
    });
    if (!found) {
      //nothing found
      (dbSnapshot.personalBests[mode][mode2] as unknown as PersonalBest[]).push(
        {
          language,
          difficulty,
          lazyMode,
          punctuation,
          numbers,
          wpm,
          acc,
          raw,
          timestamp: Date.now(),
          consistency,
        }
      );
    }
  }

  if (dbSnapshot !== null) {
    cont();
  }
}

export async function getLocalTagPB<M extends Mode>(
  tagId: string,
  mode: M,
  mode2: Mode2<M>,
  punctuation: boolean,
  numbers: boolean,
  language: string,
  difficulty: Difficulty,
  lazyMode: boolean
): Promise<number> {
  if (dbSnapshot === null) return 0;

  let ret = 0;

  const filteredtag = (getSnapshot()?.tags ?? []).filter(
    (t) => t._id === tagId
  )[0];

  if (filteredtag === undefined) return ret;

  filteredtag.personalBests ??= {
    time: {},
    words: {},
    quote: {},
    zen: {},
    custom: {},
  };

  filteredtag.personalBests[mode] ??= {
    [mode2]: [],
  };

  filteredtag.personalBests[mode][mode2] ??=
    [] as unknown as PersonalBests[M][Mode2<M>];

  const personalBests = (filteredtag.personalBests[mode][mode2] ??
    []) as PersonalBest[];

  ret =
    personalBests.find(
      (pb) =>
        (pb.punctuation ?? false) === punctuation &&
        (pb.numbers ?? false) === numbers &&
        pb.difficulty === difficulty &&
        pb.language === language &&
        (pb.lazyMode === lazyMode || (pb.lazyMode === undefined && !lazyMode))
    )?.wpm ?? 0;

  return ret;
}

export async function saveLocalTagPB<M extends Mode>(
  tagId: string,
  mode: M,
  mode2: Mode2<M>,
  punctuation: boolean,
  numbers: boolean,
  language: string,
  difficulty: Difficulty,
  lazyMode: boolean,
  wpm: number,
  acc: number,
  raw: number,
  consistency: number
): Promise<number | undefined> {
  if (!dbSnapshot) return;
  if (mode === "quote") return;
  function cont(): void {
    const filteredtag = dbSnapshot?.tags?.filter(
      (t) => t._id === tagId
    )[0] as SnapshotUserTag;

    filteredtag.personalBests ??= {
      time: {},
      words: {},
      quote: {},
      zen: {},
      custom: {},
    };

    filteredtag.personalBests[mode] ??= {
      [mode2]: [],
    };

    filteredtag.personalBests[mode][mode2] ??=
      [] as unknown as PersonalBests[M][Mode2<M>];

    try {
      let found = false;

      (
        filteredtag.personalBests[mode][mode2] as unknown as PersonalBest[]
      ).forEach((pb) => {
        if (
          (pb.punctuation ?? false) === punctuation &&
          (pb.numbers ?? false) === numbers &&
          pb.difficulty === difficulty &&
          pb.language === language &&
          (pb.lazyMode === lazyMode || (pb.lazyMode === undefined && !lazyMode))
        ) {
          found = true;
          pb.wpm = wpm;
          pb.acc = acc;
          pb.raw = raw;
          pb.timestamp = Date.now();
          pb.consistency = consistency;
          pb.lazyMode = lazyMode;
        }
      });
      if (!found) {
        //nothing found
        (
          filteredtag.personalBests[mode][mode2] as unknown as PersonalBest[]
        ).push({
          language,
          difficulty,
          lazyMode,
          punctuation,
          numbers,
          wpm,
          acc,
          raw,
          timestamp: Date.now(),
          consistency,
        });
      }
    } catch (e) {
      //that mode or mode2 is not found
      filteredtag.personalBests = {
        time: {},
        words: {},
        quote: {},
        zen: {},
        custom: {},
      };
      filteredtag.personalBests[mode][mode2] = [
        {
          language: language,
          difficulty: difficulty,
          lazyMode: lazyMode,
          punctuation: punctuation,
          numbers: numbers,
          wpm: wpm,
          acc: acc,
          raw: raw,
          timestamp: Date.now(),
          consistency: consistency,
        },
      ] as unknown as PersonalBests[M][Mode2<M>];
    }
  }

  if (dbSnapshot !== null) {
    cont();
  }

  return;
}

export async function updateLbMemory<M extends Mode>(
  mode: M,
  mode2: Mode2<M>,
  language: string,
  rank: number,
  api = false
): Promise<void> {
  if (mode === "time") {
    const timeMode = mode;
    const timeMode2 = mode2 as "15" | "60";

    const snapshot = getSnapshot();
    if (!snapshot) return;
    if (snapshot.lbMemory === undefined) {
      snapshot.lbMemory = {
        time: { "15": { english: 0 }, "60": { english: 0 } },
      };
    }
    if (snapshot.lbMemory[timeMode] === undefined) {
      snapshot.lbMemory[timeMode] = {
        "15": { english: 0 },
        "60": { english: 0 },
      };
    }
    if (snapshot.lbMemory[timeMode][timeMode2] === undefined) {
      snapshot.lbMemory[timeMode][timeMode2] = {};
    }
    const current = snapshot.lbMemory?.[timeMode]?.[timeMode2]?.[language];

    //this is protected above so not sure why it would be undefined
    const mem = snapshot.lbMemory[timeMode][timeMode2];
    mem[language] = rank;
    if (api && current !== rank) {
      await Ape.users.updateLeaderboardMemory({
        body: { mode, mode2, language, rank },
      });
    }
    setSnapshot(snapshot);
  }
}

export async function saveConfig(config: Config): Promise<void> {
  if (isAuthenticated()) {
    const response = await Ape.configs.save({ body: config });
    if (response.status !== 200) {
      Notifications.add("Failed to save config: " + response.body.message, -1);
    }
  }
}

export async function resetConfig(): Promise<void> {
  if (isAuthenticated()) {
    const response = await Ape.configs.delete();
    if (response.status !== 200) {
      Notifications.add("Failed to reset config: " + response.body.message, -1);
    }
  }
}

export function saveLocalResult(result: SnapshotResult<Mode>): void {
  const snapshot = getSnapshot();
  if (!snapshot) return;

  if (snapshot?.results !== undefined) {
    snapshot.results.unshift(result);

    setSnapshot(snapshot);
  }

  if (snapshot.testActivity !== undefined) {
    snapshot.testActivity.increment(new Date(result.timestamp));
    setSnapshot(snapshot);
  }
}

export function updateLocalStats(started: number, time: number): void {
  const snapshot = getSnapshot();
  if (!snapshot) return;
  if (snapshot.typingStats === undefined) {
    snapshot.typingStats = {
      timeTyping: 0,
      startedTests: 0,
      completedTests: 0,
    };
  }

  snapshot.typingStats.timeTyping += time;
  snapshot.typingStats.startedTests += started;
  snapshot.typingStats.completedTests += 1;

  setSnapshot(snapshot);
}

export function addXp(xp: number): void {
  const snapshot = getSnapshot();
  if (!snapshot) return;

  if (snapshot.xp === undefined) {
    snapshot.xp = 0;
  }
  snapshot.xp += xp;
  setSnapshot(snapshot);
}

export function addBadge(badge: Badge): void {
  const snapshot = getSnapshot();
  if (!snapshot) return;

  if (snapshot.inventory === undefined) {
    snapshot.inventory = {
      badges: [],
    };
  }
  snapshot.inventory.badges.push(badge);
  setSnapshot(snapshot);
}

export function setStreak(streak: number): void {
  const snapshot = getSnapshot();
  if (!snapshot) return;

  snapshot.streak = streak;

  if (snapshot.streak > snapshot.maxStreak) {
    snapshot.maxStreak = snapshot.streak;
  }

  setSnapshot(snapshot);
}

export async function getTestActivityCalendar(
  yearString: string
): Promise<TestActivityCalendar | undefined> {
  if (!isAuthenticated() || dbSnapshot === undefined) return undefined;

  if (yearString === "current") return dbSnapshot.testActivity;

  const currentYear = new Date().getFullYear().toString();
  if (yearString === currentYear) {
    return dbSnapshot.testActivity?.getFullYearCalendar();
  }

  if (dbSnapshot.testActivityByYear === undefined) {
    if (!ConnectionState.get()) {
      return undefined;
    }

    Loader.show();
    const response = await Ape.users.getTestActivity();
    if (response.status !== 200) {
      Notifications.add(
        "Error getting test activities: " + response.body.message,
        -1
      );
      Loader.hide();
      return undefined;
    }

    dbSnapshot.testActivityByYear = {};
    for (const year in response.body.data) {
      if (year === currentYear) continue;
      const testsByDays = response.body.data[year] ?? [];
      const lastDay = Dates.addDays(
        new Date(parseInt(year), 0, 1),
        testsByDays.length
      );

      dbSnapshot.testActivityByYear[year] = new TestActivityCalendar(
        testsByDays,
        lastDay,
        true
      );
    }
    Loader.hide();
  }

  return dbSnapshot.testActivityByYear[yearString];
}

// export async function DB.getLocalTagPB(tagId) {
//   function cont() {
//     let ret = 0;
//     try {
//       ret = dbSnapshot.tags.filter((t) => t.id === tagId)[0].pb;
//       if (ret === undefined) {
//         ret = 0;
//       }
//       return ret;
//     } catch (e) {
//       return ret;
//     }
//   }

//   const retval = dbSnapshot !== null ? cont() : undefined;

//   return retval;
// }

// export async functio(tagId, wpm) {
//   function cont() {
//     dbSnapshot.tags.forEach((tag) => {
//       if (tag._id === tagId) {
//         tag.pb = wpm;
//       }
//     });
//   }

//   if (dbSnapshot !== null) {
//     cont();
//   }
// }
