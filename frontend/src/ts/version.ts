export const CLIENT_VERSION = "DEVELOPMENT-CLIENT";

$(document.body).on("click", ".currentVersion", (e) => {
  if (e.shiftKey) {
    alert(CLIENT_VERSION);
  }
});
