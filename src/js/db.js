import { loadTags } from "./result-filters";
import * as AccountButton from "./account-button";
import * as CloudFunctions from "./cloud-functions";
import * as Notifications from "./notifications";

const db = firebase.firestore();
db.settings({ experimentalForceLongPolling: true });

let dbSnapshot = null;

export function updateName(uid, name) {
  db.collection(`users`).doc(uid).set({ name: name }, { merge: true });
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
  let user = firebase.auth().currentUser;
  if (user == null) return false;
  let snap = {
    results: undefined,
    personalBests: {},
    name: undefined,
    tags: [],
    favouriteThemes: [],
    refactored: false,
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
  try {
    await db
      .collection(`users/${user.uid}/tags/`)
      .get()
      .then((data) => {
        data.docs.forEach((doc) => {
          let tag = doc.data();
          tag.id = doc.id;
          if (tag.personalBests === undefined) {
            tag.personalBests = {};
          }
          snap.tags.push(tag);
        });
        snap.tags = snap.tags.sort((a, b) => {
          if (a.name > b.name) {
            return 1;
          } else if (a.name < b.name) {
            return -1;
          } else {
            return 0;
          }
        });
      })
      .catch((e) => {
        throw e;
      });
    await db
      .collection("users")
      .doc(user.uid)
      .get()
      .then((res) => {
        let data = res.data();
        if (data === undefined) return;
        if (data.personalBests !== undefined) {
          snap.personalBests = data.personalBests;
        }
        snap.name = data.name;
        snap.discordId = data.discordId;
        snap.pairingCode =
          data.discordPairingCode == null ? undefined : data.discordPairingCode;
        snap.config = data.config;
        snap.favouriteThemes =
          data.favouriteThemes === undefined ? [] : data.favouriteThemes;
        snap.refactored = data.refactored === true ? true : false;
        snap.globalStats = {
          time: data.timeTyping,
          started: data.startedTests,
          completed: data.completedTests,
        };
        snap.banned = data.banned;
        snap.verified = data.verified;
        snap.emailVerified = user.emailVerified;
        try {
          if (data.lbMemory.time15 !== undefined) {
            snap.lbMemory.time15 = data.lbMemory.time15;
          }
          if (data.lbMemory.time60 !== undefined) {
            snap.lbMemory.time60 = data.lbMemory.time60;
          }
        } catch {}
      })
      .catch((e) => {
        throw e;
      });
    dbSnapshot = snap;
  } catch (e) {
    console.error(e);
  }
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
      return await db
        .collection(`users/${user.uid}/results/`)
        .orderBy("timestamp", "desc")
        .limit(1000)
        .get()
        .then((data) => {
          dbSnapshot.results = [];
          data.docs.forEach((doc) => {
            let result = doc.data();
            result.id = doc.id;

            if (result.bailedOut === undefined) result.bailedOut = false;
            if (result.blindMode === undefined) result.blindMode = false;
            if (result.difficulty === undefined) result.difficulty = "normal";
            if (result.funbox === undefined) result.funbox = "none";
            if (result.language === undefined) result.language = "english";
            if (result.numbers === undefined) result.numbers = false;
            if (result.punctuation === undefined) result.punctuation = false;

            dbSnapshot.results.push(result);
          });
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
    let filteredtag = dbSnapshot.tags.filter((t) => t.id === tagId)[0];
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
    let filteredtag = dbSnapshot.tags.filter((t) => t.id === tagId)[0];
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
  getSnapshot().lbMemory[mode + mode2][type] = value;
}

export async function saveConfig(config) {
  if (firebase.auth().currentUser !== null) {
    AccountButton.loading(true);
    CloudFunctions.saveConfig({
      uid: firebase.auth().currentUser.uid,
      obj: config,
    }).then((d) => {
      AccountButton.loading(false);
      if (d.data.returnCode !== 1) {
        Notifications.add(`Error saving config to DB! ${d.data.message}`, 4000);
      }
      return;
    });
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
//       if (tag.id === tagId) {
//         tag.pb = wpm;
//       }
//     });
//   }

//   if (dbSnapshot != null) {
//     cont();
//   }
// }
