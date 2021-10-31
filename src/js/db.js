import { loadTags } from "./result-filters";
import * as AccountButton from "./account-button";
import * as Notifications from "./notifications";
import axiosInstance from "./axios-instance";
import * as TodayTracker from "./today-tracker";

let dbSnapshot = null;

export function updateName(uid, name) {
  //TODO update
  axiosInstance.post("/updateName", {
    name: name,
  });
}

export function getSnapshot() {
  return dbSnapshot;
}

export function setSnapshot(newSnapshot) {
  try {
    delete newSnapshot.banned;
  } catch {}
  try {
    delete newSnapshot.verified;
  } catch {}
  dbSnapshot = newSnapshot;
}

export async function initSnapshot() {
  //send api request with token that returns tags, presets, and data needed for snap
  let defaultSnap = {
    results: undefined,
    personalBests: {},
    name: undefined,
    presets: [],
    tags: [],
    favouriteThemes: [],
    banned: undefined,
    verified: undefined,
    emailVerified: undefined,
    lbMemory: {},
    globalStats: {
      time: 0,
      started: 0,
      completed: 0,
    },
    quoteRatings: undefined,
    quoteMod: false,
  };
  let snap = defaultSnap;
  try {
    if (firebase.auth().currentUser == null) return false;
    let userData = await axiosInstance.get("/user");
    userData = userData.data;
    snap.name = userData.name;
    snap.personalBests = userData.personalBests;
    snap.banned = userData.banned;
    snap.verified = userData.verified;
    snap.discordId = userData.discordId;
    snap.globalStats = {
      time: userData.timeTyping,
      started: userData.startedTests,
      completed: userData.completedTests,
    };
    if (userData.quoteMod === true) snap.quoteMod = true;
    snap.quoteRatings = userData.quoteRatings;
    snap.favouriteThemes =
      userData.favouriteThemes === undefined ? [] : userData.favouriteThemes;

    if (userData.lbMemory?.time15 || userData.lbMemory?.time60) {
      //old memory format
      snap.lbMemory = {};
    } else if (userData.lbMemory) {
      snap.lbMemory = userData.lbMemory;
    }

    let configData = await axiosInstance.get("/config");
    configData = configData.data;
    if (configData) {
      snap.config = configData.config;
    }

    let tagsData = await axiosInstance.get("/user/tags");
    snap.tags = tagsData.data;
    snap.tags = snap.tags.sort((a, b) => {
      if (a.name > b.name) {
        return 1;
      } else if (a.name < b.name) {
        return -1;
      } else {
        return 0;
      }
    });

    let presetsData = await axiosInstance.get("/presets");
    snap.presets = presetsData.data;
    snap.presets = snap.presets.sort((a, b) => {
      if (a.name > b.name) {
        return 1;
      } else if (a.name < b.name) {
        return -1;
      } else {
        return 0;
      }
    });

    dbSnapshot = snap;
    loadTags(dbSnapshot.tags);
    return dbSnapshot;
  } catch (e) {
    dbSnapshot = defaultSnap;
    throw e;
  }
}

export async function getUserResults() {
  let user = firebase.auth().currentUser;
  if (user == null) return false;
  if (dbSnapshot === null) return false;
  if (dbSnapshot.results !== undefined) {
    return true;
  } else {
    try {
      let results = await axiosInstance.get("/results");
      results.data.forEach((result) => {
        if (result.bailedOut === undefined) result.bailedOut = false;
        if (result.blindMode === undefined) result.blindMode = false;
        if (result.lazyMode === undefined) result.lazyMode = false;
        if (result.difficulty === undefined) result.difficulty = "normal";
        if (result.funbox === undefined) result.funbox = "none";
        if (result.language === undefined || result.language === null)
          result.language = "english";
        if (result.numbers === undefined) result.numbers = false;
        if (result.punctuation === undefined) result.punctuation = false;
      });
      results.data = results.data.sort((a, b) => {
        return a.timestamp < b.timestamp;
      });
      dbSnapshot.results = results.data;
      await TodayTracker.addAllFromToday();
      return true;
    } catch (e) {
      Notifications.add("Error getting results", -1);
      return false;
    }
  }
  /*
    try {
      return await db
        .collection(`users/${user.uid}/results/`)
        .orderBy("timestamp", "desc")
        .limit(1000)
        .get()
        .then(async (data) => {
          dbSnapshot.results = [];
          data.docs.forEach((doc) => {
            let result = doc.data();
            result.id = doc.id;

            //this should be done server-side
            if (result.bailedOut === undefined) result.bailedOut = false;
            if (result.blindMode === undefined) result.blindMode = false;
            if (result.difficulty === undefined) result.difficulty = "normal";
            if (result.funbox === undefined) result.funbox = "none";
            if (result.language === undefined) result.language = "english";
            if (result.numbers === undefined) result.numbers = false;
            if (result.punctuation === undefined) result.punctuation = false;

            dbSnapshot.results.push(result);
          });
          await TodayTracker.addAllFromToday();
          return true;
        })
        .catch((e) => {
          throw e;
        });
    } catch (e) {
      console.error(e);
      return false;
    }
  }
  */
}

