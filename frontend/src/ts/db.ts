import Ape from "./ape";
import * as Notifications from "./elements/notifications";
import { isAuthenticated, getAuthenticatedUser } from "./firebase";
import { lastElementFromArray } from "./utils/arrays";
import * as Dates from "date-fns";
import {
  TestActivityCalendar,
  ModifiableTestActivityCalendar,
} from "./elements/test-activity-calendar";
import { showLoaderBar, hideLoaderBar } from "./signals/loader-bar";
import { Badge, CustomTheme } from "@monkeytype/schemas/users";
import { Difficulty } from "@monkeytype/schemas/configs";
import {
  Mode,
  Mode2,
  PersonalBest,
  PersonalBests,
} from "@monkeytype/schemas/shared";
import {
  getDefaultSnapshot,
  Snapshot,
  SnapshotPreset,
  SnapshotResult,
  SnapshotUserTag,
} from "./constants/default-snapshot";
import { FunboxMetadata } from "../../../packages/funbox/src/types";
import { getFirstDayOfTheWeek } from "./utils/date-and-time";
import { Language } from "@monkeytype/schemas/languages";
import * as AuthEvent from "./observables/auth-event";
import {
  configurationPromise,
  get as getServerConfiguration,
} from "./ape/server-configuration";
import { Connection } from "@monkeytype/schemas/connections";

let dbSnapshot: Snapshot | undefined;
const firstDayOfTheWeek = getFirstDayOfTheWeek();

export class SnapshotInitError extends Error {
  public responseCode: number;
  constructor(message: string, responseCode: number) {
    super(message);
    this.name = "SnapshotInitError";
    // TODO INVESTIGATE
    // oxlint-disable-next-line
    this.responseCode = responseCode;
  }
}

export function getSnapshot(): Snapshot | undefined {
  return dbSnapshot;
}

export function setSnapshot(
  newSnapshot: Snapshot | undefined,
  options?: { dispatchEvent?: boolean },
): void {
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

  if (options?.dispatchEvent !== false) {
    AuthEvent.dispatch({ type: "snapshotUpdated", data: { isInitial: false } });
  }
}

