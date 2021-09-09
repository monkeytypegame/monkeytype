const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { configSchema } = require("./config");

const presetSchema = new Schema({
  name: { type: String, required: true },
  config: { type: configSchema }, //not sure if preset config always follows config schema
});

module.exports = { presetSchema };
