import * as UpdateConfig from "../config";
import * as Notifications from "./notifications";

let filters = {
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

export function getCSS() {
  let ret = "";
  Object.keys(filters).forEach((filterKey) => {
    if (filters[filterKey].value != filters[filterKey].default) {
      ret += `${filterKey}(${filters[filterKey].value}${
        filterKey == "blur" ? "rem" : ""
      }) `;
    }
  });
  return ret;
}

export function apply() {
  let filterCSS = getCSS();
  let css = {
    filter: filterCSS,
    width: `calc(100% + ${filters.blur.value * 4}rem)`,
    height: `calc(100% + ${filters.blur.value * 4}rem)`,
    left: `-${filters.blur.value * 2}rem`,
    top: `-${filters.blur.value * 2}rem`,
    position: "absolute",
  };
  $(".customBackground img").css(css);
}

function syncSliders() {
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

function updateNumbers() {
  $(".section.customBackgroundFilter .blur .value").html(
    parseFloat(filters.blur.value).toFixed(1)
  );
  $(".section.customBackgroundFilter .brightness .value").html(
    parseFloat(filters.brightness.value).toFixed(1)
  );
  $(".section.customBackgroundFilter .saturate .value").html(
    parseFloat(filters.saturate.value).toFixed(1)
  );
  $(".section.customBackgroundFilter .opacity .value").html(
    parseFloat(filters.opacity.value).toFixed(1)
  );
}

export function loadConfig(config) {
  filters.blur.value = config[0];
  filters.brightness.value = config[1];
  filters.saturate.value = config[2];
  filters.opacity.value = config[3];
  updateNumbers();
  syncSliders();
}

$(".section.customBackgroundFilter .blur input").on("input", (e) => {
  filters["blur"].value = $(
    ".section.customBackgroundFilter .blur input"
  ).val();
  updateNumbers();
  apply();
});

$(".section.customBackgroundFilter .brightness input").on("input", (e) => {
  filters["brightness"].value = $(
    ".section.customBackgroundFilter .brightness input"
  ).val();
  updateNumbers();
  apply();
});

$(".section.customBackgroundFilter .saturate input").on("input", (e) => {
  filters["saturate"].value = $(
    ".section.customBackgroundFilter .saturate input"
  ).val();
  updateNumbers();
  apply();
});

$(".section.customBackgroundFilter .opacity input").on("input", (e) => {
  filters["opacity"].value = $(
    ".section.customBackgroundFilter .opacity input"
  ).val();
  updateNumbers();
  apply();
});

$(".section.customBackgroundFilter  .save.button").click((e) => {
  let arr = [];
  Object.keys(filters).forEach((filterKey) => {
    arr.push(filters[filterKey].value);
  });
  UpdateConfig.setCustomBackgroundFilter(arr, false);
  Notifications.add("Custom background filters saved", 1);
});

$(document).ready(() => {
  UpdateConfig.subscribeToEvent((eventKey, eventValue) => {
    if (eventKey === "customBackgroundFilter") {
      loadConfig(eventValue);
      apply();
    }
  });
});
