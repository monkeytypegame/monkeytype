import { getList, getFunbox } from "./list";
import { FunboxMetadata, FunboxName } from "./types";
import { stringToFunboxNames } from "./util";
import { checkCompatibility } from "./validation";

export type { FunboxName };
export { checkCompatibility, stringToFunboxNames, getFunbox };

export function getFunboxesFromString(names: string): FunboxMetadata[] {
  return getFunbox(stringToFunboxNames(names));
}

export function getAllFunboxes(): FunboxMetadata[] {
  return getList();
}