export async function initSnapshot(): Promise<Snapshot | false> {
  //send api request with token that returns tags, presets, and data needed for snap
  const snap = getDefaultSnapshot();
  await configurationPromise;

  try {
    if (!isAuthenticated()) return false;

    const connectionsRequest = getServerConfiguration()?.connections.enabled
      ? Ape.connections.get()
      : { status: 200, body: { message: "", data: [] } };

    const [userResponse, presetsResponse, connectionsResponse] =
      await Promise.all([
        Ape.users.get(),
        Ape.presets.get(),
        connectionsRequest,
      ]);

    if (userResponse.status !== 200) {
      throw new SnapshotInitError(
        `${userResponse.body.message} (user)`,
        userResponse.status,
      );
    }
    if (presetsResponse.status !== 200) {
      throw new SnapshotInitError(
        `${presetsResponse.body.message} (presets)`,
        presetsResponse.status,
      );
    }
    if (connectionsResponse.status !== 200) {
      throw new SnapshotInitError(
        `${connectionsResponse.body.message} (connections)`,
        connectionsResponse.status,
      );
    }

    const userData = userResponse.body.data;
    const presetsData = presetsResponse.body.data;
    const connectionsData = connectionsResponse.body.data;

    if (userData === null) {
      throw new SnapshotInitError(
        `Request was successful but user data is null`,
        200,
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
        new Date(userData.testActivity.lastDay),
        firstDayOfTheWeek,
      );
    }

    const hourOffset = userData?.streak?.hourOffset;
    snap.streakHourOffset = hourOffset ?? undefined;

    if (userData.lbMemory !== undefined) {
      snap.lbMemory = userData.lbMemory;
    }

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
        },
      );
    }

    snap.connections = convertConnections(connectionsData);

    dbSnapshot = snap;
    return dbSnapshot;
  } catch (e) {
    dbSnapshot = getDefaultSnapshot();
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

  const response = await Ape.results.get({ query: { offset } });

  if (response.status !== 200) {
    Notifications.add("Error getting results", -1, { response });
    return false;
  }

  //another check in case user logs out while waiting for response
  if (!isAuthenticated()) return false;

  const results: SnapshotResult<Mode>[] = response.body.data.map((result) => {
    result.bailedOut ??= false;
    result.blindMode ??= false;
    result.lazyMode ??= false;
    result.difficulty ??= "normal";
    result.funbox ??= [];
    result.language ??= "english";
    result.numbers ??= false;
    result.punctuation ??= false;
    result.numbers ??= false;
    result.quoteLength ??= -1;
    result.restartCount ??= 0;
    result.incompleteTestSeconds ??= 0;
    result.afkDuration ??= 0;
    result.tags ??= [];
    return result as SnapshotResult<Mode>;
  });
  results?.sort((a, b) => b.timestamp - a.timestamp);

  if (dbSnapshot.results !== undefined && dbSnapshot.results.length > 0) {
    //merge
    const oldestTimestamp = lastElementFromArray(dbSnapshot.results)
      ?.timestamp as number;
    const resultsWithoutDuplicates = results.filter(
      (it) => it.timestamp < oldestTimestamp,
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
  theme: Omit<CustomTheme, "_id">,
): Promise<boolean> {
  if (!dbSnapshot) return false;

  dbSnapshot.customThemes ??= [];

  if (dbSnapshot.customThemes.length >= 20) {
    Notifications.add("Too many custom themes!", 0);
    return false;
  }

  const response = await Ape.users.addCustomTheme({ body: { ...theme } });
  if (response.status !== 200) {
    Notifications.add("Error adding custom theme", -1, { response });
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
  newTheme: Omit<CustomTheme, "_id">,
): Promise<boolean> {
  if (!isAuthenticated()) return false;
  if (!dbSnapshot) return false;

  dbSnapshot.customThemes ??= [];

  const customTheme = dbSnapshot.customThemes?.find((t) => t._id === themeId);
  if (!customTheme) {
    Notifications.add(
      "Editing failed: Custom theme with id: " + themeId + " does not exist",
      -1,
    );
    return false;
  }

  const response = await Ape.users.editCustomTheme({
    body: { themeId, theme: newTheme },
  });
  if (response.status !== 200) {
    Notifications.add("Error editing custom theme", -1, { response });
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
    Notifications.add("Error deleting custom theme", -1, { response });
    return false;
  }

  dbSnapshot.customThemes = dbSnapshot.customThemes?.filter(
    (t) => t._id !== themeId,
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
  lazyMode: boolean,
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
  lazyMode: boolean,
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
  lazyMode: boolean,
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
      lazyMode,
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
  funboxes: FunboxMetadata[],
): Promise<PersonalBest | undefined> {
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
      (pb.lazyMode ?? false) === lazyMode,
  );
}

function saveLocalPB<M extends Mode>(
  mode: M,
  mode2: Mode2<M>,
  punctuation: boolean,
  numbers: boolean,
  language: Language,
  difficulty: Difficulty,
  lazyMode: boolean,
  wpm: number,
  acc: number,
  raw: number,
  consistency: number,
): void {
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
        },
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
  lazyMode: boolean,
): Promise<number> {
  if (dbSnapshot === null) return 0;

  let ret = 0;

  const filteredtag = (getSnapshot()?.tags ?? []).find((t) => t._id === tagId);

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
        (pb.lazyMode === lazyMode || (pb.lazyMode === undefined && !lazyMode)),
    )?.wpm ?? 0;

  return ret;
}

export async function saveLocalTagPB<M extends Mode>(
  tagId: string,
  mode: M,
  mode2: Mode2<M>,
  punctuation: boolean,
  numbers: boolean,
  language: Language,
  difficulty: Difficulty,
  lazyMode: boolean,
  wpm: number,
  acc: number,
  raw: number,
  consistency: number,
): Promise<number | undefined> {
  if (!dbSnapshot) return;
  if (mode === "quote") return;
  function cont(): void {
    const filteredtag = dbSnapshot?.tags?.find(
      (t) => t._id === tagId,
    ) as SnapshotUserTag;

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

export function deleteLocalTag(tagId: string): void {
  getSnapshot()?.results?.forEach((result) => {
    const tagIndex = result.tags.indexOf(tagId);
    if (tagIndex > -1) {
      result.tags.splice(tagIndex, 1);
    }
  });
}

export async function updateLocalTagPB<M extends Mode>(
  tagId: string,
  mode: M,
  mode2: Mode2<M>,
  punctuation: boolean,
  numbers: boolean,
  language: Language,
  difficulty: Difficulty,
  lazyMode: boolean,
): Promise<void> {
  if (dbSnapshot === null) return;

  const filteredtag = (getSnapshot()?.tags ?? []).find((t) => t._id === tagId);

  if (filteredtag === undefined) return;

  const pb = {
    wpm: 0,
    acc: 0,
    rawWpm: 0,
    consistency: 0,
  };

  getSnapshot()?.results?.forEach((result) => {
    if (result.tags.includes(tagId) && result.wpm > pb.wpm) {
      if (
        result.mode === mode &&
        result.mode2 === mode2 &&
        result.punctuation === punctuation &&
        result.numbers === numbers &&
        result.language === language &&
        result.difficulty === difficulty &&
        result.lazyMode === lazyMode
      ) {
        pb.wpm = result.wpm;
        pb.acc = result.acc;
        pb.rawWpm = result.rawWpm;
        pb.consistency = result.consistency;
      }
    }
  });

  await saveLocalTagPB(
    tagId,
    mode,
    mode2,
    punctuation,
    numbers,
    language,
    difficulty,
    lazyMode,
    pb.wpm,
    pb.acc,
    pb.rawWpm,
    pb.consistency,
  );
}

export async function updateLbMemory<M extends Mode>(
  mode: M,
  mode2: Mode2<M>,
  language: Language,
  rank: number,
  api = false,
): Promise<void> {
  if (mode === "time") {
    const timeMode = mode;
    const timeMode2 = mode2 as "15" | "60";

    const snapshot = getSnapshot();
    if (!snapshot) return;
    snapshot.lbMemory ??= {
      time: { "15": { english: 0 }, "60": { english: 0 } },
    };
    snapshot.lbMemory[timeMode] ??= {
      "15": { english: 0 },
      "60": { english: 0 },
    };
    snapshot.lbMemory[timeMode][timeMode2] ??= {};
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

export type SaveLocalResultData = {
  xp?: number;
  streak?: number;
  result?: SnapshotResult<Mode>;
  isPb?: boolean;
};

export function saveLocalResult(data: SaveLocalResultData): void {
  const snapshot = getSnapshot();
  if (!snapshot) return;

  if (data.result !== undefined) {
    if (snapshot?.results !== undefined) {
      snapshot.results.unshift(data.result);
    }
    if (snapshot.testActivity !== undefined) {
      snapshot.testActivity.increment(new Date(data.result.timestamp));
    }
    snapshot.typingStats ??= {
      timeTyping: 0,
      startedTests: 0,
      completedTests: 0,
    };

    const time =
      data.result.testDuration +
      data.result.incompleteTestSeconds -
      data.result.afkDuration;

    snapshot.typingStats.timeTyping += time;
    snapshot.typingStats.startedTests += data.result.restartCount + 1;
    snapshot.typingStats.completedTests += 1;

    if (data.isPb) {
      saveLocalPB(
        data.result.mode,
        data.result.mode2,
        data.result.punctuation,
        data.result.numbers,
        data.result.language,
        data.result.difficulty,
        data.result.lazyMode,
        data.result.wpm,
        data.result.acc,
        data.result.rawWpm,
        data.result.consistency,
      );
    }
  }

  if (data.xp !== undefined) {
    snapshot.xp ??= 0;
    snapshot.xp += data.xp;
  }

  if (data.streak !== undefined) {
    snapshot.streak = data.streak;

    if (snapshot.streak > snapshot.maxStreak) {
      snapshot.maxStreak = snapshot.streak;
    }
  }

  setSnapshot(snapshot, {
    dispatchEvent: false,
  });
}

export function addXp(xp: number): void {
  const snapshot = getSnapshot();
  if (!snapshot) return;

  snapshot.xp ??= 0;
  snapshot.xp += xp;
  setSnapshot(snapshot, {
    dispatchEvent: false,
  });
}

export function updateInboxUnreadSize(newSize: number): void {
  const snapshot = getSnapshot();
  if (!snapshot) return;

  snapshot.inboxUnreadSize = newSize;
  setSnapshot(snapshot);
}

export function addBadge(badge: Badge): void {
  const snapshot = getSnapshot();
  if (!snapshot) return;

  snapshot.inventory ??= {
    badges: [],
  };
  snapshot.inventory.badges.push(badge);
  setSnapshot(snapshot);
}

export async function getTestActivityCalendar(
  yearString: string,
): Promise<TestActivityCalendar | undefined> {
  if (!isAuthenticated() || dbSnapshot === undefined) return undefined;

  if (yearString === "current") return dbSnapshot.testActivity;

  const currentYear = new Date().getFullYear().toString();
  if (yearString === currentYear) {
    return dbSnapshot.testActivity?.getFullYearCalendar();
  }

  if (dbSnapshot.testActivityByYear === undefined) {
    showLoaderBar();
    const response = await Ape.users.getTestActivity();
    if (response.status !== 200) {
      Notifications.add("Error getting test activities", -1, { response });
      hideLoaderBar();
      return undefined;
    }

    dbSnapshot.testActivityByYear = {};
    for (const year in response.body.data) {
      if (year === currentYear) continue;
      const testsByDays = response.body.data[year] ?? [];
      const lastDay = Dates.addDays(
        new Date(parseInt(year), 0, 1),
        testsByDays.length,
      );

      dbSnapshot.testActivityByYear[year] = new TestActivityCalendar(
        testsByDays,
        lastDay,
        firstDayOfTheWeek,
        true,
      );
    }
    hideLoaderBar();
  }

  return dbSnapshot.testActivityByYear[yearString];
}

export function mergeConnections(connections: Connection[]): void {
  const snapshot = getSnapshot();
  if (!snapshot) return;

  const update = convertConnections(connections);

  for (const [key, value] of Object.entries(update)) {
    snapshot.connections[key] = value;
  }

  setSnapshot(snapshot);
}

function convertConnections(
  connectionsData: Connection[],
): Snapshot["connections"] {
  return Object.fromEntries(
    connectionsData.map((connection) => {
      const isMyRequest =
        getAuthenticatedUser()?.uid === connection.initiatorUid;

      return [
        isMyRequest ? connection.receiverUid : connection.initiatorUid,
        connection.status === "pending" && !isMyRequest
          ? "incoming"
          : connection.status,
      ];
    }),
  );
}

export function isFriend(uid: string | undefined): boolean {
  if (uid === undefined || uid === getAuthenticatedUser()?.uid) return false;

  const snapshot = getSnapshot();
  if (!snapshot) return false;

  return Object.entries(snapshot.connections).some(
    ([receiverUid, status]) => receiverUid === uid && status === "accepted",
  );
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
