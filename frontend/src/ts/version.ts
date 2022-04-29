export const CLIENT_VERSION = "DEVELOPMENT-CLIENT";

$(document.body).on("click", ".version", (e) => {
  if (e.shiftKey) {
    alert(CLIENT_VERSION);
  }
});
