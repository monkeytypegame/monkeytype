import { loadTags } from "./result-filters";
import * as AccountButton from "./account-button";
import * as CloudFunctions from "./cloud-functions";
import * as Notifications from "./notifications";
import axios from "axios";
import Cookies from "js-cookie";

//const db = firebase.firestore();
//db.settings({ experimentalForceLongPolling: true });

let dbSnapshot = null;

//I think that a lot of these functions could be simplified by api calls

export function updateName(uid, name) {
  //db.collection(`users`).doc(uid).set({ name: name }, { merge: true });
  axios.post("/api/updateName", {
    uid: uid,
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

export function currentUser() {
  const token = Cookies.get("accessToken");
  if (token) {
    const user = {
      uid: Cookies.get("uid"),
      displayName: Cookies.get("displayName"),
      email: Cookies.get("email"),
    };
    return user;
  } else {
    return null;
  }
}

export async function initSnapshot() {
  //send api request with token that returns tags, presets, and data needed for snap
  if (currentUser() == null) return false;
  const token = Cookies.get("accessToken");
  await axios
    .get("/api/fetchSnapshot", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((response) => {
      dbSnapshot = response.data.snap;
      loadTags(dbSnapshot.tags);
      return dbSnapshot;
    })
    .catch((e) => {
      console.error(e);
    });
}

export async function getUserResults() {
  let user = currentUser();
  if (user == null) return false;
  if (dbSnapshot === null) return false;
  if (dbSnapshot.results !== undefined) {
    return true;
  } else {
    axios
      .get("/api/userResults", {
        uid: user.uid,
      })
      .then((response) => {
        dbSnapshot.results = response.data.results;
      })
      .catch((error) => {
        console.log(error);
      });
  }
  /*
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
  //could dbSnapshot just be used here instead of getSnapshot()
  getSnapshot().lbMemory[mode + mode2][type] = value;
}

export async function saveConfig(config) {
  if (currentUser() !== null) {
    AccountButton.loading(true);
    axios
      .post("/api/saveConfig", {
        uid: currentUser().uid,
      })
      .then((response) => {
        AccountButton.loading(false);
        if (response.data.resultCode !== 1) {
          Notifications.add(
            `Error saving config to DB! ${response.data.message}`,
            4000
          );
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
