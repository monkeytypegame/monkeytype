// checks if we have an internet connection
window.addEventListener('offline', function(e) {alert("No Internet Connection Detected" + "\n" + "Any Changes Made Now May Not Be Saved");});

// if we want to manually check for a connection, we can call this function
function isOnline() {
	var online = navigator.onLine;
    alert("Is online: " + online);
}

