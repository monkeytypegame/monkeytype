const mongoose = require("mongoose");
const Schema = mongoose.Schema;

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
  language: { type: String, default: "english" },
  restartCount: { type: Number, required: true },
  incompleteTestSeconds: { type: Number, required: true },
  testDuration: { type: Number, required: true },
  afkDuration: { type: Number, required: true },
  theme: { type: String, required: true },
  tags: [{ type: String }], //the id of each tag
  keySpacing: { type: String, default: "removed" }, //not sure what this or keyDuration is
  keyDuration: { type: String, default: "removed" },
  consistency: { type: Number, required: true },
  keyConsistency: { type: Number, required: true },
  chartData: {
    //should chartData have it's own schema?
    wpm: [{ type: Number }],
    raw: [{ type: Number }],
    err: [{ type: Number }],
  },
  customText: { type: Schema.Types.Mixed },
  keySpacingStats: { type: Schema.Types.Mixed }, //not sure that this needs to exist, it's set as null in all of mine
  name: { type: String, required: true }, //name of the user who took the test //should probably be typistName/username or something
  isPb: { type: Boolean, default: false },
});

module.exports = { resultSchema };
