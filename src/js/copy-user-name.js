import * as Notifications from "./notifications";

function copyUserName() {
    if (true) {
        navigator.clipboard.writeText("Miodec#1512");
        Notifications.add("Copied To Clipboard!", 0);
    } else {
        Notifications.add("Unable to copy user name", 0);
    }
}

