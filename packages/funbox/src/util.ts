import { getList } from "./list";
import { FunboxName } from "./types";

export function stringToFunboxNames(names: string): FunboxName[] {
  if (names === "none" || names === "") return [];
  const unsafeNames = names.split("#").map((name) => name.trim());
  const out: FunboxName[] = [];
  const list = getList().map((f) => f.name);
  for (const unsafeName of unsafeNames) {
    if (list.includes(unsafeName as FunboxName)) {
      out.push(unsafeName as FunboxName);
    } else {
      throw new Error("Invalid funbox name: " + unsafeName);
    }
  }
  return out;
}
