// this file should be concatenated at the top of the legacy ts files

import "../styles/index.scss";
import "./firebase";

import * as DB from "./db";
import Config from "./config";
import * as TestStats from "./test/test-stats";
import * as Replay from "./test/replay";
import * as TestTimer from "./test/test-timer";
import * as Result from "./test/result";
import * as TestInput from "./test/test-input";
import "./controllers/account-controller";
import { enable } from "./states/glarses-mode";
import "./test/caps-warning";
import "./popups/support-popup";
import "./popups/contact-popup";
import "./popups/version-popup";
import "./popups/edit-preset-popup";
import "./popups/simple-popups";
import "./controllers/input-controller";
import "./ready";
import "./ui";
import "./pages/about";
import "./popups/pb-tables-popup";
import "./elements/scroll-to-top";
import "./popups/mobile-test-config-popup";
import "./popups/edit-tags-popup";
import "./popups/google-sign-up-popup";
import * as Account from "./pages/account";
import { noGoogleNoMo } from "./controllers/account-controller";

type ExtendedGlobal = typeof globalThis & MonkeyTypes.Global;

const extendedGlobal = global as ExtendedGlobal;

extendedGlobal.snapshot = DB.getSnapshot;

extendedGlobal.config = Config;

extendedGlobal.toggleFilterDebug = Account.toggleFilterDebug;

extendedGlobal.glarsesMode = enable;

extendedGlobal.stats = TestStats.getStats;

extendedGlobal.replay = Replay.getReplayExport;

extendedGlobal.enableTimerDebug = TestTimer.enableTimerDebug;

extendedGlobal.getTimerStats = TestTimer.getTimerStats;

extendedGlobal.toggleUnsmoothedRaw = Result.toggleUnsmoothedRaw;

extendedGlobal.enableSpacingDebug = TestInput.enableSpacingDebug;

extendedGlobal.noGoogleNoMo = noGoogleNoMo;
