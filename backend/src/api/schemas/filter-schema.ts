import joi from "joi";

const FILTER_SCHEMA = {
  _id: joi.string().required(),
  name: joi
    .string()
    .required()
    .regex(/^[0-9a-zA-Z_.-]+$/)
    .max(16)
    .messages({
      "string.pattern.base":
        "Filter name invalid. Name cannot contain special characters or more than 16 characters. Can include _ . and -",
      "string.max": "Filter name exceeds maximum of 16 characters",
    }),
  pb: joi.object({
    no: joi.bool().required(),
    yes: joi.bool().required(),
  }),
  difficulty: joi
    .object({
      normal: joi.bool().required(),
      expert: joi.bool().required(),
      master: joi.bool().required(),
    })
    .required(),
  mode: joi
    .object({
      words: joi.bool().required(),
      time: joi.bool().required(),
      quote: joi.bool().required(),
      zen: joi.bool().required(),
      custom: joi.bool().required(),
    })
    .required(),
  words: joi
    .object({
      10: joi.bool().required(),
      25: joi.bool().required(),
      50: joi.bool().required(),
      100: joi.bool().required(),
      custom: joi.bool().required(),
    })
    .required(),
  time: joi
    .object({
      15: joi.bool().required(),
      30: joi.bool().required(),
      60: joi.bool().required(),
      120: joi.bool().required(),
      custom: joi.bool().required(),
    })
    .required(),
  quoteLength: joi
    .object({
      short: joi.bool().required(),
      medium: joi.bool().required(),
      long: joi.bool().required(),
      thicc: joi.bool().required(),
    })
    .required(),
  punctuation: joi
    .object({
      on: joi.bool().required(),
      off: joi.bool().required(),
    })
    .required(),
  numbers: joi
    .object({
      on: joi.bool().required(),
      off: joi.bool().required(),
    })
    .required(),
  date: joi
    .object({
      last_day: joi.bool().required(),
      last_week: joi.bool().required(),
      last_month: joi.bool().required(),
      last_3months: joi.bool().required(),
      all: joi.bool().required(),
    })
    .required(),
  tags: joi.object().pattern(joi.string().token(), joi.bool()).required(),
  language: joi
    .object()
    .pattern(joi.string().pattern(/^[a-zA-Z0-9_+]+$/), joi.bool())
    .required(),
  funbox: joi.object().pattern(/\w+/, joi.bool()).required(),
};

export default FILTER_SCHEMA;
