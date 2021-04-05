import Config, * as UpdateConfig from "./config";

let filters = {
  blur: {
    value: 0, 
    default: 0
  },
  brightness: {
    value: 1,
    default: 1
  },
  saturate: {
    value: 1,
    default: 1
  },
  contrast: {
    value: 1,
    default: 1
  },
  opacity: {
    value: 1,
    default: 1
  }
}

export function apply() {
  let filterCSS = getCSS();
  $(".customBackground").css({
    filter: filterCSS,
  });
}

function syncSliders(){
  $(".blur").val(filters["blur"].value);
  $(".brightness").val(filters["brightness"].value);
  $(".saturate").val(filters["saturate"].value);
  $(".contrast").val(filters["contrast"].value);
  $(".opacity").val(filters["opacity"].value);
}

$(".blur").on("input", (e) => {
  filters["blur"].value = $(".blur").val();
  $(".blurValue").html(filters["blur"].value);
  apply();
})

$(".brightness").on("input", (e) => {
  filters["brightness"].value = $(".brightness").val();
  $(".brightnessValue").html(filters["brightness"].value);
  apply();
})

$(".saturate").on("input", (e) => {
  filters["saturate"].value = $(".saturate").val();
  $(".saturateValue").html(filters["saturate"].value);
  apply();
})

$(".contrast").on("input", (e) => {
  filters["contrast"].value = $(".contrast").val();
  $(".contrastValue").html(filters["contrast"].value);
  apply();
})

$(".opacity").on("input", (e) => {
  filters["opacity"].value = $(".opacity").val();
  $(".opacityValue").html(filters["opacity"].value);
  apply();
})

$(".customBackgroundFilter .button").click( (e) => {
  let arr = [];
  Object.keys(filters).forEach(filterKey => {
    arr.push(filters[filterKey].value);
  })
  UpdateConfig.setCustomBackgroundFilter(arr, false);
});

export function getCSS(){
  let ret = "";
  Object.keys(filters).forEach((filterKey) => {
    if (filters[filterKey].value != filters[filterKey].default){
      ret += `${filterKey}(${filters[filterKey].value}${filterKey == "blur" ? "rem" : ""}) `
    }
  })
  return ret;
}

export function loadConfig(config){
  filters.blur.value = config[0];
  filters.brightness.value = config[1];
  filters.saturate.value = config[2];
  filters.contrast.value = config[3];
  filters.opacity.value = config[4];
  $(".blurValue").html(config[0]);
  $(".brightnessValue").html(config[1]);
  $(".saturateValue").html(config[2]);
  $(".contrastValue").html(config[3]);
  $(".opacityValue").html(config[4]);
  syncSliders();
}


