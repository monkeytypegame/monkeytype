import { ResultFilters } from "@monkeytype/contracts/schemas/users";

const object: ResultFilters = {
  _id: "default",
  name: "defaults",
  pb: {
    no: true,
    yes: true,
  },
  difficulty: {
    normal: true,
    expert: true,
    master: true,
  },
  mode: {
    words: true,
    time: true,
    quote: true,
    zen: true,
    custom: true,
  },
  words: {
    "10": true,
    "25": true,
    "50": true,
    "100": true,
    custom: true,
  },
  time: {
    "15": true,
    "30": true,
    "60": true,
    "120": true,
    custom: true,
  },
  quoteLength: {
    short: true,
    medium: true,
    long: true,
    thicc: true,
  },
  punctuation: {
    on: true,
    off: true,
  },
  numbers: {
    on: true,
    off: true,
  },
  date: {
    last_day: false,
    last_week: false,
    last_month: false,
    last_3months: false,
    all: true,
  },
  tags: {
    none: true,
  },
  language: {},
  funbox: {
    none: true,
  },
};

export default JSON.parse(JSON.stringify(object)) as ResultFilters;
