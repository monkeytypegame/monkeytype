import Ape from "../ape";
import { isDevEnvironment } from "../utils/misc";
import { secondsToString } from "../utils/date-and-time";
import * as Notifications from "./notifications";
import { format } from "date-fns/format";
import * as Alerts from "./alerts";

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

async function getLatest(): Promise<SharedTypes.PSA[] | null> {
  const response = await Ape.psas.get();

  if (response.status === 500) {
    if (isDevEnvironment()) {
      Notifications.addPSA(
        "Dev Info: Backend server not running",
        0,
        "exclamation-triangle",
        false
      );
    } else {
      Notifications.addPSA(
        "Looks like the server is experiencing maintenance or some unexpected down time.<br>Check the <a target= '_blank' href='https://monkeytype.instatus.com/'>status page</a> or <a target= '_blank' href='https://twitter.com/monkeytypegame'>Twitter</a> for more information.",
        -1,
        "exclamation-triangle",
        false,
        undefined,
        true
      );
    }

    return null;
  } else if (response.status === 503) {
    Notifications.addPSA(
      "Server is currently under maintenance. <a target= '_blank' href='https://monkeytype.instatus.com/'>Check the status page</a> for more info.",
      -1,
      "bullhorn",
      true,
      undefined,
      true
    );
    return null;
  } else if (response.status !== 200) {
    return null;
  }
  return response.data;
}

export async function show(): Promise<void> {
  const latest = await getLatest();
  if (latest === null) return;
  if (latest.length === 0) {
    clearMemory();
    return;
  }
  const localmemory = getMemory();
  latest.forEach((psa) => {
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

    Alerts.addPSA(psa.message, psa.level ?? -1);

    if (localmemory.includes(psa._id) && !(psa.sticky ?? false)) {
      return;
    }

    Notifications.addPSA(
      psa.message,
      psa.level,
      "bullhorn",
      psa.sticky,
      () => {
        setMemory(psa._id);
      },
      true
    );
  });
}
