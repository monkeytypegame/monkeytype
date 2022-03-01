// @ts-ignore
import Chart from "chart.js";
// @ts-ignore
import chartTrendline from "chartjs-plugin-trendline";
// @ts-ignore
import chartAnnotation from "chartjs-plugin-annotation";

Chart.plugins.register(chartTrendline);
Chart.plugins.register(chartAnnotation);

import firebase from "firebase";

fetch("/__/firebase/init.json")
  .then(async (res) => firebase.initializeApp(await res.json()))
  .then(() => {
    console.log("firebase initialized");

    type ExtendedGlobal = typeof globalThis & MonkeyTypes.Global;

    const extendedGlobal = global as ExtendedGlobal;

    import("./controllers/account-controller").then(() => {
      console.log("imported account-controller");
    });

    import("./test/caps-warning").then(() => {
      console.log("imported caps-warning");
    });

    import("./popups/support-popup").then(() => {
      console.log("imported support-popup");
    });

    import("./popups/contact-popup").then(() => {
      console.log("imported contact-popup");
    });

    import("./popups/version-popup").then(() => {
      console.log("imported version-popup");
    });

    import("./popups/edit-preset-popup").then(() => {
      console.log("imported edit-preset-popup");
    });

    import("./popups/simple-popups").then(() => {
      console.log("imported simple-popups");
    });

    import("./controllers/input-controller").then(() => {
      console.log("imported input-controller");
    });

    import("./ready").then(() => {
      console.log("imported ready");
    });

    import("./ui").then(() => {
      console.log("imported ui");
    });

    import("./pages/about").then(() => {
      console.log("imported about");
    });

    import("./popups/pb-tables-popup").then(() => {
      console.log("imported pb-tables-popup");
    });

    import("./elements/scroll-to-top").then(() => {
      console.log("imported scroll-to-top");
    });

    import("./popups/mobile-test-config-popup").then(() => {
      console.log("imported mobile-test-config-popup");
    });

    import("./popups/edit-tags-popup").then(() => {
      console.log("imported edit-tags-popup");
    });

    import("./db").then((DB) => {
      extendedGlobal.snapshot = DB.getSnapshot;
    });

    import("./config").then(({ default: Config }) => {
      console.log("imported config");
      extendedGlobal.config = Config;
    });

    import("./test/test-stats").then((TestStats) => {
      console.log("imported test-stats");
      extendedGlobal.stats = TestStats.getStats;
    });

    import("./test/replay").then((Replay) => {
      console.log("imported replay");
      extendedGlobal.replay = Replay.getReplayExport;
    });

    import("./test/test-timer").then((TestTimer) => {
      console.log("imported test-timer");
      extendedGlobal.enableTimerDebug = TestTimer.enableTimerDebug;
      extendedGlobal.getTimerStats = TestTimer.getTimerStats;
    });

    import("./test/result").then((Result) => {
      console.log("imported result");
      extendedGlobal.toggleUnsmoothedRaw = Result.toggleUnsmoothedRaw;
    });

    import("./test/test-input").then((TestInput) => {
      console.log("imported test-input");
      extendedGlobal.enableSpacingDebug = TestInput.enableSpacingDebug;
    });

    import("./states/glarses-mode").then(({ enable }) => {
      console.log("imported glarses-mode");
      extendedGlobal.glarsesMode = enable;
    });

    import("./pages/account").then((Account) => {
      console.log("imported account");
      extendedGlobal.toggleFilterDebug = Account.toggleFilterDebug;
    });
  })
  .catch(console.error);
