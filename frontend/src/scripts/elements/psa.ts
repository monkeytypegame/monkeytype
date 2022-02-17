import Ape from "../ape";
import * as Notifications from "./notifications";

function clearMemory(): void {
  window.localStorage.setItem("confirmedPSAs", JSON.stringify([]));
}

function getMemory(): string[] {
  return JSON.parse(window.localStorage.getItem("confirmedPSAs") ?? "") ?? [];
}

function setMemory(id: string): void {
  const list = getMemory();
  list.push(id);
  window.localStorage.setItem("confirmedPSAs", JSON.stringify(list));
}

async function getLatest(): Promise<MonkeyTypes.PSA[]> {
  const response = await Ape.psas.get();
  return response.data as MonkeyTypes.PSA[];
}

export async function show(): Promise<void> {
  const latest = await getLatest();
  if (latest == null || latest.length == 0) {
    clearMemory();
    return;
  }
  const localmemory = getMemory();
  latest.forEach((psa) => {
    if (localmemory.includes(psa._id) && psa.sticky === false) return;
    Notifications.addBanner(
      psa.message,
      psa.level,
      "bullhorn",
      psa.sticky,
      () => {
        setMemory(psa._id);
      }
    );
  });
}
