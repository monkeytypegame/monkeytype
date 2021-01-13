import * as Misc from "./misc";

let filters = defaultResultFilters;

let defaultResultFilters = {
  difficulty: {
    normal: true,
    expert: true,
    master: true,
  },
  mode: {
    words: true,
    time: true,
    quote: true,
    custom: true,
  },
  words: {
    10: true,
    25: true,
    50: true,
    100: true,
    200: true,
    custom: true,
  },
  time: {
    15: true,
    30: true,
    60: true,
    120: true,
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

load();

Misc.getLanguageList().then((languages) => {
  languages.forEach((language) => {
    defaultResultFilters.language[language] = true;
  });
});

Misc.getFunboxList().then((funboxModes) => {
  funboxModes.forEach((funbox) => {
    defaultResultFilters.funbox[funbox.name] = true;
  });
});

export function getFilters() {
  return filters;
}

export function getGroup(group) {
  return filters[group];
}

export function setFilter(group, filter, value) {
  filters[group][filter] = value;
}

export function getFilter(group, filter) {
  return filters[group][filter];
}

export function toggleFilter(group, filter) {
  filters[group][filter] = !filters[group][filter];
}

export function loadTags(tags) {
  tags.forEach((tag) => {
    defaultResultFilters.tags[tag.id] = true;
  });
}

export function save() {
  Misc.setCookie("resultFilters", JSON.stringify(filters), 365);
}

export function load() {
  // let newTags = $.cookie("activeTags");
  try {
    let newResultFilters = Misc.getCookie("resultFilters");
    if (newResultFilters !== undefined && newResultFilters !== "") {
      filters = JSON.parse(newResultFilters);
      save();
    } else {
      filters = defaultResultFilters;
      save();
    }
  } catch {
    filters = defaultResultFilters;
    save();
  }
}

export function reset() {
  filters = defaultResultFilters;
  save();
}
