const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const statsSchema = new Schema(
  {
    completedTests: { type: Number, default: 0 },
    startedTests: { type: Number, default: 0 },
    timeTyping: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const Stats = mongoose.model("Stats", statsSchema);

module.exports = { Stats };
