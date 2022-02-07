import * as Misc from "../misc";
import * as DB from "../db";
import Config from "../config";
import * as Notifications from "../elements/notifications";
import * as Account from "../pages/account";

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
    zen: true,
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

export let filters = defaultResultFilters;

function save() {
  window.localStorage.setItem("resultFilters", JSON.stringify(filters));
}

function load() {
  // let newTags = $.cookie("activeTags");
  try {
    let newResultFilters = window.localStorage.getItem("resultFilters");
    if (
      newResultFilters != undefined &&
      newResultFilters !== "" &&
      Object.keys(JSON.parse(newResultFilters)).length >=
        Object.keys(defaultResultFilters).length
    ) {
      filters = JSON.parse(newResultFilters);
      save();
    } else {
      filters = defaultResultFilters;
      save();
    }
  } catch {
    console.log("error in loading result filters");
    filters = defaultResultFilters;
    save();
  }
}

Promise.all([Misc.getLanguageList(), Misc.getFunboxList()]).then((values) => {
  let languages = values[0];
  let funboxModes = values[1];
  languages.forEach((language) => {
    defaultResultFilters.language[language] = true;
  });
  funboxModes.forEach((funbox) => {
    defaultResultFilters.funbox[funbox.name] = true;
  });
  // filters = defaultResultFilters;
  load();
});

export function getFilters() {
  return filters;
}

export function getGroup(group) {
  return filters[group];
}

// export function setFilter(group, filter, value) {
//   filters[group][filter] = value;
// }

export function getFilter(group, filter) {
  return filters[group][filter];
}

// export function toggleFilter(group, filter) {
//   filters[group][filter] = !filters[group][filter];
// }

export function loadTags(tags) {
  tags.forEach((tag) => {
    defaultResultFilters.tags[tag._id] = true;
  });
}

export function reset() {
  filters = defaultResultFilters;
  save();
}

