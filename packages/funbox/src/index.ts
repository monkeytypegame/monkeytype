import { FunboxName } from "@monkeytype/contracts/schemas/configs";
import { getList, getFunbox, getObject, getFunboxNames } from "./list";
import { FunboxMetadata, FunboxProperty } from "./types";
import { checkCompatibility } from "./validation";

export type { FunboxMetadata, FunboxProperty };
export { checkCompatibility, getFunbox, getFunboxNames };

export function getAllFunboxes(): FunboxMetadata[] {
  return getList();
}

export function getFunboxObject(): Record<FunboxName, FunboxMetadata> {
  return getObject();
}
