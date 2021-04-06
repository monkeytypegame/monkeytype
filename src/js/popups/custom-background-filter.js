import * as UpdateConfig from "./config";

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
  $(".customBackground").css({
    filter: filterCSS,
  });
}

function syncSliders() {
  $(".blur").val(filters["blur"].value);
  $(".brightness").val(filters["brightness"].value);
  $(".saturate").val(filters["saturate"].value);
  $(".opacity").val(filters["opacity"].value);
}

$(".blur").on("input", (e) => {
  filters["blur"].value = $(".blur").val();
  updateNumbers();
  apply();
});

$(".brightness").on("input", (e) => {
  filters["brightness"].value = $(".brightness").val();
  updateNumbers();
  apply();
});

$(".saturate").on("input", (e) => {
  filters["saturate"].value = $(".saturate").val();
  updateNumbers();
  apply();
});

$(".opacity").on("input", (e) => {
  filters["opacity"].value = $(".opacity").val();
  updateNumbers();
  apply();
});

$(".customBackgroundFilter .button").click((e) => {
  let arr = [];
  Object.keys(filters).forEach((filterKey) => {
    arr.push(filters[filterKey].value);
  });
  UpdateConfig.setCustomBackgroundFilter(arr, false);
});

export function loadConfig(config) {
  filters.blur.value = config[0];
  filters.brightness.value = config[1];
  filters.saturate.value = config[2];
  filters.opacity.value = config[3];
  updateNumbers();
  syncSliders();
}

function updateNumbers() {
  $(".blurValue").html(parseFloat(filters.blur.value).toFixed(1));
  $(".brightnessValue").html(parseFloat(filters.brightness.value).toFixed(1));
  $(".saturateValue").html(parseFloat(filters.saturate.value).toFixed(1));
  $(".opacityValue").html(parseFloat(filters.opacity.value).toFixed(1));
}
