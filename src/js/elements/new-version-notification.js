import * as Notifications from "./notifications";
import * as VersionPopup from "./version-popup";

function setMemory(v) {
  window.localStorage.setItem("lastSeenVersion", v);
}

function getMemory() {
  return window.localStorage.getItem("lastSeenVersion") ?? "";
}

export async function show(version) {
  const memory = await getMemory();
  if (memory === "") {
    setMemory(version);
    return;
  }
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    caches.delete('sw-cache');
  }
  if (memory === version) return;
  caches.delete('sw-cache');
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
