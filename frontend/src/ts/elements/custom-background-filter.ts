import * as UpdateConfig from "../config";
import * as Notifications from "./notifications";
import * as ConfigEvent from "../observables/config-event";

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

export function getCSS(): string {
  let ret = "";
  Object.keys(filters).forEach((filterKey) => {
    const key = filterKey as keyof typeof filters;
    if (filters[key].value != filters[key].default) {
      ret += `${filterKey}(${filters[key].value}${
        filterKey == "blur" ? "rem" : ""
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
  $(".customBackground img").css(css);
}

function syncSliders(): void {
  $(".section.customBackgroundFilter .blur input").val(filters["blur"].value);
  $(".section.customBackgroundFilter .brightness input").val(
    filters["brightness"].value
  );
  $(".section.customBackgroundFilter .saturate input").val(
    filters["saturate"].value
  );
  $(".section.customBackgroundFilter .opacity input").val(
    filters["opacity"].value
  );
}

function updateNumbers(): void {
  $(".section.customBackgroundFilter .blur .value").html(
    filters.blur.value.toFixed(1)
  );
  $(".section.customBackgroundFilter .brightness .value").html(
    filters.brightness.value.toFixed(1)
  );
  $(".section.customBackgroundFilter .saturate .value").html(
    filters.saturate.value.toFixed(1)
  );
  $(".section.customBackgroundFilter .opacity .value").html(
    filters.opacity.value.toFixed(1)
  );
}

export function loadConfig(config: number[]): void {
  filters.blur.value = config[0];
  filters.brightness.value = config[1];
  filters.saturate.value = config[2];
  filters.opacity.value = config[3];
  updateNumbers();
  syncSliders();
}

$(".section.customBackgroundFilter .blur input").on("input", () => {
  filters["blur"].value = parseFloat(
    $(".section.customBackgroundFilter .blur input").val() as string
  );
  updateNumbers();
  apply();
});

$(".section.customBackgroundFilter .brightness input").on("input", () => {
  filters["brightness"].value = parseFloat(
    $(".section.customBackgroundFilter .brightness input").val() as string
  );
  updateNumbers();
  apply();
});

$(".section.customBackgroundFilter .saturate input").on("input", () => {
  filters["saturate"].value = parseFloat(
    $(".section.customBackgroundFilter .saturate input").val() as string
  );
  updateNumbers();
  apply();
});

$(".section.customBackgroundFilter .opacity input").on("input", () => {
  filters["opacity"].value = parseFloat(
    $(".section.customBackgroundFilter .opacity input").val() as string
  );
  updateNumbers();
  apply();
});

$(".section.customBackgroundFilter  .save.button").on("click", () => {
  const arr = Object.keys(filters).map(
    (filterKey) => filters[filterKey as keyof typeof filters].value
  ) as MonkeyTypes.CustomBackgroundFilter;
  UpdateConfig.setCustomBackgroundFilter(arr, false);
  Notifications.add("Custom background filters saved", 1);
});

ConfigEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "customBackgroundFilter") {
    loadConfig((eventValue as string[]).map((ev) => parseFloat(ev)));
    apply();
  }
});
