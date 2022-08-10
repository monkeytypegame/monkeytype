function setMemory(v: string): void {
  window.localStorage.setItem("lastSeenVersion", v);
}

function getMemory(): string {
  return window.localStorage.getItem("lastSeenVersion") ?? "";
}

export async function show(version: string): Promise<void> {
  const memory = await getMemory();
  if (memory === "") {
    setMemory(version);
    return;
  }
  if (memory === version) return;
  caches.keys().then(function (names) {
    for (const name of names) caches.delete(name);
  });
  $("#newVersionIndicator").removeClass("hidden");
  setMemory(version);
}
