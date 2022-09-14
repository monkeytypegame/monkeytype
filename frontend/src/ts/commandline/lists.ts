import * as ConfigEvent from "../observables/config-event";

import Commands, * as Lists from "./lists/index";

export let current: MonkeyTypes.CommandsGroup[] = [];

current = [Commands];

export type ListsObjectKeys = keyof typeof Lists;

export function setCurrent(val: ListsObjectKeys): void {
  current = [Lists[val]];
}

export function pushCurrent(val: ListsObjectKeys): void {
  current.push(Lists[val]);
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
