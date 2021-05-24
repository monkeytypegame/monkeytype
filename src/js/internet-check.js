import * as Notifications from "src/js/elements/notifications.js";

// checks if we have an internet connection
window.addEventListener("offline", function (e) {
  Notifications.add(
    "No Internet Connection Detected\nAny Changes Made Now May Not Be Saved",
    1
  );
});

// if we want to manually check for a connection, we can call this function
function isOnline() {
  var online = navigator.onLine;
  Notifications.add(`Is online: ${online}`, 1);
}
