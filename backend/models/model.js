/*
//This is the mongo model for a user
{
  "uid": 'uid',
  "presets": [
    //unknown whats inside here
    //can be added once one is added, and not created as blank
  ],
  "name",
  "discordId",
  "pairingCode",
  "discordPairingCode",
  "config",
  "favouriteThemes",
  "refactored",
  "globalStats": {
    "timeTests",
    "startedTests",
    "completedTests"
  },
  "banned",
  "verified",
  "emailVerified",
  "lbMemory": {
    "time15",
    "time60"
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
}

//The user object returned by firebase.auth().currentUser
  // should this be retrieved from the server everytime or is it stored in the browser
    // probably browser
{
  "uid",
  "name",
  "emailVerified",
  "displayName",
  "refreshToken",
  //guessing there is an access token in there somewhere, but I really don't know how this works
}
*/
