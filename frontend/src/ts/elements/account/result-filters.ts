import * as Misc from "../../utils/misc";
import * as Strings from "../../utils/strings";
import * as DB from "../../db";
import Config from "../../config";
import * as Notifications from "../notifications";
import Ape from "../../ape/index";
import { showLoaderBar, hideLoaderBar } from "../../signals/loader-bar";
import SlimSelect from "slim-select";
import { QuoteLength } from "@monkeytype/schemas/configs";
import {
  ResultFilters,
  ResultFiltersSchema,
  ResultFiltersGroup,
  ResultFiltersGroupItem,
} from "@monkeytype/schemas/users";
import { LocalStorageWithSchema } from "../../utils/local-storage-with-schema";
import defaultResultFilters from "../../constants/default-result-filters";
import { getAllFunboxes } from "@monkeytype/funbox";
import { Snapshot } from "../../constants/default-snapshot";
import { LanguageList } from "../../constants/languages";
import * as AuthEvent from "../../observables/auth-event";
import { sanitize } from "../../utils/sanitize";
import { qs, qsa } from "../../utils/dom";

export function mergeWithDefaultFilters(
  filters: Partial<ResultFilters>,
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
    return mergeWithDefaultFilters(
      sanitize(ResultFiltersSchema.partial().strip(), unknown as ResultFilters),
    );
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

const groupsUsingSelect = new Set(["language", "funbox", "tags"]);
const groupSelects: Partial<Record<keyof ResultFilters, SlimSelect>> = {};

// current activated filter
let filters = defaultResultFilters;

function save(): void {
  resultFiltersLS.set(filters);
}

export async function load(): Promise<void> {
  try {
    filters = mergeWithDefaultFilters(resultFiltersLS.get());

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
    ".pageAccount .presetFilterButtons .filterBtns",
  );

  if (!parent || !buttons) return;

  buttons.innerHTML = "";

  const filterPresets = DB.getSnapshot()?.filterPresets ?? [];

  if (filterPresets.length > 0) {
    let html = "";

    for (const filter of filterPresets) {
      html += `<div class="filterPresets">
      <div class="select-filter-preset button" data-id="${
        filter._id
      }">${filter.name.replace(/_/g, " ")}</div>
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
    (filter) => filter._id === id,
  );
  if (filter) {
    // deep copy filter
    filters = verifyResultFiltersStructure(filter);

    save();
    updateActive();
  }

  // make all filter preset butons inactive
  qsa(
    `.pageAccount .group.presetFilterButtons .filterBtns .filterPresets .select-filter-preset`,
  ).removeClass("active");

  // make current filter presest button active
  qsa(
    `.pageAccount .group.presetFilterButtons .filterBtns .filterPresets .select-filter-preset[data-id="${id}"]`,
  ).addClass("active");
}

function addFilterPresetToSnapshot(filter: ResultFilters): void {
  const snapshot = DB.getSnapshot();
  if (!snapshot) return;
  DB.setSnapshot({
    ...snapshot,
    filterPresets: [...snapshot.filterPresets, structuredClone(filter)],
  });
}

// callback function called by popup once user inputs name
export async function createFilterPreset(
  name: string,
): Promise<number | undefined> {
  name = name.replace(/ /g, "_");
  showLoaderBar();
  const result = await Ape.users.addResultFilterPreset({
    body: { ...filters, name },
  });
  hideLoaderBar();
  if (result.status === 200) {
    addFilterPresetToSnapshot({ ...filters, name, _id: result.body.data });
    void updateFilterPresets();
    return 1;
  } else {
    console.log("error creating filter preset: " + result.body.message);
    return 0;
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
  showLoaderBar();
  const result = await Ape.users.removeResultFilterPreset({
    params: { presetId: id },
  });
  hideLoaderBar();
  if (result.status === 200) {
    removeFilterPresetFromSnapshot(id);
    void updateFilterPresets();
    reset();
    Notifications.add("Filter preset deleted", 1);
  } else {
    Notifications.add(
      "Error deleting filter preset: " + result.body.message,
      -1,
    );
    console.log("error deleting filter preset", result.body.message);
  }
}

function deSelectFilterPreset(): void {
  // make all filter preset buttons inactive
  qsa(
    ".pageAccount .group.presetFilterButtons .filterBtns .filterPresets .select-filter-preset",
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
  filter: ResultFiltersGroupItem<G>,
): ResultFilters[G][ResultFiltersGroupItem<G>] {
  return filters[group][filter];
}

function setFilter<G extends ResultFiltersGroup>(
  group: G,
  filter: ResultFiltersGroupItem<G>,
  value: boolean,
): void {
  filters[group][filter] = value as (typeof filters)[G][typeof filter];
}

function setAllFilters(group: ResultFiltersGroup, value: boolean): void {
  Object.keys(getGroup(group)).forEach((filter) => {
    filters[group][filter as keyof (typeof filters)[typeof group]] =
      value as never;
  });
}

export function loadTags(): void {
  const snapshot = DB.getSnapshot();

  if (snapshot === undefined) return;

  snapshot.tags.forEach((tag) => {
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
        filter as ResultFiltersGroupItem<typeof group>,
      );
      if (filterValue === true) {
        groupAboveChartDisplay.array?.push(filter);
      } else {
        if (groupAboveChartDisplay.all !== undefined) {
          groupAboveChartDisplay.all = false;
        }
      }

      if (groupsUsingSelect.has(group)) {
        const option = qs<HTMLOptionElement>(
          `.pageAccount .group.filterButtons .filterGroup[group="${group}"] option[value="${filter}"]`,
        );
        if (filterValue === true) {
          option?.setSelected(true);
        } else {
          option?.setSelected(false);
        }
      } else {
        let buttonEl;
        if (group === "date") {
          buttonEl = qs(
            `.pageAccount .group.topFilters .filterGroup[group="${group}"] button[filter="${filter}"]`,
          );
        } else {
          buttonEl = qs(
            `.pageAccount .group.filterButtons .filterGroup[group="${group}"] button[filter="${filter}"]`,
          );
        }
        if (filterValue === true) {
          buttonEl?.addClass("active");
        } else {
          buttonEl?.removeClass("active");
        }
      }
    }
  }

  for (const [id, select] of Object.entries(groupSelects)) {
    const ss = select;
    const group = getGroup(id as ResultFiltersGroup);
    const everythingSelected = Object.values(group).every((v) => v === true);

    const newData = ss.store.getData();

    const allOption = qs<HTMLOptionElement>(
      `.pageAccount .group.filterButtons .filterGroup[group="${id}"] option[value="all"]`,
    );

    if (everythingSelected) {
      allOption?.setSelected(true);
      for (const data of newData) {
        if ("value" in data) {
          if (data.value === "all") data.selected = true;
          else data.selected = false;
        }
      }
      ss.store.setData(newData);
      ss.render.renderValues();
    } else {
      allOption?.setSelected(false);
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
            const name = snapshot.tags?.find((t) => t._id === id);
            if (name !== undefined) {
              return snapshot.tags?.find((t) => t._id === id)?.display;
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

  qs(".pageAccount .group.chart .above")?.setHtml(chartString);
}

function toggle<G extends ResultFiltersGroup>(
  group: G,
  filter: ResultFiltersGroupItem<G>,
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
      0,
    );
    console.log("toggling filter error");
    console.error(e);
    reset();
    updateActive();
  }
}

for (const el of qsa(`
  .pageAccount .filterButtons .buttonsAndTitle .buttons,
  .pageAccount .group.topFilters .buttonsAndTitle.testDate .buttons
  `)) {
  el.onChild("click", "button", (e) => {
    const childTarget = e.childTarget as HTMLElement;

    if (childTarget.classList.contains("allFilters")) {
      Misc.typedKeys(getFilters()).forEach((group) => {
        // id and name field do not correspond to any ui elements, no need to update
        if (group === "_id" || group === "name") {
          return;
        }

        setAllFilters(group, true);
      });
      setAllFilters("date", false);
      filters.date.all = true;
    } else if (childTarget.classList.contains("noFilters")) {
      Misc.typedKeys(getFilters()).forEach((group) => {
        // id and name field do not correspond to any ui elements, no need to update
        if (group === "_id" || group === "name") {
          return;
        }

        if (group !== "date") {
          setAllFilters(group, false);
        }
      });
    } else {
      const group = (e.target as HTMLElement).parentElement?.getAttribute(
        "group",
      ) as ResultFiltersGroup | null;
      if (group === null) {
        throw new Error("Cannot find group of target.");
      }

      const filter = childTarget.getAttribute(
        "filter",
      ) as ResultFiltersGroupItem<typeof group> | null;
      if (filter === null) {
        throw new Error("Cannot find filter of target.");
      }

      if ((e.target as HTMLElement).tagName === "BUTTON") {
        if (e.shiftKey) {
          setAllFilters(group, false);
          filters[group][filter] =
            true as ResultFilters[typeof group][typeof filter];
        } else {
          toggle(group, filter);
          // filters[group][filter] = !filters[group][filter];
        }
      }
    }
    updateActive();
    save();
  });
}

qs(".pageAccount .topFilters button.allFilters")?.on("click", () => {
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

qs(".pageAccount .topFilters button.currentConfigFilter")?.on("click", () => {
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
      const configTime = `${Config.time}` as keyof typeof filters.time;
      filters.time[configTime] = true;
    } else {
      filters.time.custom = true;
    }
  } else if (Config.mode === "words") {
    if ([10, 25, 50, 100, 200].includes(Config.words)) {
      const configWords = `${Config.words}` as keyof typeof filters.words;
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

  if (Config.funbox.length === 0) {
    filters.funbox["none"] = true;
  } else {
    for (const f of Config.funbox) {
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

qs(".pageAccount .topFilters button.toggleAdvancedFilters")?.on("click", () => {
  const buttons = qs(".pageAccount .filterButtons");
  const advancedFiltersButton = qs(
    ".pageAccount .topFilters button.toggleAdvancedFilters",
  );

  if (buttons?.isVisible()) {
    void buttons.slideUp(250);
    advancedFiltersButton?.removeClass("active");
  } else {
    void buttons?.slideDown(250);
    advancedFiltersButton?.addClass("active");
  }
});

function adjustScrollposition(
  group: ResultFiltersGroup,
  topItem: number = 0,
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
  oldSelectedOptions: Option[],
): boolean {
  const includesAllNow = selectedOptions.some(
    (option) => option.value === "all",
  );
  const includedAllBefore = oldSelectedOptions.some(
    (option) => option.value === "all",
  );

  if (includesAllNow) {
    if (!includedAllBefore) {
      // all option was selected
      selectedOptions = selectedOptions.filter(
        (option) => option.value === "all",
      );
    } else if (selectedOptions.length < oldSelectedOptions.length) {
      // options other than all were deselcted
      selectedOptions = selectedOptions.filter(
        (option) => option.value !== "all",
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
      true,
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

export function updateTagsDropdownOptions(): void {
  const snapshot = DB.getSnapshot();

  if (snapshot === undefined) {
    return;
  }

  const newTags = snapshot.tags.filter(
    (it) => defaultResultFilters.tags[it._id] === undefined,
  );
  if (newTags.length > 0) {
    const everythingSelected = Object.values(filters.tags).every((v) => v);

    defaultResultFilters.tags = {
      ...defaultResultFilters.tags,
      ...Object.fromEntries(newTags.map((tag) => [tag._id, true])),
    };

    filters.tags = {
      ...filters.tags,
      ...Object.fromEntries(
        newTags.map((tag) => [tag._id, everythingSelected]),
      ),
    };
  }

  const el = document.querySelector<HTMLElement>(
    ".pageAccount .content .filterButtons .buttonsAndTitle.tags .select select",
  );

  if (!(el instanceof HTMLElement)) return;

  let html = "";

  html += "<option value='all'>all</option>";
  html += "<option value='none'>no tag</option>";

  for (const tag of snapshot.tags) {
    html += `<option value="${tag._id}" filter="${tag.name}">${tag.display}</option>`;
  }

  el.innerHTML = html;
}

let buttonsAppended = false;

export async function appendDropdowns(
  selectChangeCallback: () => void,
): Promise<void> {
  //snapshot at this point is guaranteed to exist
  const snapshot = DB.getSnapshot() as Snapshot;

  tagDropdownUpdate(snapshot);

  if (buttonsAppended) return;

  selectChangeCallbackFn = selectChangeCallback;

  groupSelects["language"] = new SlimSelect({
    select:
      ".pageAccount .content .filterButtons .buttonsAndTitle.languages .select .languageSelect",
    data: [
      { value: "all", text: "all" },
      ...LanguageList.map((language) => ({
        value: language,
        text: Strings.getLanguageDisplayString(language),
        filter: language,
      })),
    ],
    settings: {
      showSearch: true,
      placeholderText: "select a language",
      allowDeselect: true,
      closeOnSelect: false,
    },
    events: {
      beforeChange: (selectedOptions, oldSelectedOptions): boolean => {
        return selectBeforeChangeFn(
          "language",
          selectedOptions,
          oldSelectedOptions,
        );
      },
      beforeOpen: (): void => {
        adjustScrollposition("language");
      },
    },
  });

  groupSelects["funbox"] = new SlimSelect({
    select:
      ".pageAccount .content .filterButtons .buttonsAndTitle.funbox .select .funboxSelect",
    data: [
      { value: "all", text: "all" },
      { value: "none", text: "no funbox" },
      ...getAllFunboxes().map((funbox) => ({
        value: funbox.name,
        text: funbox.name.replace(/_/g, " "),
        filter: funbox.name,
      })),
    ],
    settings: {
      showSearch: true,
      placeholderText: "select a funbox",
      allowDeselect: true,
      closeOnSelect: false,
    },
    events: {
      beforeChange: (selectedOptions, oldSelectedOptions): boolean => {
        return selectBeforeChangeFn(
          "funbox",
          selectedOptions,
          oldSelectedOptions,
        );
      },
      beforeOpen: (): void => {
        adjustScrollposition("funbox");
      },
    },
  });

  void updateFilterPresets();
  buttonsAppended = true;
}

function tagDropdownUpdate(snapshot: Snapshot): void {
  const tagsSection = qs(
    ".pageAccount .content .filterButtons .buttonsAndTitle.tags",
  );

  if (snapshot.tags.length === 0) {
    tagsSection?.hide();
    if (groupSelects["tags"]) {
      groupSelects["tags"].destroy();
      delete groupSelects["tags"];
    }
    setFilter("tags", "none", true);
  } else {
    tagsSection?.show();

    updateTagsDropdownOptions();

    // Only create SlimSelect if it doesn't exist yet
    if (!groupSelects["tags"]) {
      const selectEl = document.querySelector(
        ".pageAccount .content .filterButtons .buttonsAndTitle.tags .select .tagsSelect",
      );

      if (selectEl) {
        groupSelects["tags"] = new SlimSelect({
          select: selectEl,
          settings: {
            showSearch: true,
            placeholderText: "select a tag",
            allowDeselect: true,
            closeOnSelect: false,
          },
          events: {
            beforeChange: (selectedOptions, oldSelectedOptions): boolean => {
              return selectBeforeChangeFn(
                "tags",
                selectedOptions,
                oldSelectedOptions,
              );
            },
            beforeOpen: (): void => {
              adjustScrollposition("tags");
            },
          },
        });
      }
    }
  }
}

for (const el of qsa(".group.presetFilterButtons .filterBtns")) {
  el.onChild("click", ".filterPresets .delete-filter-preset", (e) => {
    void deleteFilterPreset(
      (e.childTarget as HTMLElement).dataset["id"] as string,
    );
  });
}

function verifyResultFiltersStructure(filterIn: ResultFilters): ResultFilters {
  const filter = mergeWithDefaultFilters(
    sanitize(ResultFiltersSchema.partial().strip(), structuredClone(filterIn)),
  );

  return filter;
}

AuthEvent.subscribe((event) => {
  if (event.type === "snapshotUpdated" && event.data.isInitial) {
    loadTags();
    void load();
  }
});
