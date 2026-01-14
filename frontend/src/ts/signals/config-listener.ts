import { subscribe } from "../observables/config-event";
import { setAds } from "./core";

//populate selected config events to the core signals
//this will get replaced once the config is converted to a signal/store
subscribe(({ key, newValue }) => {
  if (key === "ads") {
    setAds(newValue);
  }
});
