import { CustomBackgroundFilter } from "@monkeytype/contracts/schemas/configs";
import * as UpdateConfig from "../config";
import * as ConfigEvent from "../observables/config-event";
import { debounce } from "throttle-debounce";

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
  $(".customBackground img").css(css);
}

function syncSliders(): void {
  $(".section[data-config-name='customBackgroundFilter'] .blur input").val(
    filters.blur.value
  );
  $(
    ".section[data-config-name='customBackgroundFilter'] .brightness input"
  ).val(filters.brightness.value);
  $(".section[data-config-name='customBackgroundFilter'] .saturate input").val(
    filters.saturate.value
  );
  $(".section[data-config-name='customBackgroundFilter'] .opacity input").val(
    filters.opacity.value
  );
}

function updateNumbers(): void {
  $(".section[data-config-name='customBackgroundFilter'] .blur .value").html(
    filters.blur.value.toFixed(1)
  );
  $(
    ".section[data-config-name='customBackgroundFilter'] .brightness .value"
  ).html(filters.brightness.value.toFixed(1));
  $(
    ".section[data-config-name='customBackgroundFilter'] .saturate .value"
  ).html(filters.saturate.value.toFixed(1));
  $(".section[data-config-name='customBackgroundFilter'] .opacity .value").html(
    filters.opacity.value.toFixed(1)
  );
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

$(".section[data-config-name='customBackgroundFilter'] .blur input").on(
  "input",
  () => {
    filters.blur.value = parseFloat(
      $(
        ".section[data-config-name='customBackgroundFilter'] .blur input"
      ).val() as string
    );
    updateNumbers();
    apply();
  }
);

$(".section[data-config-name='customBackgroundFilter'] .brightness input").on(
  "input",
  () => {
    filters.brightness.value = parseFloat(
      $(
        ".section[data-config-name='customBackgroundFilter'] .brightness input"
      ).val() as string
    );
    updateNumbers();
    apply();
  }
);

$(".section[data-config-name='customBackgroundFilter'] .saturate input").on(
  "input",
  () => {
    filters.saturate.value = parseFloat(
      $(
        ".section[data-config-name='customBackgroundFilter'] .saturate input"
      ).val() as string
    );
    updateNumbers();
    apply();
  }
);

$(".section[data-config-name='customBackgroundFilter'] .opacity input").on(
  "input",
  () => {
    filters.opacity.value = parseFloat(
      $(
        ".section[data-config-name='customBackgroundFilter'] .opacity input"
      ).val() as string
    );
    updateNumbers();
    apply();
  }
);

$(".section[data-config-name='customBackgroundFilter'] input").on(
  "input",
  () => {
    void debouncedSave();
  }
);

const debouncedSave = debounce(2000, async () => {
  const arr = Object.keys(filters).map(
    (filterKey) => filters[filterKey as keyof typeof filters].value
  ) as CustomBackgroundFilter;
  UpdateConfig.setCustomBackgroundFilter(arr, false);
});

ConfigEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "customBackgroundFilter" && (eventValue as boolean)) {
    loadConfig(eventValue as CustomBackgroundFilter);
    apply();
  }
});