export function updateActive() {
  let aboveChartDisplay = {};
  Object.keys(getFilters()).forEach((group) => {
    aboveChartDisplay[group] = {
      all: true,
      array: [],
    };
    Object.keys(getGroup(group)).forEach((filter) => {
      if (getFilter(group, filter)) {
        aboveChartDisplay[group].array.push(filter);
      } else {
        aboveChartDisplay[group].all = false;
      }
      let buttonEl;
      if (group === "date") {
        buttonEl = $(
          `.pageAccount .group.topFilters .filterGroup[group="${group}"] .button[filter="${filter}"]`
        );
      } else {
        buttonEl = $(
          `.pageAccount .group.filterButtons .filterGroup[group="${group}"] .button[filter="${filter}"]`
        );
      }
      if (getFilter(group, filter)) {
        buttonEl.addClass("active");
      } else {
        buttonEl.removeClass("active");
      }
    });
  });

  function addText(group) {
    let ret = "";
    ret += "<div class='group'>";
    if (group == "difficulty") {
      ret += `<span aria-label="Difficulty" data-balloon-pos="up"><i class="fas fa-fw fa-star"></i>`;
    } else if (group == "mode") {
      ret += `<span aria-label="Mode" data-balloon-pos="up"><i class="fas fa-fw fa-bars"></i>`;
    } else if (group == "punctuation") {
      ret += `<span aria-label="Punctuation" data-balloon-pos="up"><span class="punc" style="font-weight: 900;
      width: 1.25rem;
      text-align: center;
      display: inline-block;
      letter-spacing: -.1rem;">!?</span>`;
    } else if (group == "numbers") {
      ret += `<span aria-label="Numbers" data-balloon-pos="up"><span class="numbers" style="font-weight: 900;
        width: 1.25rem;
        text-align: center;
        margin-right: .1rem;
        display: inline-block;
        letter-spacing: -.1rem;">15</span>`;
    } else if (group == "words") {
      ret += `<span aria-label="Words" data-balloon-pos="up"><i class="fas fa-fw fa-font"></i>`;
    } else if (group == "time") {
      ret += `<span aria-label="Time" data-balloon-pos="up"><i class="fas fa-fw fa-clock"></i>`;
    } else if (group == "date") {
      ret += `<span aria-label="Date" data-balloon-pos="up"><i class="fas fa-fw fa-calendar"></i>`;
    } else if (group == "tags") {
      ret += `<span aria-label="Tags" data-balloon-pos="up"><i class="fas fa-fw fa-tags"></i>`;
    } else if (group == "language") {
      ret += `<span aria-label="Language" data-balloon-pos="up"><i class="fas fa-fw fa-globe-americas"></i>`;
    } else if (group == "funbox") {
      ret += `<span aria-label="Funbox" data-balloon-pos="up"><i class="fas fa-fw fa-gamepad"></i>`;
    }
    if (aboveChartDisplay[group].all) {
      ret += "all";
    } else {
      if (group === "tags") {
        ret += aboveChartDisplay.tags.array
          .map((id) => {
            if (id == "none") return id;
            let name = DB.getSnapshot().tags.filter((t) => t._id == id)[0];
            if (name !== undefined) {
              return DB.getSnapshot().tags.filter((t) => t._id == id)[0].name;
            }
          })
          .join(", ");
      } else {
        ret += aboveChartDisplay[group].array.join(", ").replace(/_/g, " ");
      }
    }
    ret += "</span></div>";
    return ret;
  }

  let chartString = "";

  //date
  chartString += addText("date");
  chartString += `<div class="spacer"></div>`;

  //mode
  chartString += addText("mode");
  chartString += `<div class="spacer"></div>`;

  //time
  if (aboveChartDisplay.mode.array.includes("time")) {
    chartString += addText("time");
    chartString += `<div class="spacer"></div>`;
  }

  //words
  if (aboveChartDisplay.mode.array.includes("words")) {
    chartString += addText("words");
    chartString += `<div class="spacer"></div>`;
  }

  //diff
  chartString += addText("difficulty");
  chartString += `<div class="spacer"></div>`;

  //punc
  chartString += addText("punctuation");
  chartString += `<div class="spacer"></div>`;

  //numbers
  chartString += addText("numbers");
  chartString += `<div class="spacer"></div>`;

  //language
  chartString += addText("language");
  chartString += `<div class="spacer"></div>`;

  //funbox
  chartString += addText("funbox");
  chartString += `<div class="spacer"></div>`;

  //tags
  chartString += addText("tags");

  $(".pageAccount .group.chart .above").html(chartString);

  Account.update();
}

export function toggle(group, filter) {
  try {
    if (group === "date") {
      Object.keys(getGroup("date")).forEach((date) => {
        filters["date"][date] = false;
      });
    }
    filters[group][filter] = !filters[group][filter];
    save();
  } catch (e) {
    Notifications.add(
      "Something went wrong toggling filter. Reverting to defaults.",
      0
    );
    console.log("toggling filter error");
    console.error(e);
    reset();
    updateActive();
  }
}

export function updateTags() {
  $(
    ".pageAccount .content .filterButtons .buttonsAndTitle.tags .buttons"
  ).empty();
  if (DB.getSnapshot().tags.length > 0) {
    $(".pageAccount .content .filterButtons .buttonsAndTitle.tags").removeClass(
      "hidden"
    );
    $(
      ".pageAccount .content .filterButtons .buttonsAndTitle.tags .buttons"
    ).append(`<div class="button" filter="none">no tag</div>`);
    DB.getSnapshot().tags.forEach((tag) => {
      $(
        ".pageAccount .content .filterButtons .buttonsAndTitle.tags .buttons"
      ).append(`<div class="button" filter="${tag._id}">${tag.name}</div>`);
    });
  } else {
    $(".pageAccount .content .filterButtons .buttonsAndTitle.tags").addClass(
      "hidden"
    );
  }
}

