const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const analyticsSchema = new Schema(
  {
    event: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

const Analytics = mongoose.model("Analytics", analyticsSchema);

module.exports = { Analytics };
