const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const botCommandSchema = new Schema(
  {
    command: { type: String, required: true },
    arguments: [{ type: Schema.Types.Mixed }],
    executedTimestamp: { type: Date },
    requestTimestamp: { type: Date },
    executed: { type: Boolean, default: false },
    status: { type: String },
  },
  {
    timestamps: true,
  }
);

const BotCommand = mongoose.model("BotCommand", botCommandSchema);

module.exports = { BotCommand };
