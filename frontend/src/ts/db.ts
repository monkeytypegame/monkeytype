import Ape from "./ape";
import * as AccountButton from "./elements/account-button";
import * as Notifications from "./elements/notifications";
import * as LoadingPage from "./pages/loading";
import DefaultConfig from "./constants/default-config";
import { Auth } from "./firebase";
import { defaultSnap } from "./constants/default-snapshot";

let dbSnapshot: MonkeyTypes.Snapshot;

export function getSnapshot(): MonkeyTypes.Snapshot {
  return dbSnapshot;
}

export function setSnapshot(newSnapshot: MonkeyTypes.Snapshot): void {
  try {
    delete newSnapshot.banned;
  } catch {}
  try {
    delete newSnapshot.verified;
  } catch {}
  dbSnapshot = newSnapshot;
}

export async function initSnapshot(): Promise<
  MonkeyTypes.Snapshot | number | boolean
> {
  //send api request with token that returns tags, presets, and data needed for snap
  const snap = defaultSnap;
  try {
    if (Auth.currentUser == null) return false;
    // if (ActivePage.get() == "loading") {
    //   LoadingPage.updateBar(22.5);
    // } else {
    //   LoadingPage.updateBar(16);
    // }
    // LoadingPage.updateText("Downloading user...");
    const [userResponse, configResponse, tagsResponse, presetsResponse] =
      await Promise.all([
        Ape.users.getData(),
        Ape.configs.get(),
        Ape.users.getTags(),
        Ape.presets.get(),
      ]);

    if (userResponse.status !== 200) {
      throw {
        message: `${userResponse.message} (user)`,
        responseCode: userResponse.status,
      };
    }
    if (configResponse.status !== 200) {
      throw {
        message: `${configResponse.message} (config)`,
        responseCode: configResponse.status,
      };
    }
    if (tagsResponse.status !== 200) {
      throw {
        message: `${tagsResponse.message} (tags)`,
        responseCode: tagsResponse.status,
      };
    }
    if (presetsResponse.status !== 200) {
      throw {
        message: `${presetsResponse.message} (presets)`,
        responseCode: presetsResponse.status,
      };
    }

    const [userData, configData, tagsData, presetsData] = [
      userResponse,
      configResponse,
      tagsResponse,
      presetsResponse,
    ].map((response: Ape.Response) => response.data);

    snap.name = userData.name;
    snap.personalBests = userData.personalBests;
    snap.banned = userData.banned;
    snap.verified = userData.verified;
    snap.discordId = userData.discordId;
    snap.needsToChangeName = userData.needsToChangeName;
    snap.globalStats = {
      time: userData.timeTyping,
      started: userData.startedTests,
      completed: userData.completedTests,
    };
    if (userData.quoteMod === true) snap.quoteMod = true;
    snap.favoriteQuotes = userData.favoriteQuotes ?? {};
    snap.quoteRatings = userData.quoteRatings;
    snap.favouriteThemes =
      userData.favouriteThemes === undefined ? [] : userData.favouriteThemes;

    if (userData.lbMemory?.time15 || userData.lbMemory?.time60) {
      //old memory format
      snap.lbMemory = {} as MonkeyTypes.LeaderboardMemory;
    } else if (userData.lbMemory) {
      snap.lbMemory = userData.lbMemory;
    }
    // if (ActivePage.get() == "loading") {
    //   LoadingPage.updateBar(45);
    // } else {
    //   LoadingPage.updateBar(32);
    // }
    // LoadingPage.updateText("Downloading config...");
    if (configData) {
      const newConfig = {
        ...DefaultConfig,
      };

      for (const key in configData.config) {
        const value = configData.config[key];
        (newConfig[
          key as keyof MonkeyTypes.Config
        ] as typeof configData[typeof key]) = value;
      }

      snap.config = newConfig;
    }
    // if (ActivePage.get() == "loading") {
    //   LoadingPage.updateBar(67.5);
    // } else {
    //   LoadingPage.updateBar(48);
    // }
    // LoadingPage.updateText("Downloading tags...");
    snap.customThemes = userData.customThemes ?? [];
    snap.tags = tagsData;

    snap.tags.forEach((tag) => {
      tag.display = tag.name.replaceAll("_", " ");
    });

    snap.tags = snap.tags?.sort((a, b) => {
      if (a.name > b.name) {
        return 1;
      } else if (a.name < b.name) {
        return -1;
      } else {
        return 0;
      }
    });
    // if (ActivePage.get() == "loading") {
    //   LoadingPage.updateBar(90);
    // } else {
    //   LoadingPage.updateBar(64);
    // }
    // LoadingPage.updateText("Downloading presets...");
    snap.presets = presetsData;

    snap.presets?.forEach((preset) => {
      preset.display = preset.name.replaceAll("_", " ");
    });

    snap.presets = snap.presets?.sort((a, b) => {
      if (a.name > b.name) {
        return 1;
      } else if (a.name < b.name) {
        return -1;
      } else {
        return 0;
      }
    });

    dbSnapshot = snap;
    return dbSnapshot;
  } catch (e) {
    dbSnapshot = defaultSnap;
    throw e;
  }
}

