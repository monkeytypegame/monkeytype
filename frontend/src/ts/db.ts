import Ape from "./ape";
import * as Notifications from "./elements/notifications";
import * as LoadingPage from "./pages/loading";
import DefaultConfig from "./constants/default-config";
import { isAuthenticated } from "./firebase";
import { defaultSnap } from "./constants/default-snapshot";
import * as ConnectionState from "./states/connection";
import { lastElementFromArray } from "./utils/arrays";
import { getFunboxList } from "./utils/json-data";
import { mergeWithDefaultConfig } from "./utils/config";

let dbSnapshot: MonkeyTypes.Snapshot | undefined;

export function getSnapshot(): MonkeyTypes.Snapshot | undefined {
  return dbSnapshot;
}

export function setSnapshot(
  newSnapshot: MonkeyTypes.Snapshot | undefined
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
}

export async function initSnapshot(): Promise<
  MonkeyTypes.Snapshot | number | boolean
> {
  //send api request with token that returns tags, presets, and data needed for snap
  const snap = { ...defaultSnap };
  try {
    if (!isAuthenticated()) return false;
    // if (ActivePage.get() === "loading") {
    //   LoadingPage.updateBar(22.5);
    // } else {
    //   LoadingPage.updateBar(16);
    // }
    // LoadingPage.updateText("Downloading user...");

    const [userResponse, configResponse, presetsResponse] = await Promise.all([
      Ape.users.getData(),
      Ape.configs.get(),
      Ape.presets.get(),
    ]);

    //these objects are explicitly handled so its ok to throw that way
    if (userResponse.status !== 200) {
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw {
        message: `${userResponse.message} (user)`,
        responseCode: userResponse.status,
      };
    }
    if (configResponse.status !== 200) {
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw {
        message: `${configResponse.message} (config)`,
        responseCode: configResponse.status,
      };
    }
    if (presetsResponse.status !== 200) {
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw {
        message: `${presetsResponse.message} (presets)`,
        responseCode: presetsResponse.status,
      };
    }

    const userData = userResponse.data;
    const configData = configResponse.data;
    const presetsData = presetsResponse.data;

    if (userData === null) {
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw {
        message: "Request was successful but user data is null",
        responseCode: 200,
      };
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
      snap.personalBests[mode as keyof SharedTypes.PersonalBests] ??= {};
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
    snap.isPremium = userData?.isPremium;
    snap.allTimeLbs = userData.allTimeLbs;
    snap.testActivity = userData.testActivity;

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
      snap.config = mergeWithDefaultConfig(configData.config);
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
    //     tag.personalBests[mode as keyof SharedTypes.PersonalBests] ??= {};
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
      }) as MonkeyTypes.SnapshotPreset[];
      snap.presets = presetsWithDisplay;

      snap.presets = snap.presets?.sort((a, b) => {
        if (a.name > b.name) {
          return 1;
        } else if (a.name < b.name) {
          return -1;
        } else {
          return 0;
        }
      });
    }

    dbSnapshot = snap;
    return dbSnapshot;
  } catch (e) {
    dbSnapshot = defaultSnap;
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

  const response = await Ape.results.get(offset);

  if (response.status !== 200) {
    Notifications.add("Error getting results: " + response.message, -1);
    return false;
  }

  const results =
    response.data as SharedTypes.DBResult<SharedTypes.Config.Mode>[];
  results?.sort((a, b) => b.timestamp - a.timestamp);
  results.forEach((result) => {
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

    if (
      result.correctChars !== undefined &&
      result.incorrectChars !== undefined
    ) {
      result.charStats = [result.correctChars, result.incorrectChars, 0, 0];
    }
  });

  if (dbSnapshot.results !== undefined && dbSnapshot.results.length > 0) {
    //merge
    const oldestTimestamp = lastElementFromArray(dbSnapshot.results)
      ?.timestamp as number;
    const resultsWithoutDuplicates = results.filter(
      (it) => it.timestamp < oldestTimestamp
    );
    dbSnapshot.results.push(
      ...(resultsWithoutDuplicates as unknown as SharedTypes.Result<SharedTypes.Config.Mode>[])
    );
  } else {
    dbSnapshot.results =
      results as unknown as SharedTypes.Result<SharedTypes.Config.Mode>[];
  }
  return true;
}

function _getCustomThemeById(
  themeID: string
): MonkeyTypes.CustomTheme | undefined {
  return dbSnapshot?.customThemes?.find((t) => t._id === themeID);
}

export async function addCustomTheme(
  theme: MonkeyTypes.RawCustomTheme
): Promise<boolean> {
  if (!dbSnapshot) return false;

  if (dbSnapshot.customThemes === undefined) {
    dbSnapshot.customThemes = [];
  }

  if (dbSnapshot.customThemes.length >= 10) {
    Notifications.add("Too many custom themes!", 0);
    return false;
  }

  const response = await Ape.users.addCustomTheme(theme);
  if (response.status !== 200) {
    Notifications.add("Error adding custom theme: " + response.message, -1);
    return false;
  }

  if (response.data === null) {
    Notifications.add("Error adding custom theme: No data returned", -1);
    return false;
  }

  const newCustomTheme: MonkeyTypes.CustomTheme = {
    ...theme,
    _id: response.data._id as string,
  };

  dbSnapshot.customThemes.push(newCustomTheme);
  return true;
}

