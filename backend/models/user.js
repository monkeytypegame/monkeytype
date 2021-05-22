const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tagSchema = new Schema({
  name: { type: String, required: true },
  //should be pb storage here i think
});

const resultSchema = new Schema({
  wpm: { type: Number, required: true },
  rawWpm: { type: Number, required: true },
  correctChars: { type: Number, required: true },
  incorrectChars: { type: Number, required: true },
  allChars: { type: Number, required: true },
  acc: { type: Number, required: true },
  mode: { type: String, required: true }, //is this always string type?
  mode2: { type: Number, required: true }, //is this always number type?
  quoteLength: { type: Number, required: true },
  timestamp: { type: Number, required: true }, //can this be removed if timestamps are added to mongoose
  language: { type: String, required: true },
  restartCount: { type: Number, required: true },
  incompleteTestSeconds: { type: Number, required: true },
  testDuration: { type: Number, required: true },
  afkDuration: { type: Number, required: true },
  theme: { type: String, required: true },
  tags: [{ type: String }], //the id of each tag
  keySpacing: { type: String, required: true },
  keyDuration: { type: String, required: true },
  consistency: { type: Number, required: true },
  keyConsistency: { type: Number, required: true },
  chartData: {
    //should chartData have it's own schema?
    wpm: [{ type: Number }],
    raw: [{ type: Number }],
    err: [{ type: Number }],
  },
  customText: { type: Schema.Types.Mixed },
  keySpacingStats: String, //not sure that this needs to exist, it's set as null in all of mine
  name: { type: String, required: true }, //name of the user who took the test //should probably be typistName/username or something
  isPb: { type: Boolean, required: true },
});

const configSchema = new Schema({});

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
    presets: [{ type: Schema.Types.Mixed, default: {} }],
    tags: [{ type: tagSchema, default: {} }],
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
