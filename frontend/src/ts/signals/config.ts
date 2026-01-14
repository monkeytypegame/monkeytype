import { createSignal } from "solid-js";
import { subscribe } from "../observables/config-event";
import { Ads } from "@monkeytype/schemas/configs";

export const [getAds, setAds] = createSignal<Ads>("off");

//populate selected config events to the core signals
//this will get replaced once the config is converted to a signal/store
subscribe(({ key, newValue }) => {
  if (key === "ads") {
    setAds(newValue);
  }
});