export async function editCustomTheme(
  themeId: string,
  newTheme: MonkeyTypes.RawCustomTheme
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

  const response = await Ape.users.editCustomTheme(themeId, newTheme);
  if (response.status !== 200) {
    Notifications.add("Error editing custom theme: " + response.message, -1);
    return false;
  }

  const newCustomTheme: MonkeyTypes.CustomTheme = {
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

  const response = await Ape.users.deleteCustomTheme(themeId);
  if (response.status !== 200) {
    Notifications.add("Error deleting custom theme: " + response.message, -1);
    return false;
  }

  dbSnapshot.customThemes = dbSnapshot.customThemes?.filter(
    (t) => t._id !== themeId
  );

  return true;
}

export async function getUserAverage10<M extends SharedTypes.Config.Mode>(
  mode: M,
  mode2: SharedTypes.Config.Mode2<M>,
  punctuation: boolean,
  numbers: boolean,
  language: string,
  difficulty: SharedTypes.Config.Difficulty,
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
            activeTagIds.some((tagId) => result.tags.includes(tagId)))
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

export async function getUserDailyBest<M extends SharedTypes.Config.Mode>(
  mode: M,
  mode2: SharedTypes.Config.Mode2<M>,
  punctuation: boolean,
  numbers: boolean,
  language: string,
  difficulty: SharedTypes.Config.Difficulty,
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
            activeTagIds.some((tagId) => result.tags.includes(tagId)))
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

export async function getLocalPB<M extends SharedTypes.Config.Mode>(
  mode: M,
  mode2: SharedTypes.Config.Mode2<M>,
  punctuation: boolean,
  numbers: boolean,
  language: string,
  difficulty: SharedTypes.Config.Difficulty,
  lazyMode: boolean,
  funbox: string
): Promise<number> {
  const funboxes = (await getFunboxList()).filter((fb) => {
    return funbox?.split("#").includes(fb.name);
  });

  if (!funboxes.every((f) => f.canGetPb)) {
    return 0;
  }
  if (dbSnapshot === null || dbSnapshot?.personalBests === null) return 0;

  const bestsByMode = dbSnapshot?.personalBests[mode][
    mode2
  ] as SharedTypes.PersonalBest[];

  if (bestsByMode === undefined) return 0;

  return (
    bestsByMode.find(
      (pb) =>
        (pb.punctuation ?? false) === punctuation &&
        (pb.numbers ?? false) === numbers &&
        pb.difficulty === difficulty &&
        pb.language === language &&
        (pb.lazyMode ?? false) === lazyMode
    )?.wpm ?? 0
  );
}

export async function saveLocalPB<M extends SharedTypes.Config.Mode>(
  mode: M,
  mode2: SharedTypes.Config.Mode2<M>,
  punctuation: boolean,
  numbers: boolean,
  language: string,
  difficulty: SharedTypes.Config.Difficulty,
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
      [] as unknown as SharedTypes.PersonalBests[M][SharedTypes.Config.Mode2<M>];

    (
      dbSnapshot.personalBests[mode][
        mode2
      ] as unknown as SharedTypes.PersonalBest[]
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
      (
        dbSnapshot.personalBests[mode][
          mode2
        ] as unknown as SharedTypes.PersonalBest[]
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
  }

  if (dbSnapshot !== null) {
    cont();
  }
}

export async function getLocalTagPB<M extends SharedTypes.Config.Mode>(
  tagId: string,
  mode: M,
  mode2: SharedTypes.Config.Mode2<M>,
  punctuation: boolean,
  numbers: boolean,
  language: string,
  difficulty: SharedTypes.Config.Difficulty,
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
    [] as unknown as SharedTypes.PersonalBests[M][SharedTypes.Config.Mode2<M>];

  const personalBests = (filteredtag.personalBests[mode][mode2] ??
    []) as SharedTypes.PersonalBest[];

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

export async function saveLocalTagPB<M extends SharedTypes.Config.Mode>(
  tagId: string,
  mode: M,
  mode2: SharedTypes.Config.Mode2<M>,
  punctuation: boolean,
  numbers: boolean,
  language: string,
  difficulty: SharedTypes.Config.Difficulty,
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
    )[0] as MonkeyTypes.UserTag;

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
      [] as unknown as SharedTypes.PersonalBests[M][SharedTypes.Config.Mode2<M>];

    try {
      let found = false;

      (
        filteredtag.personalBests[mode][
          mode2
        ] as unknown as SharedTypes.PersonalBest[]
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
          filteredtag.personalBests[mode][
            mode2
          ] as unknown as SharedTypes.PersonalBest[]
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
      ] as unknown as SharedTypes.PersonalBests[M][SharedTypes.Config.Mode2<M>];
    }
  }

  if (dbSnapshot !== null) {
    cont();
  }

  return;
}

export async function updateLbMemory<M extends SharedTypes.Config.Mode>(
  mode: M,
  mode2: SharedTypes.Config.Mode2<M>,
  language: string,
  rank: number,
  api = false
): Promise<void> {
  if (mode === "time") {
    const timeMode = mode as "time";
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
    const mem = snapshot.lbMemory[timeMode][timeMode2] as Record<
      string,
      number
    >;
    mem[language] = rank;
    if (api && current !== rank) {
      await Ape.users.updateLeaderboardMemory(mode, mode2, language, rank);
    }
    setSnapshot(snapshot);
  }
}

export async function saveConfig(config: SharedTypes.Config): Promise<void> {
  if (isAuthenticated()) {
    const response = await Ape.configs.save(config);
    if (response.status !== 200) {
      Notifications.add("Failed to save config: " + response.message, -1);
    }
  }
}

export function saveLocalResult(
  result: SharedTypes.Result<SharedTypes.Config.Mode>
): void {
  const snapshot = getSnapshot();
  if (!snapshot) return;

  if (snapshot?.results !== undefined) {
    snapshot.results.unshift(result);

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

export function addBadge(badge: SharedTypes.Badge): void {
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
