import { getList, getFunbox, getObject } from "./list";
import { FunboxMetadata, FunboxName, FunboxProperty } from "./types";
import { stringToFunboxNames } from "./util";
import { checkCompatibility } from "./validation";

export type { FunboxName, FunboxMetadata, FunboxProperty };
export { checkCompatibility, stringToFunboxNames, getFunbox };

export function getFunboxesFromString(names: string): FunboxMetadata[] {
  return getFunbox(stringToFunboxNames(names));
}

export function getAllFunboxes(): FunboxMetadata[] {
  return getList();
}

export function getFunboxObject(): Record<FunboxName, FunboxMetadata> {
  return getObject();
}
