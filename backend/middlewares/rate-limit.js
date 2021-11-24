const rateLimit = require("express-rate-limit");

let multiplier = process.env.MODE === "dev" ? 100 : 1;

exports.limit60perhour = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * multiplier,
  message: {
    message: "Too many requests, please try again later",
  },
  keyGenerator: (req) => {
    return `${
      req.headers["cf-connecting-ip"] ||
      req.headers["x-forwarded-for"] ||
      req.ip ||
      "255.255.255.255"
    }`;
  },
});

exports.limit120perhour = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 120 * multiplier,
  message: {
    message: "Too many requests, please try again later",
  },
  keyGenerator: (req) => {
    return `${
      req.headers["cf-connecting-ip"] ||
      req.headers["x-forwarded-for"] ||
      req.ip ||
      "255.255.255.255"
    }`;
  },
});

exports.limit3perday = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 day
  max: 3 * multiplier,
  message: {
    message: "Too many requests, please try again later",
  },
  keyGenerator: (req) => {
    return `${
      req.headers["cf-connecting-ip"] ||
      req.headers["x-forwarded-for"] ||
      req.ip ||
      "255.255.255.255"
    }`;
  },
});

exports.limit1persec = rateLimit({
  windowMs: 60 * 1000,
  max: 60 * multiplier,
  message: {
    message: "Too many requests, please try again later",
  },
  keyGenerator: (req) => {
    return `${
      req.headers["cf-connecting-ip"] ||
      req.headers["x-forwarded-for"] ||
      req.ip ||
      "255.255.255.255"
    }`;
  },
});

exports.limit500perhour = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 500 * multiplier,
  message: {
    message: "Too many requests, please try again later",
  },
  keyGenerator: (req) => {
    return `${
      req.headers["cf-connecting-ip"] ||
      req.headers["x-forwarded-for"] ||
      req.ip ||
      "255.255.255.255"
    }`;
  },
});
