import * as Misc from "../../utils/misc";
import * as Strings from "../../utils/strings";
import * as JSONData from "../../utils/json-data";
import * as DB from "../../db";
import Config from "../../config";
import * as Notifications from "../notifications";
import Ape from "../../ape/index";
import * as Loader from "../loader";
// @ts-expect-error TODO: update slim-select
import SlimSelect from "slim-select";
import { QuoteLength } from "@monkeytype/contracts/schemas/configs";
import {
  ResultFilters,
  ResultFiltersSchema,
  ResultFiltersGroup,
  ResultFiltersGroupItem,
} from "@monkeytype/contracts/schemas/users";
import { LocalStorageWithSchema } from "../../utils/local-storage-with-schema";
import defaultResultFilters from "../../constants/default-result-filters";

export function mergeWithDefaultFilters(
  filters: Partial<ResultFilters>
): ResultFilters {
  try {
    const merged = {} as ResultFilters;
    for (const groupKey of Misc.typedKeys(defaultResultFilters)) {
      if (groupKey === "_id") {
        let id = filters[groupKey] ?? defaultResultFilters[groupKey];
        if (id === "default-result-filters-id" || id === "") {
          id = "default";
        }
        merged[groupKey] = id;
      } else if (groupKey === "name") {
        merged[groupKey] = filters[groupKey] ?? defaultResultFilters[groupKey];
      } else {
        // @ts-expect-error i cant figure this out
        merged[groupKey] = {
          ...defaultResultFilters[groupKey],
          ...filters[groupKey],
        };
      }
    }
    return merged;
  } catch (e) {
    return defaultResultFilters;
  }
}

const resultFiltersLS = new LocalStorageWithSchema({
  key: "resultFilters",
  schema: ResultFiltersSchema,
  fallback: defaultResultFilters,
  migrate: (unknown, _issues) => {
    if (!Misc.isObject(unknown)) {
      return defaultResultFilters;
    }
    return mergeWithDefaultFilters(unknown as ResultFilters);
  },
});

type Option = {
  id: string;
  value: string;
  text: string;
  html: string;
  selected: boolean;
  display: boolean;
  disabled: boolean;
  placeholder: boolean;
  class: string;
  style: string;
  data: {
    [key: string]: string;
  };
  mandatory: boolean;
};

const groupsUsingSelect = ["language", "funbox", "tags"];
const groupSelects: Partial<Record<keyof ResultFilters, SlimSelect>> = {};

// current activated filter
let filters = defaultResultFilters;

function save(): void {
  resultFiltersLS.set(filters);
}

