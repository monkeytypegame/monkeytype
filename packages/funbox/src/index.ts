import { getList, getObject } from "./list";
import { FunboxMetadata, FunboxName } from "./types";
import { stringToFunboxNames } from "./util";

export function getByHashSeparatedString(names: string): FunboxMetadata[] {
  return getFunbox(stringToFunboxNames(names));
}

export function getFunbox(name: FunboxName): FunboxMetadata;
export function getFunbox(names: FunboxName[]): FunboxMetadata[];
export function getFunbox(
  nameOrNames: FunboxName | FunboxName[]
): FunboxMetadata | FunboxMetadata[] {
  if (Array.isArray(nameOrNames)) {
    const out = nameOrNames.map((name) => getObject()[name]);

    //@ts-expect-error
    if (out.includes(undefined)) {
      throw new Error("One of the funboxes is invalid: " + nameOrNames);
    }

    return out;
  } else {
    const out = getObject()[nameOrNames];

    if (out === undefined) {
      throw new Error("Invalid funbox name: " + nameOrNames);
    }

    return out;
  }
}

export function getAllFunboxes(): FunboxMetadata[] {
  return getList();
}
