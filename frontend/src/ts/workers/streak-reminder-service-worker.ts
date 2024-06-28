/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { Message } from "./streak-reminder";

const sw = self as unknown as ServiceWorkerGlobalScope & typeof globalThis;

sw.addEventListener("install", (event) => {
  console.log("#### init worker", event);
});

sw.addEventListener("message", async (event) => {
  const data = event.data as Message;
  console.log("#### message ", event.data);
  if (data.type === "init") {
    console.log("#### init2", data);
  }
  if (data.type === "test") {
    await sw.registration.showNotification("Streak Reminder", {
      body: "Your streak will be lost in <2 hours. Why not hop on monkeytype.com and do a test?",
      icon: "/images/icons/general_icon_x512.png",
    });
  }
});
