const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const leaderboardEntrySchema = new Schema({
  name: String,
  wpm: Number,
  raw: Number,
  acc: Number,
  consistency: Number, //can be null
  mode: String, //not sure why mode and mode2 are needed
  mode2: Number,
  timestamp: Date, //Is this the right type?
  hidden: Boolean,
});

const leaderboardSchema = new Schema(
  {
    resetTime: Date, //or Number, only on daily lb
    size: Number,
    board: [{ type: leaderboardEntrySchema }], //contents of leaderbaord
    mode: String, //only time for now
    mode2: Number, //only 15 and 60 for now
    type: String, //global or local
  },
  {
    timestamps: true,
  }
);

const Leaderboard = mongoose.model("Leaderboard", leaderboardSchema);

module.exports = { Leaderboard };
