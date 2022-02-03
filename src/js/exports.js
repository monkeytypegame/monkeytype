//this file should be concatenated with the legacy js files

//try to keep this list short because we need to eliminate it eventually
global.getuid = Misc.getuid;

//these exports are just for debugging in the browser
global.snapshot = DB.getSnapshot;
global.config = Config;
// global.addnotif = Notifications.add;

global.glarsesMode = toggleGlarses;

global.stats = TestStats.getStats;

global.replay = Replay.getReplayExport;

global.enableTimerDebug = TestTimer.enableTimerDebug;

global.getTimerStats = TestTimer.getTimerStats;

global.toggleUnsmoothedRaw = Result.toggleUnsmoothedRaw;
