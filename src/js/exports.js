//this file should be concatenated with the legacy js files

//try to keep this list short because we need to eliminate it eventually
global.simplePopups = SimplePopups.simplePopups;
global.sendVerificationEmail = Misc.sendVerificationEmail;
global.getuid = Misc.getuid;

//these exports are just for debugging in the browser
global.snapshot = DB.getSnapshot;
global.config = Config;
// global.addnotif = Notifications.add;
global.linkToGoogle = AccountController.linkWithGoogle;
global.unlinkGoogle = AccountController.unlinkGoogle;
global.linkToEmail = AccountController.linkWithEmail;

global.filters = ResultFilters.getFilters();

global.glarsesMode = toggleGlarses;

global.filterDebug = Account.toggleFilterDebug;

global.stats = TestStats.getStats;

global.replay = Replay.getReplayExport;
