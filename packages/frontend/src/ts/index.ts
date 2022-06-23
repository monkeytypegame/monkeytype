import "../styles/index.scss";
import "./firebase";

import MonkeyTypes from "@monkeytype/types";
import Config from "./config";
import "./controllers/account-controller";
import "./controllers/input-controller";
import * as DB from "./db";
import "./elements/leaderboards";
import "./elements/scroll-to-top";
import "./pages/about";
import * as Account from "./pages/account";
import "./popups/contact-popup";
import "./popups/edit-preset-popup";
import "./popups/edit-tags-popup";
import "./popups/google-sign-up-popup";
import "./popups/mobile-test-config-popup";
import "./popups/pb-tables-popup";
import "./popups/simple-popups";
import "./popups/support-popup";
import "./popups/version-popup";
import "./ready";
import { enable } from "./states/glarses-mode";
import "./test/caps-warning";
import * as Replay from "./test/replay";
import * as Result from "./test/result";
import * as TestInput from "./test/test-input";
import * as TestStats from "./test/test-stats";
import * as TestTimer from "./test/test-timer";
import "./ui";

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
