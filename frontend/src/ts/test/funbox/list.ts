import Config from "../../config";
import {
  FunboxName,
  stringToFunboxNames,
  FunboxMetadata,
  getFunboxObject,
  FunboxProperty,
} from "@monkeytype/funbox";

import { FunboxFunctions, getFunboxFunctions } from "./funbox-functions";

type FunboxMetadataWithFunctions = FunboxMetadata & {
  functions?: FunboxFunctions;
};

const metadata = getFunboxObject();
const functions = getFunboxFunctions();

const metadataWithFunctions = {} as Record<
  FunboxName,
  FunboxMetadataWithFunctions
>;

for (const [name, data] of Object.entries(metadata)) {
  metadataWithFunctions[name as FunboxName] = {
    ...data,
    functions: functions[name as FunboxName],
  };
}

export function get(funboxName: FunboxName): FunboxMetadataWithFunctions;
export function get(funboxNames: FunboxName[]): FunboxMetadataWithFunctions[];
export function get(
  funboxNameOrNames: FunboxName | FunboxName[]
): FunboxMetadataWithFunctions | FunboxMetadataWithFunctions[] {
  if (Array.isArray(funboxNameOrNames)) {
    const fns = funboxNameOrNames.map((name) => metadataWithFunctions[name]);
    return fns;
  } else {
    return metadataWithFunctions[funboxNameOrNames];
  }
}

export function getAllFunboxes(): FunboxMetadataWithFunctions[] {
  return Object.values(metadataWithFunctions);
}

export function getFromString(
  hashSeparatedFunboxes: string
): FunboxMetadataWithFunctions[] {
  return get(stringToFunboxNames(hashSeparatedFunboxes));
}

export function getActiveFunboxes(): FunboxMetadataWithFunctions[] {
  return get(stringToFunboxNames(Config.funbox));
}

export function getActiveFunboxNames(): FunboxName[] {
  return stringToFunboxNames(Config.funbox);
}

export function getActiveFunboxesWithProperty(
  property: FunboxProperty
): FunboxMetadataWithFunctions[] {
  return getActiveFunboxes().filter((fb) => fb.properties?.includes(property));
}

export function getActiveFunboxesWithFunction(
  functionName: keyof FunboxFunctions
): FunboxMetadataWithFunctions[] {
  return getActiveFunboxes().filter((fb) => fb.functions?.[functionName]);
}

/**
 * Get requested, implemented functions from all active funboxes
 * @param functionName name of the function
 * @returns array of each implemented requested function of all active funboxes
 */
export function getFunctionsFromActiveFunboxes<F extends keyof FunboxFunctions>(
  functionName: F
): Exclude<FunboxFunctions[F], undefined>[] {
  return getActiveFunboxes()
    .map((it) => it.functions?.[functionName])
    .filter((it) => it !== undefined) as Exclude<
    FunboxFunctions[F],
    undefined
  >[];
}

/**
 * Check if there is an active funbox with the given property name
 * @param property property name
 * @returns
 */
export function hasActiveFunboxWithProperty(property: FunboxProperty): boolean {
  return getActiveFunboxesWithProperty(property).length > 0;
}

/**
 * Check if there is an active funbox implemenging the given function
 * @param functionName function name
 * @returns
 */
export function hasActiveFunboxWithFunction(
  functionName: keyof FunboxFunctions
): boolean {
  return getActiveFunboxesWithFunction(functionName).length > 0;
}
