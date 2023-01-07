import joi from "joi";

const RESULT_SCHEMA = joi
  .object({
    acc: joi.number().min(75).max(100).required(),
    afkDuration: joi.number().min(0).required(),
    bailedOut: joi.boolean().required(),
    blindMode: joi.boolean().required(),
    challenge: joi.string(),
    charStats: joi.array().items(joi.number()).required(),
    chartData: joi
      .alternatives()
      .try(
        joi.object({
          wpm: joi.array().items(joi.number()).required(),
          raw: joi.array().items(joi.number()).required(),
          err: joi.array().items(joi.number()).required(),
        }),
        joi.string().valid("toolong")
      )
      .required(),
    consistency: joi.number().max(100).required(),
    customText: joi.object({
      textLen: joi.number().required(),
      isWordRandom: joi.boolean().required(),
      isTimeRandom: joi.boolean().required(),
      word: joi.number().allow(null),
      time: joi.number().allow(null),
    }),
    difficulty: joi.string().valid("normal", "expert", "master").required(),
    funbox: joi.string().required(),
    hash: joi.string().required(),
    incompleteTestSeconds: joi.number().required(),
    incompleteTests: joi.array().items(
      joi.object({
        acc: joi.number().min(0).max(100).required(),
        seconds: joi.number().min(0).required(),
      })
    ),
    // .required(), //add required after a few days
    keyConsistency: joi.number().required(),
    keyDuration: joi
      .alternatives()
      .try(joi.array().items(joi.number()), joi.string().valid("toolong")),
    keySpacing: joi
      .alternatives()
      .try(joi.array().items(joi.number()), joi.string().valid("toolong")),
    lang: joi.string(),
    stringified: joi.string(),
    language: joi.string().required(),
    lazyMode: joi.boolean().required(),
    mode: joi
      .string()
      .valid("time", "words", "quote", "zen", "custom")
      .required(),
    mode2: joi.alternatives().try(joi.number(), joi.string()).required(),
    numbers: joi.boolean().required(),
    punctuation: joi.boolean().required(),
    quoteLength: joi.number(),
    rawWpm: joi.number().required(),
    restartCount: joi.number().required(),
    smoothConsistency: joi.number().optional(), // to be removed
    tags: joi.array().items(joi.string()).required(),
    testDuration: joi.number().required().min(1),
    timestamp: joi.date().timestamp().required(),
    uid: joi.string().required(),
    wpm: joi.number().min(0).max(350).required(),
    wpmConsistency: joi.number().required(),
  })
  .required();

export default RESULT_SCHEMA;
