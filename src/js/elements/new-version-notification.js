import * as Notifications from "./notifications";
import * as VersionPopup from "./version-popup";

export async function show(version) {
  const memory = await getMemory();
  if (memory === "") {
    setMemory(version);
    return;
  }
  if (memory === version) return;
  Notifications.add(
    `Version ${version} has been released. Click to view the changelog.`,
    1,
    7,
    "Announcement",
    "code-branch",
    () => {
      VersionPopup.show();
    }
  );
  setMemory(version);
}

function setMemory(v) {
  window.localStorage.setItem("lastSeenVersion", v);
}

function getMemory() {
  return window.localStorage.getItem("lastSeenVersion") ?? "";
}
