const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const leaderboardEntrySchema = new Schema({
  name: { type: String },
  wpm: { type: Number },
  raw: { type: Number },
  acc: { type: Number },
  consistency: { type: {} }, //can be null
  mode: { type: String }, //not sure why mode and mode2 are needed
  mode2: { type: Number },
  timestamp: { type: Date },
  hidden: { type: Boolean },
});

const leaderboardSchema = new Schema(
  {
    resetTime: { type: Date }, //or Number, only on daily lb
    size: { type: Number, required: true },
    board: [{ type: leaderboardEntrySchema }], //contents of leaderbaord
    mode: { type: String, required: true }, //only equal to 'time' for now
    mode2: { type: Number, required: true }, //only equal to 15 and 60 for now
    type: { type: String, required: true }, //global or local
  },
  {
    timestamps: true,
  }
);

const Leaderboard = mongoose.model("Leaderboard", leaderboardSchema);

module.exports = { Leaderboard };