export async function getUserResults(): Promise<boolean> {
  const user = Auth.currentUser;
  if (user == null) return false;
  if (dbSnapshot === null) return false;
  if (dbSnapshot.results !== undefined) {
    return true;
  } else {
    LoadingPage.updateText("Downloading results...");
    LoadingPage.updateBar(90);

    const response = await Ape.results.get();

    if (response.status !== 200) {
      Notifications.add("Error getting results: " + response.message, -1);
      return false;
    }

    const results = response.data as MonkeyTypes.Result<MonkeyTypes.Mode>[];
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
      if (result.quoteLength === undefined) result.quoteLength = -1;
      if (result.restartCount === undefined) result.restartCount = 0;
      if (result.incompleteTestSeconds === undefined) {
        result.incompleteTestSeconds = 0;
      }
      if (result.afkDuration === undefined) result.afkDuration = 0;
      if (result.tags === undefined) result.tags = [];
    });
    dbSnapshot.results = results?.sort((a, b) => b.timestamp - a.timestamp);
    return true;
  }
}

export function getCustomThemeById(
  themeID: string
): MonkeyTypes.CustomTheme | undefined {
  return dbSnapshot.customThemes.find((t) => t._id === themeID);
}

export async function addCustomTheme(
  theme: MonkeyTypes.RawCustomTheme
): Promise<boolean> {
  if (dbSnapshot === null) return false;

  if (dbSnapshot.customThemes.length >= 10) {
    Notifications.add("Too many custom themes!", 0);
    return false;
  }

  const response = await Ape.users.addCustomTheme(theme);
  if (response.status !== 200) {
    Notifications.add("Error adding custom theme: " + response.message, -1);
    return false;
  }

  const newCustomTheme: MonkeyTypes.CustomTheme = {
    ...theme,
    _id: response.data.theme._id as string,
  };

  dbSnapshot.customThemes.push(newCustomTheme);
  return true;
}

export async function editCustomTheme(
  themeId: string,
  newTheme: MonkeyTypes.RawCustomTheme
): Promise<boolean> {
  const user = Auth.currentUser;
  if (user === null) return false;
  if (dbSnapshot === null) return false;

  const customTheme = dbSnapshot.customThemes.find((t) => t._id === themeId);
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
  const user = Auth.currentUser;
  if (user === null) return false;
  if (dbSnapshot === null) return false;

  const customTheme = dbSnapshot.customThemes.find((t) => t._id === themeId);
  if (!customTheme) return false;

  const response = await Ape.users.deleteCustomTheme(themeId);
  if (response.status !== 200) {
    Notifications.add("Error deleting custom theme: " + response.message, -1);
    return false;
  }

  dbSnapshot.customThemes = dbSnapshot.customThemes.filter(
    (t) => t._id !== themeId
  );

  return true;
}