$(
  ".pageAccount .filterButtons .buttonsAndTitle .buttons, .pageAccount .group.topFilters .buttonsAndTitle.testDate .buttons"
).click(".button", (e) => {
  const filter = $(e.target).attr("filter");
  const group = $(e.target).parents(".buttons").attr("group");
  if ($(e.target).hasClass("allFilters")) {
    Object.keys(getFilters()).forEach((group) => {
      Object.keys(getGroup(group)).forEach((filter) => {
        if (group === "date") {
          filters[group][filter] = false;
        } else {
          filters[group][filter] = true;
        }
      });
    });
    filters["date"]["all"] = true;
  } else if ($(e.target).hasClass("noFilters")) {
    Object.keys(getFilters()).forEach((group) => {
      if (group !== "date") {
        Object.keys(getGroup(group)).forEach((filter) => {
          filters[group][filter] = false;
        });
      }
    });
  } else if ($(e.target).hasClass("button")) {
    if (e.shiftKey) {
      Object.keys(getGroup(group)).forEach((filter) => {
        filters[group][filter] = false;
      });
      filters[group][filter] = true;
    } else {
      toggle(group, filter);
      // filters[group][filter] = !filters[group][filter];
    }
  }
  updateActive();
  save();
});

$(".pageAccount .topFilters .button.allFilters").click((e) => {
  Object.keys(getFilters()).forEach((group) => {
    Object.keys(getGroup(group)).forEach((filter) => {
      if (group === "date") {
        filters[group][filter] = false;
      } else {
        filters[group][filter] = true;
      }
    });
  });
  filters["date"]["all"] = true;
  updateActive();
  save();
});

$(".pageAccount .topFilters .button.currentConfigFilter").click((e) => {
  Object.keys(getFilters()).forEach((group) => {
    Object.keys(getGroup(group)).forEach((filter) => {
      filters[group][filter] = false;
    });
  });

  filters["difficulty"][Config.difficulty] = true;
  filters["mode"][Config.mode] = true;
  if (Config.mode === "time") {
    filters["time"][Config.time] = true;
  } else if (Config.mode === "words") {
    filters["words"][Config.words] = true;
  } else if (Config.mode === "quote") {
    Object.keys(getGroup("quoteLength")).forEach((ql) => {
      filters["quoteLength"][ql] = true;
    });
  }
  if (Config.punctuation) {
    filters["punctuation"]["on"] = true;
  } else {
    filters["punctuation"]["off"] = true;
  }
  if (Config.numbers) {
    filters["numbers"]["on"] = true;
  } else {
    filters["numbers"]["off"] = true;
  }
  if (Config.mode === "quote" && /english.*/.test(Config.language)) {
    filters["language"]["english"] = true;
  } else {
    filters["language"][Config.language] = true;
  }

  if (Config.funbox === "none") {
    filters.funbox.none = true;
  } else {
    filters.funbox[Config.funbox] = true;
  }

  filters["tags"]["none"] = true;
  DB.getSnapshot().tags.forEach((tag) => {
    if (tag.active === true) {
      filters["tags"]["none"] = false;
      filters["tags"][tag._id] = true;
    }
  });

  filters["date"]["all"] = true;
  updateActive();
  save();
  console.log(getFilters());
});

$(".pageAccount .topFilters .button.toggleAdvancedFilters").click((e) => {
  $(".pageAccount .filterButtons").slideToggle(250);
  $(".pageAccount .topFilters .button.toggleAdvancedFilters").toggleClass(
    "active"
  );
});

Misc.getLanguageList().then((languages) => {
  languages.forEach((language) => {
    $(
      ".pageAccount .content .filterButtons .buttonsAndTitle.languages .buttons"
    ).append(
      `<div class="button" filter="${language}">${language.replace(
        "_",
        " "
      )}</div>`
    );
  });
});

$(
  ".pageAccount .content .filterButtons .buttonsAndTitle.funbox .buttons"
).append(`<div class="button" filter="none">none</div>`);
Misc.getFunboxList().then((funboxModes) => {
  funboxModes.forEach((funbox) => {
    $(
      ".pageAccount .content .filterButtons .buttonsAndTitle.funbox .buttons"
    ).append(
      `<div class="button" filter="${funbox.name}">${funbox.name.replace(
        /_/g,
        " "
      )}</div>`
    );
  });
});
