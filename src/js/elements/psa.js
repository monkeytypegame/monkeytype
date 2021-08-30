import axiosInstance from "./axios-instance";
import * as Notifications from "./notifications";

async function getLatest() {
  let psa = await axiosInstance.get("/psa");
  return psa.data;
}

export async function show() {
  const latest = await getLatest();
  if (latest == null || latest.length == 0) {
    clearMemory();
    return;
  }
  let localmemory = getMemory();
  latest.forEach((psa) => {
    if (localmemory.includes(psa._id)) return;
    Notifications.add(psa.message, -1, 0, "Announcement", "bullhorn", () => {
      setMemory(psa._id);
    });
  });
}

function setMemory(id) {
  let list = getMemory();
  list.push(id);
  window.localStorage.setItem("confirmedPSAs", JSON.stringify(list));
}

function clearMemory() {
  window.localStorage.setItem("confirmedPSAs", JSON.stringify([]));
}

function getMemory() {
  return JSON.parse(window.localStorage.getItem("confirmedPSAs")) ?? [];
}
