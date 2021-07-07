import { loadTags } from "./result-filters";
import * as AccountButton from "./account-button";
import * as Notifications from "./notifications";
import axiosInstance from "./axios-instance";
import * as TodayTracker from "./today-tracker";

let dbSnapshot = null;

export function updateName(uid, name) {
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
  if (firebase.auth().currentUser == null) return false;
  let snap = {
    results: undefined,
    personalBests: {},
    name: undefined,
    presets: [],
    tags: [],
    favouriteThemes: [],
    banned: undefined,
    verified: undefined,
    emailVerified: undefined,
    lbMemory: {
      time15: {
        global: null,
        daily: null,
      },
      time60: {
        global: null,
        daily: null,
      },
    },
    globalStats: {
      time: 0,
      started: 0,
      completed: 0,
    },
  };
  let userData = await axiosInstance.get("/user");
  userData = userData.data;
  snap.name = userData.name;
  snap.personalBests = userData.personalBests;
  snap.banned = userData.banned;
  snap.verified = userData.verified;
  snap.globalStats = {
    time: userData.timeTyping,
    started: userData.startedTests,
    completed: userData.completedTests,
  };
  snap.favouriteThemes =
    userData.favouriteThemes === undefined ? [] : userData.favouriteThemes;
  try {
    if (userData.lbMemory.time15 !== undefined) {
      snap.lbMemory.time15 = userData.lbMemory.time15;
    }
    if (userData.lbMemory.time60 !== undefined) {
      snap.lbMemory.time60 = userData.lbMemory.time60;
    }
  } catch {}

  let configData = await axiosInstance.get("/config");
  configData = configData.data;
  snap.config = configData.config;

  dbSnapshot = snap;
  loadTags(dbSnapshot.tags);
  return dbSnapshot;
}

export async function getUserResults() {
  let user = firebase.auth().currentUser;
  if (user == null) return false;
  if (dbSnapshot === null) return false;
  if (dbSnapshot.results !== undefined) {
    return true;
  } else {
    try {
      let results = await axiosInstance.get("/result");
      dbSnapshot.results = results.data;
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
  difficulty
) {
  function cont() {
    let topWpm = 0;
    dbSnapshot.results.forEach((result) => {
      if (
        result.mode == mode &&
        result.mode2 == mode2 &&
        result.punctuation == punctuation &&
        result.language == language &&
        result.difficulty == difficulty
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
  difficulty
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
        result.difficulty == difficulty
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
  difficulty
) {
  function cont() {
    let ret = 0;
    try {
      dbSnapshot.personalBests[mode][mode2].forEach((pb) => {
        if (
          pb.punctuation == punctuation &&
          pb.difficulty == difficulty &&
          pb.language == language
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
  wpm,
  acc,
  raw,
  consistency
) {
  if (mode == "quote") return;
  function cont() {
    try {
      let found = false;
      if (dbSnapshot.personalBests[mode][mode2] === undefined) {
        dbSnapshot.personalBests[mode][mode2] = [];
      }
      dbSnapshot.personalBests[mode][mode2].forEach((pb) => {
        if (
          pb.punctuation == punctuation &&
          pb.difficulty == difficulty &&
          pb.language == language
        ) {
          found = true;
          pb.wpm = wpm;
          pb.acc = acc;
          pb.raw = raw;
          pb.timestamp = Date.now();
          pb.consistency = consistency;
        }
      });
      if (!found) {
        //nothing found
        dbSnapshot.personalBests[mode][mode2].push({
          language: language,
          difficulty: difficulty,
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
      dbSnapshot.personalBests[mode] = {};
      dbSnapshot.personalBests[mode][mode2] = [
        {
          language: language,
          difficulty: difficulty,
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

export async function getLocalTagPB(
  tagId,
  mode,
  mode2,
  punctuation,
  language,
  difficulty
) {
  function cont() {
    let ret = 0;
    let filteredtag = dbSnapshot.tags.filter((t) => t._id === tagId)[0];
    try {
      filteredtag.personalBests[mode][mode2].forEach((pb) => {
        if (
          pb.punctuation == punctuation &&
          pb.difficulty == difficulty &&
          pb.language == language
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
          pb.language == language
        ) {
          found = true;
          pb.wpm = wpm;
          pb.acc = acc;
          pb.raw = raw;
          pb.timestamp = Date.now();
          pb.consistency = consistency;
        }
      });
      if (!found) {
        //nothing found
        filteredtag.personalBests[mode][mode2].push({
          language: language,
          difficulty: difficulty,
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
      filteredtag.personalBests[mode] = {};
      filteredtag.personalBests[mode][mode2] = [
        {
          language: language,
          difficulty: difficulty,
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

export function updateLbMemory(mode, mode2, type, value) {
  //could dbSnapshot just be used here instead of getSnapshot()
  getSnapshot().lbMemory[mode + mode2][type] = value;
}

export async function saveConfig(config) {
  if (firebase.auth().currentUser !== null) {
    AccountButton.loading(true);
    try {
      let response = await axiosInstance.post("/config/save", { config });
    } catch (e) {
      Notifications.add(e.message, -1);
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
