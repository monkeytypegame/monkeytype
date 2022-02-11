import * as Misc from "../misc";
import * as DB from "../db";
import Config from "../config";
import * as Notifications from "../elements/notifications";
import {
  Difficulty,
  Filter,
  Group,
  QuoteModes,
  ResultFilters,
  Tag,
  TimeModes,
  WordsModes,
  Mode,
} from "../../../../Typings/interfaces";
import { Language } from "../../../../Typings/language";
import { FunboxJSON } from "../../../../Typings/funbox";

export const defaultResultFilters = {
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
} as ResultFilters;

export let filters = defaultResultFilters;

function save() {
  window.localStorage.setItem("resultFilters", JSON.stringify(filters));
}

export function load() {
  // let newTags = $.cookie("activeTags");
  console.log("loading filters");
  try {
    const newResultFilters = window.localStorage.getItem("resultFilters");
    if (
      newResultFilters !== undefined &&
      newResultFilters !== null &&
      newResultFilters !== "" &&
      Object.keys(JSON.parse(newResultFilters)).length >=
        Object.keys(defaultResultFilters).length
    ) {
      filters = JSON.parse(newResultFilters);
      // save();
    } else {
      filters = defaultResultFilters;
      // save();
    }

    const newTags = {} as { [key: string]: boolean };

    Object.keys(defaultResultFilters.tags).forEach((tag) => {
      if (filters.tags[tag] !== undefined) {
        newTags[tag] = filters.tags[tag] as boolean;
      } else {
        newTags[tag] = true;
      }
    });

    filters.tags = newTags;

    save();
  } catch {
    console.log("error in loading result filters");
    filters = defaultResultFilters;
    save();
  }
}

export function getFilters(): ResultFilters {
  return filters;
}

export function getGroup(group: Group) {
  return filters[group];
}

// export function setFilter(group, filter, value) {
//   filters[group][filter] = value;
// }

export function getFilter<G extends Group>(group: G, filter: Filter<G>) {
  return filters[group][filter];
}

// export function toggleFilter(group, filter) {
//   filters[group][filter] = !filters[group][filter];
// }

export function loadTags(tags: Tag[]) {
  console.log("loading tags");
  tags.forEach((tag) => {
    defaultResultFilters.tags[tag._id] = true;
  });
}

export function reset() {
  filters = defaultResultFilters;
  save();
}

