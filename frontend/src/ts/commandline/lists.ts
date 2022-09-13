import * as ConfigEvent from "../observables/config-event";

import DefaultCommands from "./lists/default";

export let current: MonkeyTypes.CommandsGroup[] = [];

current = [DefaultCommands];

export function setCurrent(val: MonkeyTypes.CommandsGroup[]): void {
  current = val;
}

export function pushCurrent(val: MonkeyTypes.CommandsGroup): void {
  current.push(val);
}

ConfigEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "saveToLocalStorage") {
    DefaultCommands.list.filter(
      (command) => command.id == "exportSettingsJSON"
    )[0].defaultValue = eventValue as string;
  }
  if (eventKey === "customBackground") {
    DefaultCommands.list.filter(
      (command) => command.id == "changeCustomBackground"
    )[0].defaultValue = eventValue as string;
  }
  if (eventKey === "fontSize") {
    DefaultCommands.list.filter(
      (command) => command.id == "changeFontSize"
    )[0].defaultValue = eventValue as string;
  }
  if (eventKey === "customLayoutFluid") {
    DefaultCommands.list.filter(
      (command) => command.id == "changeCustomLayoutfluid"
    )[0].defaultValue = (eventValue as string)?.replace(/#/g, " ");
  }
});