export async function getUserHighestWpm<M extends MonkeyTypes.Mode>(
  mode: M,
  mode2: MonkeyTypes.Mode2<M>,
  punctuation: boolean,
  language: string,
  difficulty: MonkeyTypes.Difficulty,
  lazyMode: boolean
): Promise<number> {
  function cont(): number {
    let topWpm = 0;

    dbSnapshot.results?.forEach((result) => {
      if (
        result.mode == mode &&
        result.mode2 == mode2 &&
        result.punctuation == punctuation &&
        result.language == language &&
        result.difficulty == difficulty &&
        (result.lazyMode === lazyMode ||
          (result.lazyMode === undefined && lazyMode === false))
      ) {
        if (result.wpm > topWpm) {
          topWpm = result.wpm;
        }
      }
    });
    return topWpm;
  }

  const retval =
    dbSnapshot === null || dbSnapshot.results === undefined ? 0 : cont();

  return retval;
}

export async function getUserAverage10<M extends MonkeyTypes.Mode>(
  mode: M,
  mode2: MonkeyTypes.Mode2<M>,
  punctuation: boolean,
  language: string,
  difficulty: MonkeyTypes.Difficulty,
  lazyMode: boolean
): Promise<[number, number]> {
  const snapshot = getSnapshot();

  if (!snapshot) return [0, 0];

  function cont(): [number, number] {
    const activeTagIds: string[] = [];
    snapshot.tags?.forEach((tag) => {
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

    if (snapshot.results !== undefined) {
      for (const result of snapshot.results) {
        if (
          result.mode === mode &&
          result.punctuation === punctuation &&
          result.language === language &&
          result.difficulty === difficulty &&
          (result.lazyMode === lazyMode ||
            (result.lazyMode === undefined && lazyMode === false)) &&
          (activeTagIds.length === 0 ||
            activeTagIds.some((tagId) => result.tags.includes(tagId)))
        ) {
          // Continue if the mode2 doesn't match and it's not a quote
          if (result.mode2 !== mode2 && mode !== "quote") {
            continue;
          }

          // Grab the most recent results from the current mode
          if (last10Count < 10) {
            last10Wpm += result.wpm;
            last10Acc += result.acc;
            last10Count++;
          }

          // Check if the mode2 matches and if it does, add it to the sum, for quotes, this is the quote id
          if (result.mode2 === mode2) {
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

export async function getLocalPB<M extends MonkeyTypes.Mode>(
  mode: M,
  mode2: MonkeyTypes.Mode2<M>,
  punctuation: boolean,
  language: string,
  difficulty: MonkeyTypes.Difficulty,
  lazyMode: boolean,
  funbox: string
): Promise<number> {
  if (funbox !== "none" && funbox !== "plus_one" && funbox !== "plus_two") {
    return 0;
  }

  function cont(): number {
    let ret = 0;
    try {
      if (!dbSnapshot.personalBests) return ret;

      (
        dbSnapshot.personalBests[mode][
          mode2
        ] as unknown as MonkeyTypes.PersonalBest[]
      ).forEach((pb) => {
        if (
          pb.punctuation == punctuation &&
          pb.difficulty == difficulty &&
          pb.language == language &&
          (pb.lazyMode === lazyMode ||
            (pb.lazyMode === undefined && lazyMode === false))
        ) {
          ret = pb.wpm;
        }
      });

      return ret;
    } catch (e) {
      return ret;
    }
  }

  const retval = dbSnapshot === null ? 0 : cont();

  return retval;
}

export async function saveLocalPB<M extends MonkeyTypes.Mode>(
  mode: M,
  mode2: MonkeyTypes.Mode2<M>,
  punctuation: boolean,
  language: string,
  difficulty: MonkeyTypes.Difficulty,
  lazyMode: boolean,
  wpm: number,
  acc: number,
  raw: number,
  consistency: number
): Promise<void> {
  if (mode == "quote") return;
  function cont(): void {
    let found = false;
    if (dbSnapshot.personalBests === undefined) {
      dbSnapshot.personalBests = {
        time: {},
        words: {},
        zen: { zen: [] },
        quote: { custom: [] },
        custom: { custom: [] },
      };
    }

    if (dbSnapshot.personalBests[mode] === undefined) {
      if (mode === "zen") {
        dbSnapshot.personalBests["zen"] = { zen: [] };
      } else {
        dbSnapshot.personalBests[mode as Exclude<typeof mode, "zen">] = {
          custom: [],
        };
      }
    }

    if (dbSnapshot.personalBests[mode][mode2] === undefined) {
      dbSnapshot.personalBests[mode][mode2] =
        [] as unknown as MonkeyTypes.PersonalBests[M][keyof MonkeyTypes.PersonalBests[M]];
    }

    (
      dbSnapshot.personalBests[mode][
        mode2
      ] as unknown as MonkeyTypes.PersonalBest[]
    ).forEach((pb) => {
      if (
        pb.punctuation == punctuation &&
        pb.difficulty == difficulty &&
        pb.language == language &&
        (pb.lazyMode === lazyMode ||
          (pb.lazyMode === undefined && lazyMode === false))
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
        ] as unknown as MonkeyTypes.PersonalBest[]
      ).push({
        language: language,
        difficulty: difficulty,
        lazyMode: lazyMode,
        punctuation: punctuation,
        wpm: wpm,
        acc: acc,
        raw: raw,
        timestamp: Date.now(),
        consistency: consistency,
      });
    }
  }

  if (dbSnapshot != null) {
    cont();
  }
}

export async function getLocalTagPB<M extends MonkeyTypes.Mode>(
  tagId: string,
  mode: M,
  mode2: MonkeyTypes.Mode2<M>,
  punctuation: boolean,
  language: string,
  difficulty: MonkeyTypes.Difficulty,
  lazyMode: boolean
): Promise<number> {
  function cont(): number {
    let ret = 0;

    const filteredtag = (getSnapshot().tags ?? []).filter(
      (t) => t._id === tagId
    )[0];

    if (filteredtag === undefined) return ret;

    if (filteredtag.personalBests === undefined) {
      filteredtag.personalBests = {
        time: {},
        words: {},
        zen: { zen: [] },
        quote: { custom: [] },
        custom: { custom: [] },
      };
    }

    try {
      const personalBests = (filteredtag.personalBests[mode][mode2] ??
        []) as MonkeyTypes.PersonalBest[];

      personalBests.forEach((pb) => {
        if (
          pb.punctuation == punctuation &&
          pb.difficulty == difficulty &&
          pb.language == language &&
          (pb.lazyMode === lazyMode ||
            (pb.lazyMode === undefined && lazyMode === false))
        ) {
          ret = pb.wpm;
        }
      });
    } catch (e) {
      console.log(e);
    }
    return ret;
  }

  const retval = dbSnapshot === null ? 0 : cont();

  return retval;
}

export async function saveLocalTagPB<M extends MonkeyTypes.Mode>(
  tagId: string,
  mode: M,
  mode2: MonkeyTypes.Mode2<M>,
  punctuation: boolean,
  language: string,
  difficulty: MonkeyTypes.Difficulty,
  lazyMode: boolean,
  wpm: number,
  acc: number,
  raw: number,
  consistency: number
): Promise<number | undefined> {
  if (mode == "quote") return;
  function cont(): void {
    const filteredtag = dbSnapshot.tags?.filter(
      (t) => t._id === tagId
    )[0] as MonkeyTypes.Tag;

    if (!filteredtag.personalBests) {
      filteredtag.personalBests = {
        time: {},
        words: {},
        zen: { zen: [] },
        quote: { custom: [] },
        custom: { custom: [] },
      };
    }

    try {
      let found = false;
      if (filteredtag.personalBests[mode][mode2] === undefined) {
        filteredtag.personalBests[mode][mode2] =
          [] as unknown as MonkeyTypes.PersonalBests[M][keyof MonkeyTypes.PersonalBests[M]];
      }
      (
        filteredtag.personalBests[mode][
          mode2
        ] as unknown as MonkeyTypes.PersonalBest[]
      ).forEach((pb) => {
        if (
          pb.punctuation == punctuation &&
          pb.difficulty == difficulty &&
          pb.language == language &&
          (pb.lazyMode === lazyMode ||
            (pb.lazyMode === undefined && lazyMode === false))
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
          ] as unknown as MonkeyTypes.PersonalBest[]
        ).push({
          language: language,
          difficulty: difficulty,
          lazyMode: lazyMode,
          punctuation: punctuation,
          wpm: wpm,
          acc: acc,
          raw: raw,
          timestamp: Date.now(),
          consistency: consistency,
        });
      }
    } catch (e) {
      //that mode or mode2 is not found
      filteredtag.personalBests = {
        time: {},
        words: {},
        zen: { zen: [] },
        quote: { custom: [] },
        custom: { custom: [] },
      };
      if (mode === "zen") {
        filteredtag.personalBests["zen"] = { zen: [] };
      } else {
        filteredtag.personalBests[mode as Exclude<typeof mode, "zen">] = {
          custom: [],
        };
      }
      filteredtag.personalBests[mode][mode2] = [
        {
          language: language,
          difficulty: difficulty,
          lazyMode: lazyMode,
          punctuation: punctuation,
          wpm: wpm,
          acc: acc,
          raw: raw,
          timestamp: Date.now(),
          consistency: consistency,
        },
      ] as unknown as MonkeyTypes.PersonalBests[M][keyof MonkeyTypes.PersonalBests[M]];
    }
  }

  if (dbSnapshot != null) {
    cont();
  }

  return;
}

export async function updateLbMemory<M extends MonkeyTypes.Mode>(
  mode: M,
  mode2: MonkeyTypes.Mode2<M>,
  language: string,
  rank: number,
  api = false
): Promise<void> {
  //could dbSnapshot just be used here instead of getSnapshot()

  if (mode === "time") {
    const timeMode = mode as "time";
    const timeMode2 = mode2 as 15 | 60;

    const snapshot = getSnapshot();
    if (snapshot.lbMemory === undefined) {
      snapshot.lbMemory = { time: { 15: { english: 0 }, 60: { english: 0 } } };
    }
    if (snapshot.lbMemory[timeMode] === undefined) {
      snapshot.lbMemory[timeMode] = {
        15: { english: 0 },
        60: { english: 0 },
      };
    }
    if (snapshot.lbMemory[timeMode][timeMode2] === undefined) {
      snapshot.lbMemory[timeMode][timeMode2] = {};
    }
    const current = snapshot.lbMemory[timeMode][timeMode2][language];
    snapshot.lbMemory[timeMode][timeMode2][language] = rank;
    if (api && current != rank) {
      await Ape.users.updateLeaderboardMemory(mode, mode2, language, rank);
    }
    setSnapshot(snapshot);
  }
}

export async function saveConfig(config: MonkeyTypes.Config): Promise<void> {
  if (Auth.currentUser !== null) {
    AccountButton.loading(true);

    const response = await Ape.configs.save(config);
    if (response.status !== 200) {
      Notifications.add("Failed to save config: " + response.message, -1);
    }

    AccountButton.loading(false);
  }
}

export function saveLocalResult(
  result: MonkeyTypes.Result<MonkeyTypes.Mode>
): void {
  const snapshot = getSnapshot();

  if (snapshot !== null && snapshot.results !== undefined) {
    snapshot.results.unshift(result);

    setSnapshot(snapshot);
  }
}

export function updateLocalStats(stats: MonkeyTypes.Stats): void {
  const snapshot = getSnapshot();
  if (snapshot.globalStats === undefined) {
    snapshot.globalStats = {} as MonkeyTypes.Stats;
  }
  if (snapshot !== null && snapshot.globalStats !== undefined) {
    if (snapshot.globalStats.time == undefined) {
      snapshot.globalStats.time = stats.time;
    } else {
      snapshot.globalStats.time += stats.time;
    }
    if (snapshot.globalStats.started == undefined) {
      snapshot.globalStats.started = stats.started;
    } else {
      snapshot.globalStats.started += stats.started;
    }
    if (snapshot.globalStats.completed == undefined) {
      snapshot.globalStats.completed = 1;
    } else {
      snapshot.globalStats.completed += 1;
    }
  }

  setSnapshot(snapshot);
}

// export async function DB.getLocalTagPB(tagId) {
//   function cont() {
//     let ret = 0;
//     try {
//       ret = dbSnapshot.tags.filter((t) => t.id === tagId)[0].pb;
//       if (ret == undefined) {
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

//   if (dbSnapshot != null) {
//     cont();
//   }
// }
