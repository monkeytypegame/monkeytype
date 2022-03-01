// @ts-ignore
import Chart from "chart.js";
// @ts-ignore
import chartTrendline from "chartjs-plugin-trendline";
// @ts-ignore
import chartAnnotation from "chartjs-plugin-annotation";

import firebase from "firebase";

fetch("/__/firebase/init.json")
  .then(async (res) => firebase.initializeApp(await res.json()))
  .finally(async () => {
    import("./controllers/account-controller");
    import("./test/caps-warning");
    import("./popups/support-popup");
    import("./popups/contact-popup");
    import("./popups/version-popup");
    import("./popups/edit-preset-popup");
    import("./popups/simple-popups");
    import("./controllers/input-controller");
    import("./ready");
    import("./ui");
    import("./pages/about");
    import("./popups/pb-tables-popup");
    import("./elements/scroll-to-top");
    import("./popups/mobile-test-config-popup");
    import("./popups/edit-tags-popup");

    const DB = await import("./db");
    const Config = (await import("./config")).default;
    const TestStats = await import("./test/test-stats");
    const Replay = await import("./test/replay");
    const TestTimer = await import("./test/test-timer");
    const Result = await import("./test/result");
    const TestInput = await import("./test/test-input");
    const { enable } = await import("./states/glarses-mode");
    const Account = await import("./pages/account");

    Chart.plugins.register(chartTrendline);
    Chart.plugins.register(chartAnnotation);

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
  });