export async function getUserHighestWpm(
  mode,
  mode2,
  punctuation,
  language,
  difficulty,
  lazyMode
) {
  function cont() {
    let topWpm = 0;
    dbSnapshot.results.forEach((result) => {
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

  let retval;
  if (dbSnapshot == null || dbSnapshot.results === undefined) {
    retval = 0;
  } else {
    retval = cont();
  }
  return retval;
}

export async function getUserAverageWpm10(
  mode,
  mode2,
  punctuation,
  language,
  difficulty,
  lazyMode
) {
  function cont() {
    let wpmSum = 0;
    let count = 0;
    let last10Wpm = 0;
    let last10Count = 0;
    // You have to use every so you can break out of the loop
    dbSnapshot.results.every((result) => {
      if (
        result.mode == mode &&
        result.punctuation == punctuation &&
        result.language == language &&
        result.difficulty == difficulty &&
        (result.lazyMode === lazyMode ||
          (result.lazyMode === undefined && lazyMode === false))
      ) {
        // Continue if the mode2 doesn't match unless it's a quote.
        if (result.mode2 != mode2 && mode != "quote") {
          return true;
        }

        // Grab the most recent 10 wpm's for the current mode.
        if (last10Count < 10) {
          last10Wpm += result.wpm;
          last10Count++;
        }

        // Check mode2 matches and append, for quotes this is the quote id.
        if (result.mode2 == mode2) {
          wpmSum += result.wpm;
          count++;
          if (count >= 10) {
            // Break out of every loop since we a maximum of the last 10 wpm results.
            return false;
          }
        }
      }
      return true;
    });

    // Return the last 10 average wpm for quote if the current quote id has never been completed before by the user.
    if (count == 0 && mode == "quote") {
      return Math.round(last10Wpm / last10Count);
    }

    // Return the average wpm of the last 10 completions for the targeted test mode.
    return Math.round(wpmSum / count);
  }

  let retval = 0;

  if (dbSnapshot == null) return retval;
  var dbSnapshotValid = await getUserResults();
  if (dbSnapshotValid === false) {
    return retval;
  }
  retval = cont();
  return retval;
}

export async function getLocalPB(
  mode,
  mode2,
  punctuation,
  language,
  difficulty,
  lazyMode,
  funbox
) {
  if (funbox !== "none" && funbox !== "plus_one" && funbox !== "plus_two") {
    return 0;
  }

  function cont() {
    let ret = 0;
    try {
      dbSnapshot.personalBests[mode][mode2].forEach((pb) => {
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

  let retval;
  if (dbSnapshot == null) {
    retval = 0;
  } else {
    retval = cont();
  }
  return retval;
}

export async function saveLocalPB(
  mode,
  mode2,
  punctuation,
  language,
  difficulty,
  lazyMode,
  wpm,
  acc,
  raw,
  consistency
) {
  if (mode == "quote") return;
  function cont() {
    let found = false;
    if (dbSnapshot.personalBests === undefined) dbSnapshot.personalBests = {};
    if (dbSnapshot.personalBests[mode] === undefined)
      dbSnapshot.personalBests[mode] = {};
    if (dbSnapshot.personalBests[mode][mode2] === undefined)
      dbSnapshot.personalBests[mode][mode2] = [];

    dbSnapshot.personalBests[mode][mode2].forEach((pb) => {
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
      dbSnapshot.personalBests[mode][mode2].push({
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

export async function getLocalTagPB(
  tagId,
  mode,
  mode2,
  punctuation,
  language,
  difficulty,
  lazyMode
) {
  function cont() {
    let ret = 0;
    let filteredtag = dbSnapshot.tags.filter((t) => t._id === tagId)[0];
    try {
      filteredtag.personalBests[mode][mode2].forEach((pb) => {
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

  let retval;
  if (dbSnapshot == null) {
    retval = 0;
  } else {
    retval = cont();
  }
  return retval;
}

export async function saveLocalTagPB(
  tagId,
  mode,
  mode2,
  punctuation,
  language,
  difficulty,
  lazyMode,
  wpm,
  acc,
  raw,
  consistency
) {
  if (mode == "quote") return;
  function cont() {
    let filteredtag = dbSnapshot.tags.filter((t) => t._id === tagId)[0];
    try {
      let found = false;
      if (filteredtag.personalBests[mode][mode2] === undefined) {
        filteredtag.personalBests[mode][mode2] = [];
      }
      filteredtag.personalBests[mode][mode2].forEach((pb) => {
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
        filteredtag.personalBests[mode][mode2].push({
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
      filteredtag.personalBests = {};
      filteredtag.personalBests[mode] = {};
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
      ];
    }
  }

  if (dbSnapshot != null) {
    cont();
  }
}

export function updateLbMemory(mode, mode2, language, rank, api = false) {
  //could dbSnapshot just be used here instead of getSnapshot()
  if (dbSnapshot.lbMemory === undefined) dbSnapshot.lbMemory = {};
  if (dbSnapshot.lbMemory[mode] === undefined) dbSnapshot.lbMemory[mode] = {};
  if (dbSnapshot.lbMemory[mode][mode2] === undefined)
    dbSnapshot.lbMemory[mode][mode2] = {};
  let current = dbSnapshot.lbMemory[mode][mode2][language];
  dbSnapshot.lbMemory[mode][mode2][language] = rank;
  if (api && current != rank) {
    axiosInstance.post("/user/updateLbMemory", {
      mode,
      mode2,
      language,
      rank,
    });
  }
}

export async function saveConfig(config) {
  if (firebase.auth().currentUser !== null) {
    AccountButton.loading(true);
    try {
      await axiosInstance.post("/config/save", { config });
    } catch (e) {
      AccountButton.loading(false);

      let msg = e?.response?.data?.message ?? e.message;
      Notifications.add("Failed to save config: " + msg, -1);
      return;
    }
    AccountButton.loading(false);
  }
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

//   let retval;
//   if (dbSnapshot != null) {
//     retval = cont();
//   }
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
