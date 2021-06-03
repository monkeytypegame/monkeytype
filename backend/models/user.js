const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const { configSchema } = require("./subschemas/config");
const { resultSchema } = require("./subschemas/result");
const { tagSchema } = require("./subschemas/tag");
const { presetSchema } = require("./subschemas/preset");

const userSchema = new Schema(
  {
    results: [{ type: resultSchema, default: {} }],
    personalBests: {
      custom: { type: Schema.Types.Mixed, default: {} },
      time: { type: Schema.Types.Mixed, default: {} },
      words: { type: Schema.Types.Mixed, default: {} },
      zen: { type: Schema.Types.Mixed, default: {} },
    },
    name: { type: String, required: true },
    uid: { type: String, required: true },
    discordId: { type: String },
    presets: [{ type: presetSchema, default: {} }],
    tags: [{ type: tagSchema, default: {} }],
    favouriteThemes: [],
    refactored: { type: Boolean, default: true },
    banned: { type: Boolean, default: false },
    verified: { type: Boolean, default: false }, //Verified is actually whether or not discord account is connected
    emailVerified: { type: Boolean, default: false },
    lbMemory: {
      time15: {
        global: { type: Number, default: -1 },
        daily: { type: Number, default: -1 },
      },
      time60: {
        global: { type: Number, default: -1 },
        daily: { type: Number, default: -1 },
      },
    },
    globalStats: {
      time: { type: Number, default: 0 },
      started: { type: Number, default: 0 }, //number of started tests
      completed: { type: Number, default: 0 },
    },
    email: { type: String },
    config: { type: configSchema, default: {} },
    bananas: {
      t60bananas: { type: Number, default: 0 },
    },
    dailyLbWins: {
      time15: { type: Number },
      time60: { type: Number },
    },
  },
  {
    timestamps: true,
    minimize: false, //allows empty objects to be saved to mongodb
  }
);

const User = mongoose.model("User", userSchema);

module.exports = { User };
