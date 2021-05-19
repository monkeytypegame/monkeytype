const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    results: [{ type: Schema.Types.Mixed, default: {} }],
    personalBests: {
      custom: { type: Schema.Types.Mixed, default: {} },
      time: { type: Schema.Types.Mixed, default: {} },
      words: { type: Schema.Types.Mixed, default: {} },
      zen: { type: Schema.Types.Mixed, default: {} },
    },
    name: { type: String, required: true },
    presets: [{ type: Schema.Types.Mixed, default: {} }],
    tags: [{ type: Schema.Types.Mixed, default: {} }],
    favouriteThemes: [],
    refactored: { type: Boolean, default: true },
    banned: { type: Boolean, default: false },
    verified: { type: Boolean, default: false }, //what's the difference between verified and email verified
    emailVerified: { type: Boolean, default: false },
    lbMemory: {
      //short for leaderboard memory
      time15: {
        global: { type: Number, default: 0 }, //might not be an Number, I'm not sure
        daily: { type: Number, default: 0 },
      },
      time60: {
        global: { type: Number, default: 0 },
        daily: { type: Number, default: 0 },
      },
    },
    globalStats: {
      time: { type: Number, default: 0 },
      started: { type: Number, default: 0 }, //number of started tests
      completed: { type: Number, default: 0 },
    },
    email: { type: String, required: true },
    password: { type: String, required: true },
    refreshTokens: [{ type: String, required: true }],
  },
  {
    timestamps: true,
    minimize: false, //allows empty objects to be saved to mongodb
  }
);

const User = mongoose.model("User", userSchema);

module.exports = { User };
