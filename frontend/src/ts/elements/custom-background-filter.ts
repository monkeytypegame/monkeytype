import { CustomBackgroundFilter } from "@monkeytype/schemas/configs";
import { setConfig } from "../config";
import * as ConfigEvent from "../observables/config-event";
import { debounce } from "throttle-debounce";
import { qs, qsr } from "../utils/dom";

const section = qsr(
  ".pageSettings .section[data-config-name='customBackgroundFilter']",
);

const filters = {
  blur: {
    value: 0,
    default: 0,
  },
  brightness: {
    value: 1,
    default: 1,
  },
  saturate: {
    value: 1,
    default: 1,
  },
  opacity: {
    value: 1,
    default: 1,
  },
};

function getCSS(): string {
  let ret = "";
  Object.keys(filters).forEach((filterKey) => {
    const key = filterKey as keyof typeof filters;
    if (filters[key].value !== filters[key].default) {
      ret += `${filterKey}(${filters[key].value}${
        filterKey === "blur" ? "rem" : ""
      }) `;
    }
  });
  return ret;
}

export function apply(): void {
  const filterCSS = getCSS();
  const css = {
    filter: filterCSS,
    width: `calc(100% + ${filters.blur.value * 4}rem)`,
    height: `calc(100% + ${filters.blur.value * 4}rem)`,
    left: `-${filters.blur.value * 2}rem`,
    top: `-${filters.blur.value * 2}rem`,
    position: "absolute",
  };
  qs(".customBackground img")?.setStyle(css);
}

function syncSliders(): void {
  section
    .qs<HTMLInputElement>(".blur input")
    ?.setValue(filters.blur.value.toString());
  section
    .qs<HTMLInputElement>(".brightness input")
    ?.setValue(filters.brightness.value.toString());
  section
    .qs<HTMLInputElement>(".saturate input")
    ?.setValue(filters.saturate.value.toString());
  section
    .qs<HTMLInputElement>(".opacity input")
    ?.setValue(filters.opacity.value.toString());
}

function updateNumbers(): void {
  section.qs(".blur .value")?.setHtml(filters.blur.value.toFixed(1));
  section
    .qs(".brightness .value")
    ?.setHtml(filters.brightness.value.toFixed(1));
  section.qs(".saturate .value")?.setHtml(filters.saturate.value.toFixed(1));
  section.qs(".opacity .value")?.setHtml(filters.opacity.value.toFixed(1));
}

export function updateUI(): void {
  syncSliders();
  updateNumbers();
}

function loadConfig(config: CustomBackgroundFilter): void {
  filters.blur.value = config[0];
  filters.brightness.value = config[1];
  filters.saturate.value = config[2];
  filters.opacity.value = config[3];
  updateUI();
}

section.qs(".blur input")?.on("input", () => {
  filters.blur.value = parseFloat(
    section.qs<HTMLInputElement>(".blur input")?.getValue() ?? "0",
  );
  updateNumbers();
  apply();
});

section.qs(".brightness input")?.on("input", () => {
  filters.brightness.value = parseFloat(
    section.qs<HTMLInputElement>(".brightness input")?.getValue() ?? "1",
  );
  updateNumbers();
  apply();
});

section.qs(".saturate input")?.on("input", () => {
  filters.saturate.value = parseFloat(
    section.qs<HTMLInputElement>(".saturate input")?.getValue() ?? "1",
  );
  updateNumbers();
  apply();
});

section.qs(".opacity input")?.on("input", () => {
  filters.opacity.value = parseFloat(
    section.qs<HTMLInputElement>(".opacity input")?.getValue() ?? "1",
  );
  updateNumbers();
  apply();
});

section.qsa("input")?.on("input", () => {
  debouncedSave();
});

const debouncedSave = debounce(2000, async () => {
  const arr = Object.keys(filters).map(
    (filterKey) => filters[filterKey as keyof typeof filters].value,
  ) as CustomBackgroundFilter;
  setConfig("customBackgroundFilter", arr, false);
});

ConfigEvent.subscribe(({ key, newValue }) => {
  if (key === "customBackgroundFilter") {
    loadConfig(newValue);
    apply();
  }
});
