import { debounce } from "throttle-debounce";
import * as UpdateConfig from "../config";
import * as ConfigEvent from "../observables/config-event";
import { SoundVolume } from "@monkeytype/contracts/schemas/configs";

let volume: number = 0.5;

function syncSlider(): void {
  $(".section[data-config-name='soundVolume'] .volume input").val(volume);
}
function syncNumber(): void {
  $(".section[data-config-name='soundVolume'] .volume .value").html(
    (volume * 100).toFixed(0)
  );
}

export function update(): void {
  syncSlider();
  syncNumber();
}

$(`.pageSettings .section[data-config-name='soundVolume'] .volume input`).on(
  "input",
  () => {
    volume = parseFloat(
      $(
        ".section[data-config-name='soundVolume'] .volume input"
      ).val() as string
    );
    syncSlider();
    syncNumber();
  }
);

$(".section[data-config-name='soundVolume'] .volume input").on("input", () => {
  void debouncedSave();
});

const debouncedSave = debounce(100, async () => {
  UpdateConfig.setSoundVolume(volume, false);
});

ConfigEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "soundVolume" && (eventValue as boolean)) {
    volume = eventValue as SoundVolume;
  }
});
