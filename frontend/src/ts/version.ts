import { envConfig } from "./constants/env-config";

$(document.body).on("click", ".currentVersion", (e) => {
  if (e.shiftKey) {
    alert(envConfig.clientVersion);
  }
});
