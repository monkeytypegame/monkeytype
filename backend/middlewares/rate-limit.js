const rateLimit = require("express-rate-limit");

exports.limit60perhour = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60,
  message: {
    message: "Too many requests, please try again later",
  },
});

exports.limit3perday = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 day
  max: 3,
  message: {
    message: "Too many requests, please try again later",
  },
});

exports.limit1persec = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: {
    message: "Too many requests, please try again later",
  },
});

exports.limit500perhour = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 500,
  message: {
    message: "Too many requests, please try again later",
  },
});