export function updateActive() {
  const aboveChartDisplay = {} as ResultFilters;
  (Object.keys(getFilters()) as Group[]).forEach((group) => {
    aboveChartDisplay[group] = {
      all: true,
      array: [],
    };
    (Object.keys(getGroup(group)) as Filter<typeof group>[]).forEach(
      (filter) => {
        if (getFilter(group, filter)) {
          aboveChartDisplay[group].array?.push(filter);
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
      }
    );
  });

  function addText(group: Group) {
    let ret = "";
    ret += "<div class='group'>";
    if (group === "difficulty") {
      ret += `<span aria-label="Difficulty" data-balloon-pos="up"><i class="fas fa-fw fa-star"></i>`;
    } else if (group === "mode") {
      ret += `<span aria-label="Mode" data-balloon-pos="up"><i class="fas fa-fw fa-bars"></i>`;
    } else if (group === "punctuation") {
      ret += `<span aria-label="Punctuation" data-balloon-pos="up"><span class="punc" style="font-weight: 900;
      width: 1.25rem;
      text-align: center;
      display: inline-block;
      letter-spacing: -.1rem;">!?</span>`;
    } else if (group === "numbers") {
      ret += `<span aria-label="Numbers" data-balloon-pos="up"><span class="numbers" style="font-weight: 900;
        width: 1.25rem;
        text-align: center;
        margin-right: .1rem;
        display: inline-block;
        letter-spacing: -.1rem;">15</span>`;
    } else if (group === "words") {
      ret += `<span aria-label="Words" data-balloon-pos="up"><i class="fas fa-fw fa-font"></i>`;
    } else if (group === "time") {
      ret += `<span aria-label="Time" data-balloon-pos="up"><i class="fas fa-fw fa-clock"></i>`;
    } else if (group === "date") {
      ret += `<span aria-label="Date" data-balloon-pos="up"><i class="fas fa-fw fa-calendar"></i>`;
    } else if (group === "tags") {
      ret += `<span aria-label="Tags" data-balloon-pos="up"><i class="fas fa-fw fa-tags"></i>`;
    } else if (group === "language") {
      ret += `<span aria-label="Language" data-balloon-pos="up"><i class="fas fa-fw fa-globe-americas"></i>`;
    } else if (group === "funbox") {
      ret += `<span aria-label="Funbox" data-balloon-pos="up"><i class="fas fa-fw fa-gamepad"></i>`;
    }
    if (aboveChartDisplay[group].all) {
      ret += "all";
    } else {
      if (group === "tags") {
        ret += aboveChartDisplay.tags.array
          ?.map((id) => {
            if (id === "none") return id;
            // TODO remove Tag when DB is done
            const name = DB.getSnapshot().tags.filter(
              (t: Tag) => t._id === id
            )[0];
            if (name !== undefined) {
              // TODO remove Tag when DB is done
              return DB.getSnapshot().tags.filter((t: Tag) => t._id === id)[0]
                .name;
            }
          })
          .join(", ");
      } else {
        ret += aboveChartDisplay[group].array?.join(", ").replace(/_/g, " ");
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
  if (aboveChartDisplay.mode.array?.includes("time")) {
    chartString += addText("time");
    chartString += `<div class="spacer"></div>`;
  }

  //words
  if (aboveChartDisplay.mode.array?.includes("words")) {
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

  setTimeout(() => {
    $(".pageAccount .group.chart .above").html(chartString);
  }, 0);
}

export function toggle<G extends Group>(group: G, filter: Filter<G>) {
  try {
    if (group === "date") {
      Object.keys(getGroup("date")).forEach((date) => {
        filters["date"][date] = false;
      });
    }
    filters[group][filter] = !filters[group][
      filter
    ] as unknown as ResultFilters[G][keyof ResultFilters[G]];
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
    // TODO remove Tag when DB is done
    DB.getSnapshot().tags.forEach((tag: Tag) => {
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
  const group = $(e.target).parents(".buttons").attr("group") as Group;
  const filter = $(e.target).attr("filter") as Filter<typeof group>;
  if ($(e.target).hasClass("allFilters")) {
    (Object.keys(getFilters()) as Group[]).forEach((group) => {
      (Object.keys(getGroup(group)) as Filter<typeof group>[]).forEach(
        (filter) => {
          if (group === "date") {
            filters[group][filter] = false as boolean & (string | number)[];
          } else {
            filters[group][filter] = true as boolean & (string | number)[];
          }
        }
      );
    });
    filters["date"]["all"] = true;
  } else if ($(e.target).hasClass("noFilters")) {
    (Object.keys(getFilters()) as Group[]).forEach((group) => {
      if (group !== "date") {
        (Object.keys(getGroup(group)) as Filter<typeof group>[]).forEach(
          (filter) => {
            filters[group][filter] = false as boolean & (string | number)[];
          }
        );
      }
    });
  } else if ($(e.target).hasClass("button")) {
    if (e.shiftKey) {
      (Object.keys(getGroup(group)) as Filter<typeof group>[]).forEach(
        (filter) => {
          filters[group][filter] = false as boolean & (string | number)[];
        }
      );
      filters[group][filter] = true as boolean & (string | number)[];
    } else {
      toggle(group, filter);
      // filters[group][filter] = !filters[group][filter];
    }
  }
  updateActive();
  save();
});

$(".pageAccount .topFilters .button.allFilters").click(() => {
  (Object.keys(getFilters()) as Group[]).forEach((group) => {
    (Object.keys(getGroup(group)) as Filter<typeof group>[]).forEach(
      (filter) => {
        if (group === "date") {
          filters[group][filter] = false as boolean & (string | number)[];
        } else {
          filters[group][filter] = true as boolean & (string | number)[];
        }
      }
    );
  });
  filters["date"]["all"] = true;
  updateActive();
  save();
});

$(".pageAccount .topFilters .button.currentConfigFilter").click(() => {
  (Object.keys(getFilters()) as Group[]).forEach((group) => {
    (Object.keys(getGroup(group)) as Filter<typeof group>[]).forEach(
      (filter) => {
        filters[group][filter] = false as boolean & (string | number)[];
      }
    );
  });

  // TODO remove all these types when Config is done
  filters["difficulty"][Config.difficulty as Difficulty] = true;
  filters["mode"][Config.mode as Mode] = true;
  if (Config.mode === "time") {
    filters["time"][Config.time as TimeModes] = true;
  } else if (Config.mode === "words") {
    filters["words"][Config.words as WordsModes] = true;
  } else if (Config.mode === "quote") {
    Object.keys(getGroup("quoteLength")).forEach((ql) => {
      filters["quoteLength"][ql as QuoteModes] = true;
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
  // TODO remove Tag when DB is done
  DB.getSnapshot().tags.forEach((tag: Tag) => {
    if (tag.active === true) {
      filters["tags"]["none"] = false;
      filters["tags"][tag._id] = true;
    }
  });

  filters["date"]["all"] = true;
  updateActive();
  save();
});

$(".pageAccount .topFilters .button.toggleAdvancedFilters").click(() => {
  $(".pageAccount .filterButtons").slideToggle(250);
  $(".pageAccount .topFilters .button.toggleAdvancedFilters").toggleClass(
    "active"
  );
});

// TODO remove Language[] when Misc is done
Misc.getLanguageList().then((languages: Language[]) => {
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
// TODO remove FunboxJSON
Misc.getFunboxList().then((funboxModes: FunboxJSON[]) => {
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