export async function load(): Promise<void> {
  try {
    filters = resultFiltersLS.get();

    const newTags: Record<string, boolean> = { none: false };
    Object.keys(defaultResultFilters.tags).forEach((tag) => {
      if (filters.tags[tag] !== undefined) {
        newTags[tag] = filters.tags[tag];
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

async function updateFilterPresets(): Promise<void> {
  const parent = document.querySelector(".pageAccount .presetFilterButtons");
  const buttons = document.querySelector(
    ".pageAccount .presetFilterButtons .filterBtns"
  );

  if (!parent || !buttons) return;

  buttons.innerHTML = "";

  const filterPresets =
    DB.getSnapshot()?.filterPresets.map((filter) => {
      filter.name = filter.name.replace(/_/g, " ");
      return filter;
    }) ?? [];

  if (filterPresets.length > 0) {
    let html = "";

    for (const filter of filterPresets) {
      html += `<div class="filterPresets">
      <div class="select-filter-preset button" data-id="${filter._id}">${filter.name} </div>
      <div class="button delete-filter-preset" data-id="${filter._id}">
        <i class="fas fa-fw fa-trash"></i>
      </div>
    </div>`;
    }

    buttons.innerHTML = html;
    parent.classList.remove("hidden");
  } else {
    parent.classList.add("hidden");
  }
}

// sets the current filter to be a user custom filter
export async function setFilterPreset(id: string): Promise<void> {
  const filter = DB.getSnapshot()?.filterPresets.find(
    (filter) => filter._id === id
  );
  if (filter) {
    // deep copy filter
    filters = verifyResultFiltersStructure(filter);

    save();
    updateActive();
  }

  // make all filter preset butons inactive
  $(
    `.pageAccount .group.presetFilterButtons .filterBtns .filterPresets .select-filter-preset`
  ).removeClass("active");

  // make current filter presest button active
  $(
    `.pageAccount .group.presetFilterButtons .filterBtns .filterPresets .select-filter-preset[data-id=${id}]`
  ).addClass("active");
}

function deepCopyFilter(filter: ResultFilters): ResultFilters {
  return JSON.parse(JSON.stringify(filter)) as ResultFilters;
}

function addFilterPresetToSnapshot(filter: ResultFilters): void {
  const snapshot = DB.getSnapshot();
  if (!snapshot) return;
  DB.setSnapshot({
    ...snapshot,
    filterPresets: [...snapshot.filterPresets, deepCopyFilter(filter)],
  });
}

// callback function called by popup once user inputs name
export async function createFilterPreset(name: string): Promise<void> {
  name = name.replace(/ /g, "_");
  Loader.show();
  const result = await Ape.users.addResultFilterPreset({
    body: { ...filters, name },
  });
  Loader.hide();
  if (result.status === 200) {
    addFilterPresetToSnapshot({ ...filters, name, _id: result.body.data });
    void updateFilterPresets();
    Notifications.add("Filter preset created", 1);
  } else {
    Notifications.add(
      "Error creating filter preset: " + result.body.message,
      -1
    );
    console.log("error creating filter preset: " + result.body.message);
  }
}

function removeFilterPresetFromSnapshot(id: string): void {
  const snapshot = DB.getSnapshot();
  if (!snapshot) return;
  const filterPresets = [...snapshot.filterPresets];
  const toDeleteIx = filterPresets.findIndex((filter) => filter._id === id);

  if (toDeleteIx > -1) {
    filterPresets.splice(toDeleteIx, 1);
  }
  DB.setSnapshot({ ...snapshot, filterPresets });
}

// deletes the currently selected filter preset
async function deleteFilterPreset(id: string): Promise<void> {
  Loader.show();
  const result = await Ape.users.removeResultFilterPreset({
    params: { presetId: id },
  });
  Loader.hide();
  if (result.status === 200) {
    removeFilterPresetFromSnapshot(id);
    void updateFilterPresets();
    reset();
    Notifications.add("Filter preset deleted", 1);
  } else {
    Notifications.add(
      "Error deleting filter preset: " + result.body.message,
      -1
    );
    console.log("error deleting filter preset", result.body.message);
  }
}

function deSelectFilterPreset(): void {
  // make all filter preset buttons inactive
  $(
    ".pageAccount .group.presetFilterButtons .filterBtns .filterPresets .select-filter-preset"
  ).removeClass("active");
}

function getFilters(): ResultFilters {
  return filters;
}

function getGroup<G extends ResultFiltersGroup>(group: G): ResultFilters[G] {
  return filters[group];
}

// export function setFilter(group, filter, value) {
//   filters[group][filter] = value;
// }

export function getFilter<G extends ResultFiltersGroup>(
  group: G,
  filter: ResultFiltersGroupItem<G>
): ResultFilters[G][ResultFiltersGroupItem<G>] {
  return filters[group][filter];
}

function setFilter<G extends ResultFiltersGroup>(
  group: G,
  filter: ResultFiltersGroupItem<G>,
  value: boolean
): void {
  filters[group][filter] = value as (typeof filters)[G][typeof filter];
}

function setAllFilters(group: ResultFiltersGroup, value: boolean): void {
  Object.keys(getGroup(group)).forEach((filter) => {
    filters[group][filter as keyof (typeof filters)[typeof group]] =
      value as never;
  });
}

export function loadTags(tags: MonkeyTypes.UserTag[]): void {
  tags.forEach((tag) => {
    defaultResultFilters.tags[tag._id] = true;
  });
}

export function reset(): void {
  filters = defaultResultFilters;
  save();
}

type AboveChartDisplay = Partial<
  Record<ResultFiltersGroup, { all: boolean; array?: string[] }>
>;

export function updateActive(): void {
  const aboveChartDisplay: AboveChartDisplay = {};

  for (const group of Misc.typedKeys(getFilters())) {
    // id and name field do not correspond to any ui elements, no need to update
    if (group === "_id" || group === "name") {
      continue;
    }

    aboveChartDisplay[group] = {
      all: true,
      array: [],
    };

    for (const filter of Misc.typedKeys(getGroup(group))) {
      const groupAboveChartDisplay = aboveChartDisplay[group];

      if (groupAboveChartDisplay === undefined) continue;

      const filterValue = getFilter(
        group,
        filter as ResultFiltersGroupItem<typeof group>
      );
      if (filterValue === true) {
        groupAboveChartDisplay.array?.push(filter);
      } else {
        if (groupAboveChartDisplay.all !== undefined) {
          groupAboveChartDisplay.all = false;
        }
      }

      if (groupsUsingSelect.includes(group)) {
        const option = $(
          `.pageAccount .group.filterButtons .filterGroup[group="${group}"] option[value="${filter}"]`
        );
        if (filterValue === true) {
          option.prop("selected", true);
        } else {
          option.prop("selected", false);
        }
      } else {
        let buttonEl;
        if (group === "date") {
          buttonEl = $(
            `.pageAccount .group.topFilters .filterGroup[group="${group}"] button[filter="${filter}"]`
          );
        } else {
          buttonEl = $(
            `.pageAccount .group.filterButtons .filterGroup[group="${group}"] button[filter="${filter}"]`
          );
        }
        if (filterValue === true) {
          buttonEl.addClass("active");
        } else {
          buttonEl.removeClass("active");
        }
      }
    }
  }

  for (const [id, select] of Object.entries(groupSelects)) {
    const ss = select;
    const group = getGroup(id as ResultFiltersGroup);
    const everythingSelected = Object.values(group).every((v) => v === true);

    const newData = ss.store.getData();

    const allOption = $(
      `.pageAccount .group.filterButtons .filterGroup[group="${id}"] option[value="all"]`
    );

    if (everythingSelected) {
      allOption.prop("selected", true);
      for (const data of newData) {
        if ("value" in data) {
          if (data.value === "all") data.selected = true;
          else data.selected = false;
        }
      }
      ss.store.setData(newData);
      ss.render.renderValues();
    } else {
      allOption.prop("selected", false);
    }

    for (const data of newData) {
      if ("value" in data) {
        if (group[data.value as keyof typeof group] === true) {
          data.selected = true;
        } else {
          if (!everythingSelected || data.value !== "all") {
            data.selected = false;
          }
        }
      }
    }

    setTimeout(() => {
      ss.store.setData(newData);
      if (!everythingSelected) {
        ss.render.renderValues();
      }
      ss.render.renderOptions(newData);
    }, 0);
  }

  function addText(group: ResultFiltersGroup): string {
    let ret = "";
    ret += "<div class='group'>";
    if (group === "difficulty") {
      ret += `<span aria-label="Difficulty" data-balloon-pos="up"><i class="fas fa-fw fa-star"></i>`;
    } else if (group === "mode") {
      ret += `<span aria-label="Mode" data-balloon-pos="up"><i class="fas fa-fw fa-bars"></i>`;
    } else if (group === "punctuation") {
      ret += `<span aria-label="Punctuation" data-balloon-pos="up"><i class="fas fa-fw fa-at"></i>`;
    } else if (group === "numbers") {
      ret += `<span aria-label="Numbers" data-balloon-pos="up"><i class="fas fa-fw fa-hashtag"></i>`;
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
    if (aboveChartDisplay[group]?.all) {
      ret += "all";
    } else {
      if (group === "tags") {
        ret += aboveChartDisplay.tags?.array
          ?.map((id) => {
            if (id === "none") return id;
            const snapshot = DB.getSnapshot();
            if (snapshot === undefined) return id;
            const name = snapshot.tags?.filter((t) => t._id === id)[0];
            if (name !== undefined) {
              return snapshot.tags?.filter((t) => t._id === id)[0]?.display;
            }
            return name;
          })
          .join(", ");
      } else {
        ret += aboveChartDisplay[group]?.array?.join(", ").replace(/_/g, " ");
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
  if (aboveChartDisplay.mode?.array?.includes("time")) {
    chartString += addText("time");
    chartString += `<div class="spacer"></div>`;
  }

  //words
  if (aboveChartDisplay.mode?.array?.includes("words")) {
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

function toggle<G extends ResultFiltersGroup>(
  group: G,
  filter: ResultFiltersGroupItem<G>
): void {
  // user is changing the filters -> current filter is no longer a filter preset
  deSelectFilterPreset();

  try {
    if (group === "date") {
      setAllFilters("date", false);
    }
    const currentValue = filters[group][filter] as unknown as boolean;
    const newValue = !currentValue;
    filters[group][filter] =
      newValue as ResultFilters[G][ResultFiltersGroupItem<G>];
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

$(
  ".pageAccount .filterButtons .buttonsAndTitle .buttons, .pageAccount .group.topFilters .buttonsAndTitle.testDate .buttons"
).on("click", "button", (e) => {
  const group = $(e.target)
    .parents(".buttons")
    .attr("group") as ResultFiltersGroup;
  const filter = $(e.target).attr("filter") as ResultFiltersGroupItem<
    typeof group
  >;
  if ($(e.target).hasClass("allFilters")) {
    Misc.typedKeys(getFilters()).forEach((group) => {
      // id and name field do not correspond to any ui elements, no need to update
      if (group === "_id" || group === "name") {
        return;
      }

      setAllFilters(group, true);
    });
    setAllFilters("date", false);
    filters.date.all = true;
  } else if ($(e.target).hasClass("noFilters")) {
    Misc.typedKeys(getFilters()).forEach((group) => {
      // id and name field do not correspond to any ui elements, no need to update
      if (group === "_id" || group === "name") {
        return;
      }

      if (group !== "date") {
        setAllFilters(group, false);
      }
    });
  } else if ($(e.target).is("button")) {
    if (e.shiftKey) {
      setAllFilters(group, false);
      filters[group][filter] =
        true as ResultFilters[typeof group][typeof filter];
    } else {
      toggle(group, filter);
      // filters[group][filter] = !filters[group][filter];
    }
  }
  updateActive();
  save();
});

$(".pageAccount .topFilters button.allFilters").on("click", () => {
  // user is changing the filters -> current filter is no longer a filter preset
  deSelectFilterPreset();

  console.log(getFilters());

  Misc.typedKeys(getFilters()).forEach((group) => {
    // id and name field do not correspond to any ui elements, no need to update
    if (group === "_id" || group === "name") {
      return;
    }

    setAllFilters(group, true);
  });
  setAllFilters("date", false);
  filters.date.all = true;
  updateActive();
  save();
});

$(".pageAccount .topFilters button.currentConfigFilter").on("click", () => {
  // user is changing the filters -> current filter is no longer a filter preset
  deSelectFilterPreset();

  Misc.typedKeys(getFilters()).forEach((group) => {
    // id and name field do not correspond to any ui elements, no need to update
    if (group === "_id" || group === "name") {
      return;
    }

    setAllFilters(group, false);
  });

  filters.pb.no = true;
  filters.pb.yes = true;

  filters.difficulty[Config.difficulty] = true;
  filters.mode[Config.mode] = true;
  if (Config.mode === "time") {
    if ([15, 30, 60, 120].includes(Config.time)) {
      const configTime = Config.time as MonkeyTypes.DefaultTimeModes;
      filters.time[configTime] = true;
    } else {
      filters.time.custom = true;
    }
  } else if (Config.mode === "words") {
    if ([10, 25, 50, 100, 200].includes(Config.words)) {
      const configWords = Config.words as MonkeyTypes.DefaultWordsModes;
      filters.words[configWords] = true;
    } else {
      filters.words.custom = true;
    }
  } else if (Config.mode === "quote") {
    const filterName: ResultFiltersGroupItem<"quoteLength">[] = [
      "short",
      "medium",
      "long",
      "thicc",
    ];
    filterName.forEach((ql, index) => {
      if (Config.quoteLength.includes(index as QuoteLength)) {
        filters.quoteLength[ql] = true;
      } else {
        filters.quoteLength[ql] = false;
      }
    });
  }
  if (Config.punctuation) {
    filters.punctuation.on = true;
  } else {
    filters.punctuation.off = true;
  }
  if (Config.numbers) {
    filters.numbers.on = true;
  } else {
    filters.numbers.off = true;
  }
  if (Config.mode === "quote" && /english.*/.test(Config.language)) {
    filters.language["english"] = true;
  } else {
    filters.language[Config.language] = true;
  }

  if (Config.funbox === "none") {
    filters.funbox["none"] = true;
  } else {
    for (const f of Config.funbox.split("#")) {
      filters.funbox[f] = true;
    }
  }

  filters.tags["none"] = true;

  DB.getSnapshot()?.tags?.forEach((tag) => {
    if (tag.active === true) {
      filters.tags["none"] = false;
      filters.tags[tag._id] = true;
    }
  });

  filters.date.all = true;
  updateActive();
  save();
});

$(".pageAccount .topFilters button.toggleAdvancedFilters").on("click", () => {
  $(".pageAccount .filterButtons").slideToggle(250);
  $(".pageAccount .topFilters button.toggleAdvancedFilters").toggleClass(
    "active"
  );
});

function adjustScrollposition(
  group: ResultFiltersGroup,
  topItem: number = 0
): void {
  const slimSelect = groupSelects[group];
  if (slimSelect === undefined) return;
  const listElement = slimSelect.render.content.list;
  const topListItem = listElement.children.item(topItem) as HTMLElement;

  listElement.scrollTop = topListItem.offsetTop - listElement.offsetTop;
}

function selectBeforeChangeFn(
  group: ResultFiltersGroup,
  selectedOptions: Option[],
  oldSelectedOptions: Option[]
): void | boolean {
  const includesAllNow = selectedOptions.some(
    (option) => option.value === "all"
  );
  const includedAllBefore = oldSelectedOptions.some(
    (option) => option.value === "all"
  );

  if (includesAllNow) {
    if (!includedAllBefore) {
      // all option was selected
      selectedOptions = selectedOptions.filter(
        (option) => option.value === "all"
      );
    } else if (selectedOptions.length < oldSelectedOptions.length) {
      // options other than all were deselcted
      selectedOptions = selectedOptions.filter(
        (option) => option.value !== "all"
      );
    }
  } else {
    if (includedAllBefore) {
      // all option was deselected
      selectedOptions = [];
    }
  }

  setAllFilters(group, false);
  for (const selectedOption of selectedOptions) {
    if (selectedOption.value === "all") {
      setAllFilters(group, true);
      break;
    }

    setFilter(
      group,
      selectedOption.value as ResultFiltersGroupItem<typeof group>,
      true
    );
  }

  updateActive();
  save();
  selectChangeCallbackFn();
  return false;
}

let selectChangeCallbackFn: () => void = () => {
  //
};

export async function appendButtons(
  selectChangeCallback: () => void
): Promise<void> {
  selectChangeCallbackFn = selectChangeCallback;

  let languageList;
  try {
    languageList = await JSONData.getLanguageList();
  } catch (e) {
    console.error(
      Misc.createErrorMessage(e, "Failed to append language buttons")
    );
  }
  if (languageList) {
    let html = "";

    html +=
      "<select class='languageSelect' group='language' placeholder='select a language' multiple>";

    html += "<option value='all'>all</option>";

    for (const language of languageList) {
      html += `<option value="${language}" filter="${language}">${Strings.getLanguageDisplayString(
        language
      )}</option>`;
    }

    html += "</select>";

    const el = document.querySelector(
      ".pageAccount .content .filterButtons .buttonsAndTitle.languages .select"
    );
    if (el) {
      el.innerHTML = html;
      groupSelects["language"] = new SlimSelect({
        select: el.querySelector(".languageSelect") as HTMLSelectElement,
        settings: {
          showSearch: true,
          placeholderText: "select a language",
          allowDeselect: true,
          closeOnSelect: false,
        },
        events: {
          beforeChange: (
            // @ts-expect-error TODO: update slim-select
            selectedOptions,
            // @ts-expect-error TODO: update slim-select
            oldSelectedOptions
          ): void | boolean => {
            return selectBeforeChangeFn(
              "language",
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              selectedOptions,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              oldSelectedOptions
            );
          },
          beforeOpen: (): void => {
            adjustScrollposition("language");
          },
        },
      });
    }
  }

  let funboxList;
  try {
    funboxList = await JSONData.getFunboxList();
  } catch (e) {
    console.error(
      Misc.createErrorMessage(e, "Failed to append funbox buttons")
    );
  }
  if (funboxList) {
    let html = "";

    html +=
      "<select class='funboxSelect' group='funbox' placeholder='select a funbox' multiple>";

    html += "<option value='all'>all</option>";
    html += "<option value='none'>no funbox</option>";

    for (const funbox of funboxList) {
      html += `<option value="${funbox.name}" filter="${
        funbox.name
      }">${funbox.name.replace(/_/g, " ")}</option>`;
    }

    html += "</select>";

    const el = document.querySelector(
      ".pageAccount .content .filterButtons .buttonsAndTitle.funbox .select"
    );
    if (el) {
      el.innerHTML = html;
      groupSelects["funbox"] = new SlimSelect({
        select: el.querySelector(".funboxSelect") as HTMLSelectElement,
        settings: {
          showSearch: true,
          placeholderText: "select a funbox",
          allowDeselect: true,
          closeOnSelect: false,
        },
        events: {
          beforeChange: (
            // @ts-expect-error TODO: update slim-select
            selectedOptions,
            // @ts-expect-error TODO: update slim-select
            oldSelectedOptions
          ): void | boolean => {
            return selectBeforeChangeFn(
              "funbox",
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              selectedOptions,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              oldSelectedOptions
            );
          },
          beforeOpen: (): void => {
            adjustScrollposition("funbox");
          },
        },
      });
    }
  }

  const snapshot = DB.getSnapshot();

  if (snapshot !== undefined && (snapshot.tags?.length ?? 0) > 0) {
    $(".pageAccount .content .filterButtons .buttonsAndTitle.tags").removeClass(
      "hidden"
    );

    let html = "";

    html +=
      "<select class='tagsSelect' group='tags' placeholder='select a tag' multiple>";

    html += "<option value='all'>all</option>";
    html += "<option value='none'>no tag</option>";

    for (const tag of snapshot.tags) {
      html += `<option value="${tag._id}" filter="${tag.name}">${tag.display}</option>`;
    }

    html += "</select>";

    const el = document.querySelector(
      ".pageAccount .content .filterButtons .buttonsAndTitle.tags .select"
    );
    if (el) {
      el.innerHTML = html;
      groupSelects["tags"] = new SlimSelect({
        select: el.querySelector(".tagsSelect") as HTMLSelectElement,
        settings: {
          showSearch: true,
          placeholderText: "select a tag",
          allowDeselect: true,
          closeOnSelect: false,
        },
        events: {
          beforeChange: (
            // @ts-expect-error TODO: update slim-select
            selectedOptions,
            // @ts-expect-error TODO: update slim-select
            oldSelectedOptions
          ): void | boolean => {
            return selectBeforeChangeFn(
              "tags",
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              selectedOptions,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              oldSelectedOptions
            );
          },
          beforeOpen: (): void => {
            adjustScrollposition("tags");
          },
        },
      });
    }
  } else {
    $(".pageAccount .content .filterButtons .buttonsAndTitle.tags").addClass(
      "hidden"
    );
  }

  void updateFilterPresets();
}

export function removeButtons(): void {
  $(
    ".pageAccount .content .filterButtons .buttonsAndTitle.languages .buttons"
  ).empty();
  $(
    ".pageAccount .content .filterButtons .buttonsAndTitle.funbox .buttons"
  ).empty();
  $(
    ".pageAccount .content .filterButtons .buttonsAndTitle.tags .buttons"
  ).empty();
}

$(".group.presetFilterButtons .filterBtns").on(
  "click",
  ".filterPresets .delete-filter-preset",
  (e) => {
    void deleteFilterPreset($(e.currentTarget).data("id") as string);
  }
);

function verifyResultFiltersStructure(filterIn: ResultFilters): ResultFilters {
  const filter = deepCopyFilter(filterIn);
  Object.entries(defaultResultFilters).forEach((entry) => {
    const key = entry[0] as ResultFiltersGroup;
    const value = entry[1];
    if (filter[key] === undefined) {
      // @ts-expect-error key and value is based on default filter so this is safe to ignore
      filter[key] = value;
    }
  });
  return filter;
}
