//this file should be concatenated with the legacy js files

//try to keep this list short because we need to eliminate it eventually
global.simplePopups = SimplePopups.simplePopups;
global.sendVerificationEmail = Misc.sendVerificationEmail;
global.getuid = Misc.getuid;

//these exports are just for debugging in the browser
global.snapshot = DB.getSnapshot;
global.config = Config;
// global.addnotif = Notifications.add;
global.link = AccountController.linkWithGoogle;

global.filters = ResultFilters.filters;
