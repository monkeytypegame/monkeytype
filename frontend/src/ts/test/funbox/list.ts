import {
  FunboxMetadata,
  getFunboxObject,
  FunboxProperty,
} from "@monkeytype/funbox";

import { FunboxFunctions, getFunboxFunctions } from "./funbox-functions";
import { FunboxName } from "@monkeytype/schemas/configs";
import {
  getActiveFunboxNames,
  isFunboxActive,
  isFunboxActiveWithProperty,
} from "./active";

export { getActiveFunboxNames, isFunboxActive, isFunboxActiveWithProperty };

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
  funboxNameOrNames: FunboxName | FunboxName[],
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

export function getActiveFunboxes(): FunboxMetadataWithFunctions[] {
  return get(getActiveFunboxNames());
}

/**
 * Get all active funboxes defining the given property
 * @param property
 * @returns list of matching funboxes, empty list if none matching
 */
export function getActiveFunboxesWithProperty(
  property: FunboxProperty,
): FunboxMetadataWithFunctions[] {
  return getActiveFunboxes().filter((fb) => fb.properties?.includes(property));
}

/**
 * Find a single active funbox defining the given property
 * @param property
 * @returns the active funbox if any, `undefined`  otherwise.
 * @throws Error if there are multiple funboxes defining the given property
 */
export function findSingleActiveFunboxWithProperty(
  property: FunboxProperty,
): FunboxMetadataWithFunctions | undefined {
  const matching = getActiveFunboxesWithProperty(property);
  if (matching.length === 0) return undefined;
  if (matching.length === 1) return matching[0];
  throw new Error(
    `Expecting exactly one funbox with property "${property} but found ${matching.length}`,
  );
}

type MandatoryFunboxFunction<F extends keyof FunboxFunctions> = Exclude<
  FunboxFunctions[F],
  undefined
>;
type FunboxWithFunction<F extends keyof FunboxFunctions> =
  FunboxMetadataWithFunctions & {
    functions: Record<F, MandatoryFunboxFunction<F>>;
  };

/**
 * Get all active funboxes implementing the given function
 * @param functionName function name
 * @returns list of matching funboxes, empty list if none matching
 */
export function getActiveFunboxesWithFunction<F extends keyof FunboxFunctions>(
  functionName: F,
): FunboxWithFunction<F>[] {
  return getActiveFunboxes().filter(
    (fb) => fb.functions?.[functionName] !== undefined,
  ) as FunboxWithFunction<F>[];
}

/**
 * Check if there is an active funbox implementing the given function
 * @param functionName function name
 * @returns
 */
export function isFunboxActiveWithFunction(
  functionName: keyof FunboxFunctions,
): boolean {
  return getActiveFunboxesWithFunction(functionName).length > 0;
}

/**
 * Find a single active funbox implementing the given function name
 * @param functionName
 * @returns the active funbox if any, `undefined`  otherwise.
 * @throws Error if there are multiple funboxes implementing the function name
 */
export function findSingleActiveFunboxWithFunction<
  F extends keyof FunboxFunctions,
>(functionName: F): FunboxWithFunction<F> | undefined {
  const matching = getActiveFunboxesWithFunction(functionName);
  if (matching.length === 0) return undefined;
  if (matching.length === 1) return matching[0];
  throw new Error(
    `Expecting exactly one funbox implementing "${functionName} but found ${matching.length}`,
  );
}
