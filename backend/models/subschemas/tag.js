const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tagSchema = new Schema({
  name: { type: String, required: true },
  personalBests: { type: Schema.Types.Mixed },
});

module.exports = { tagSchema };
