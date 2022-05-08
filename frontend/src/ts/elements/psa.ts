import Ape from "../ape";
import { secondsToString } from "../utils/misc";
import * as Notifications from "./notifications";
import format from "date-fns/format";

function clearMemory(): void {
  window.localStorage.setItem("confirmedPSAs", JSON.stringify([]));
}

function getMemory(): string[] {
  return JSON.parse(window.localStorage.getItem("confirmedPSAs") ?? "[]") ?? [];
}

function setMemory(id: string): void {
  const list = getMemory();
  list.push(id);
  window.localStorage.setItem("confirmedPSAs", JSON.stringify(list));
}

async function getLatest(): Promise<MonkeyTypes.PSA[]> {
  const response = await Ape.psas.get();
  if (response.message === "Server is down for maintenance") {
    Notifications.addBanner(
      "Server is currently under maintenance. <a target= '_blank' href='https://monkeytype.instatus.com/'>Check the status page</a> for more info.",
      -1,
      "bullhorn",
      true
    );
    return [];
  }
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
    if (localmemory.includes(psa._id) && (psa.sticky ?? false) === false) {
      return;
    }

    if (psa.date) {
      const dateObj = new Date(psa.date);
      const diff = psa.date - Date.now();
      const string = secondsToString(
        diff / 1000,
        false,
        false,
        "text",
        false,
        true
      );
      psa.message = psa.message.replace("{dateDifference}", string);
      psa.message = psa.message.replace(
        "{dateNoTime}",
        format(dateObj, "dd MMM yyyy")
      );
      psa.message = psa.message.replace(
        "{date}",
        format(dateObj, "dd MMM yyyy HH:mm")
      );
    }

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
