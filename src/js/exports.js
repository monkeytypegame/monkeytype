//this file should be concatenated with the legacy js files

//try to keep this list short because we need to eliminate it eventually
global.simplePopups = simplePopups;
global.sendVerificationEmail = Misc.sendVerificationEmail;

//these exports are just for debugging in the browser
global.snapshot = db_getSnapshot;
global.config = config;
