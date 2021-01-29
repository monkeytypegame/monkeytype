import { db_updateName } from "./db";

var gmailProvider = new firebase.auth.GoogleAuthProvider();

function showSignOutButton() {
  $(".signOut").removeClass("hidden").css("opacity", 1);
}

function hideSignOutButton() {
  $(".signOut").css("opacity", 0).addClass("hidden");
}

function signIn() {
  $(".pageLogin .preloader").removeClass("hidden");
  let email = $(".pageLogin .login input")[0].value;
  let password = $(".pageLogin .login input")[1].value;

  if ($(".pageLogin .login #rememberMe input").prop("checked")) {
    //remember me
    firebase
      .auth()
      .setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .then(function () {
        return firebase
          .auth()
          .signInWithEmailAndPassword(email, password)
          .then((e) => {
            changePage("test");
          })
          .catch(function (error) {
            Notifications.add(error.message, -1);
            $(".pageLogin .preloader").addClass("hidden");
          });
      });
  } else {
    //dont remember
    firebase
      .auth()
      .setPersistence(firebase.auth.Auth.Persistence.SESSION)
      .then(function () {
        return firebase
          .auth()
          .signInWithEmailAndPassword(email, password)
          .then((e) => {
            changePage("test");
          })
          .catch(function (error) {
            Notifications.add(error.message, -1);
            $(".pageLogin .preloader").addClass("hidden");
          });
      });
  }
}

async function signInWithGoogle() {
  $(".pageLogin .preloader").removeClass("hidden");

  if ($(".pageLogin .login #rememberMe input").prop("checked")) {
    //remember me
    await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    firebase
      .auth()
      .signInWithPopup(gmailProvider)
      .then((result) => {
        console.log(result);
      })
      .catch((error) => {
        Notifications.add(error.message, -1);
        $(".pageLogin .preloader").addClass("hidden");
      });
  } else {
    //dont remember
    await firebase
      .auth()
      .setPersistence(firebase.auth.Auth.Persistence.SESSION);
    firebase
      .auth()
      .signInWithPopup(gmailProvider)
      .then((result) => {
        console.log(result);
      })
      .catch((error) => {
        Notifications.add(error.message, -1);
        $(".pageLogin .preloader").addClass("hidden");
      });
  }
}

function linkWithGoogle() {
  firebase
    .auth()
    .currentUser.linkWithPopup(gmailProvider)
    .then(function (result) {
      console.log(result);
    })
    .catch(function (error) {
      console.log(error);
    });
}

let dontCheckUserName = false;

function signUp() {
  $(".pageLogin .register .button").addClass("disabled");
  $(".pageLogin .preloader").removeClass("hidden");
  let nname = $(".pageLogin .register input")[0].value;
  let email = $(".pageLogin .register input")[1].value;
  let password = $(".pageLogin .register input")[2].value;
  let passwordVerify = $(".pageLogin .register input")[3].value;

  if (password != passwordVerify) {
    Notifications.add("Passwords do not match", 0, 3);
    $(".pageLogin .preloader").addClass("hidden");
    $(".pageLogin .register .button").removeClass("disabled");
    return;
  }

  CloudFunctions.namecheck({ name: nname }).then((d) => {
    if (d.data.resultCode === -1) {
      Notifications.add("Name unavailable", -1);
      $(".pageLogin .preloader").addClass("hidden");
      $(".pageLogin .register .button").removeClass("disabled");
      return;
    } else if (d.data.resultCode === -2) {
      Notifications.add(
        "Name cannot contain special characters or contain more than 14 characters. Can include _ . and -",
        -1
      );
      $(".pageLogin .preloader").addClass("hidden");
      $(".pageLogin .register .button").removeClass("disabled");
      return;
    } else if (d.data.resultCode === 1) {
      firebase
        .auth()
        .createUserWithEmailAndPassword(email, password)
        .then((user) => {
          // Account has been created here.
          dontCheckUserName = true;
          let usr = user.user;
          usr
            .updateProfile({
              displayName: nname,
            })
            .then(async function () {
              // Update successful.
              await firebase
                .firestore()
                .collection("users")
                .doc(usr.uid)
                .set({ name: nname }, { merge: true });
              CloudFunctions.reserveName({ name: nname, uid: usr.uid }).catch(
                (e) => {
                  console.error("Could not reserve name " + e);
                  throw "Could not reserve name";
                }
              );
              usr.sendEmailVerification();
              clearGlobalStats();
              Notifications.add("Account created", 1, 3);
              $("#menu .icon-button.account .text").text(nname);
              try {
                firebase.analytics().logEvent("accountCreated", usr.uid);
              } catch (e) {
                console.log("Analytics unavailable");
              }
              $(".pageLogin .preloader").addClass("hidden");
              db_setSnapshot({
                results: [],
                personalBests: {},
                tags: [],
                globalStats: {
                  time: undefined,
                  started: undefined,
                  completed: undefined,
                },
              });
              if (notSignedInLastResult !== null) {
                notSignedInLastResult.uid = usr.uid;
                CloudFunctions.testCompleted({
                  uid: usr.uid,
                  obj: notSignedInLastResult,
                });
                db_getSnapshot().results.push(notSignedInLastResult);
              }
              changePage("account");
              usr.sendEmailVerification();
              $(".pageLogin .register .button").removeClass("disabled");
            })
            .catch(function (error) {
              // An error happened.
              $(".pageLogin .register .button").removeClass("disabled");
              console.error(error);
              usr
                .delete()
                .then(function () {
                  // User deleted.
                  Notifications.add(
                    "Account not created. " + error.message,
                    -1
                  );
                  $(".pageLogin .preloader").addClass("hidden");
                })
                .catch(function (error) {
                  // An error happened.
                  $(".pageLogin .preloader").addClass("hidden");
                  Notifications.add(
                    "Something went wrong. " + error.message,
                    -1
                  );
                  console.error(error);
                });
            });
        })
        .catch(function (error) {
          // Handle Errors here.
          $(".pageLogin .register .button").removeClass("disabled");
          Notifications.add(error.message, -1);
          $(".pageLogin .preloader").addClass("hidden");
        });
    } else {
      $(".pageLogin .preloader").addClass("hidden");
      Notifications.add(
        "Something went wrong when checking name: " + d.data.message,
        -1
      );
    }
  });
}

function signOut() {
  firebase
    .auth()
    .signOut()
    .then(function () {
      Notifications.add("Signed out", 0, 2);
      clearGlobalStats();
      hideAccountSettingsSection();
      updateAccountLoginButton();
      changePage("login");
      db_setSnapshot(null);
    })
    .catch(function (error) {
      Notifications.add(error.message, -1);
    });
}

firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    // User is signed in.
    $(".pageAccount .content p.accountVerificatinNotice").remove();
    if (user.emailVerified === false) {
      $(".pageAccount .content").prepend(
        `<p class="accountVerificatinNotice" style="text-align:center">Your account is not verified. Click <a onClick="sendVerificationEmail()">here</a> to resend the verification email.`
      );
    }
    updateAccountLoginButton();
    accountIconLoading(true);
    getAccountDataAndInit();
    var displayName = user.displayName;
    var email = user.email;
    var emailVerified = user.emailVerified;
    var photoURL = user.photoURL;
    var isAnonymous = user.isAnonymous;
    var uid = user.uid;
    var providerData = user.providerData;
    $(".pageLogin .preloader").addClass("hidden");
    $("#menu .icon-button.account .text").text(displayName);

    showFavouriteThemesAtTheTop();

    let text = "Account created on " + user.metadata.creationTime;

    const date1 = new Date(user.metadata.creationTime);
    const date2 = new Date();
    const diffTime = Math.abs(date2 - date1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    text += ` (${diffDays} day${diffDays != 1 ? "s" : ""} ago)`;

    $(".pageAccount .group.createdDate").text(text);

    if (verifyUserWhenLoggedIn !== null) {
      Notifications.add("Verifying", 0, 3);
      verifyUserWhenLoggedIn.uid = user.uid;
      CloudFunctions.verifyUser(verifyUserWhenLoggedIn).then((data) => {
        if (data.data.status === 1) {
          Notifications.add(data.data.message, 1);
          db_getSnapshot().discordId = data.data.did;
          updateDiscordSettingsSection();
        } else {
          Notifications.add(data.data.message, -1);
        }
      });
    }
  }
  let theme = Misc.findGetParameter("customTheme");
  if (theme !== null) {
    try {
      theme = theme.split(",");
      config.customThemeColors = theme;
      Notifications.add("Custom theme applied.", 1);
    } catch (e) {
      Notifications.add(
        "Something went wrong. Reverting to default custom colors.",
        0
      );
      config.customThemeColors = defaultConfig.customThemeColors;
    }
    setCustomTheme(true);
    setCustomThemeInputs();
    applyCustomThemeColors();
  }
  if (/challenge_.+/g.test(window.location.pathname)) {
    let challengeName = window.location.pathname.split("_")[1];
    setTimeout(() => {
      setupChallenge(challengeName);
    }, 1000);
  }
});

function getAccountDataAndInit() {
  db_getUserSnapshot()
    .then(async (e) => {
      let snap = db_getSnapshot();
      if (snap === null) {
        throw "Missing db snapshot. Client likely could not connect to the backend.";
      }
      let user = firebase.auth().currentUser;
      if (snap.name === undefined) {
        //verify username
        if (Misc.isUsernameValid(user.displayName)) {
          //valid, just update
          snap.name = user.displayName;
          db_setSnapshot(snap);
          db_updateName(user.uid, user.displayName);
        } else {
          //invalid, get new
          // Notifications.add("Invalid name", 0);
          let promptVal = null;
          let cdnVal = undefined;

          while (
            promptVal === null ||
            cdnVal === undefined ||
            cdnVal.data.status < 0
          ) {
            promptVal = prompt(
              "Your name is either invalid or unavailable (you also need to do this if you used Google Sign Up). Please provide a new display name (cannot be longer than 14 characters, can only contain letters, numbers, underscores, dots and dashes):"
            );
            cdnVal = await CloudFunctions.changeDisplayName({
              uid: user.uid,
              name: promptVal,
            });
            if (cdnVal.data.status === 1) {
              alert("Name updated", 1);
              location.reload();
            } else if (cdnVal.data.status < 0) {
              alert(cdnVal.data.message, 0);
            }
          }
        }
      }
      if (!configChangedBeforeDb) {
        if (cookieConfig === null) {
          accountIconLoading(false);
          applyConfig(db_getSnapshot().config);
          updateSettingsPage();
          saveConfigToCookie(true);
          restartTest(false, true);
        } else if (db_getSnapshot().config !== undefined) {
          // let configsDifferent = false;
          // Object.keys(config).forEach((key) => {
          //   if (!configsDifferent) {
          //     try {
          //       if (key !== "resultFilters") {
          //         if (Array.isArray(config[key])) {
          //           config[key].forEach((arrval, index) => {
          //             if (arrval != db_getSnapshot().config[key][index]) {
          //               configsDifferent = true;
          //               console.log(
          //                 `.config is different: ${arrval} != ${db_getSnapshot().config[key][index]
          //                 }`
          //               );
          //             }
          //           });
          //         } else {
          //           if (config[key] != db_getSnapshot().config[key]) {
          //             configsDifferent = true;
          //             console.log(
          //               `..config is different ${key}: ${config[key]} != ${db_getSnapshot().config[key]
          //               }`
          //             );
          //           }
          //         }
          //       }
          //     } catch (e) {
          //       console.log(e);
          //       configsDifferent = true;
          //       console.log(`...config is different: ${e.message}`);
          //     }
          //   }
          // });
          // if (configsDifferent) {
          //   console.log("applying config from db");
          //   accountIconLoading(false);
          //   config = db_getSnapshot().config;
          //   applyConfig(config);
          //   updateSettingsPage();
          //   saveConfigToCookie(true);
          //   restartTest(false, true);
          // }
        }
        dbConfigLoaded = true;
      } else {
        accountIconLoading(false);
      }
      if (config.paceCaret === "pb" || config.paceCaret === "average") {
        if (!testActive) {
          initPaceCaret(true);
        }
      }
      // try {
      //   if (
      //     config.resultFilters === undefined ||
      //     config.resultFilters === null ||
      //     config.resultFilters.difficulty === undefined
      //   ) {
      //     if (
      //       db_getSnapshot().config.resultFilters == null ||
      //       db_getSnapshot().config.resultFilters.difficulty === undefined
      //     ) {
      //       config.resultFilters = defaultAccountFilters;
      //     } else {
      //       config.resultFilters = db_getSnapshot().config.resultFilters;
      //     }
      //   }
      // } catch (e) {
      //   config.resultFilters = defaultAccountFilters;
      // }
      // if (
      //   Object.keys(config.resultFilters.language).length !==
      //   Object.keys(defaultAccountFilters.language).length
      // ) {
      //   config.resultFilters.language = defaultAccountFilters.language;
      // }
      // if (
      //   Object.keys(config.resultFilters.funbox).length !==
      //   Object.keys(defaultAccountFilters.funbox).length
      // ) {
      //   config.resultFilters.funbox = defaultAccountFilters.funbox;
      // }
      if (
        $(".pageLogin").hasClass("active") ||
        window.location.pathname === "/account"
      ) {
        changePage("account");
      }
      refreshThemeButtons();
      accountIconLoading(false);
      updateFilterTags();
      updateCommandsTagsList();
      loadActiveTagsFromCookie();
      updateResultEditTagsPanelButtons();
      showAccountSettingsSection();
    })
    .catch((e) => {
      accountIconLoading(false);
      console.error(e);
      Notifications.add(
        "Error downloading user data - refresh to try again. Client likely could not connect to the backend, if error persists contact Miodec.",
        -1
      );
      $("#top #menu .account .icon").html('<i class="fas fa-fw fa-times"></i>');
      $("#top #menu .account").css("opacity", 1);
    });
}

var resultHistoryChart = new Chart($(".pageAccount #resultHistoryChart"), {
  animationSteps: 60,
  type: "line",
  data: {
    datasets: [
      {
        yAxisID: "wpm",
        label: "wpm",
        fill: false,
        data: [],
        borderColor: "#f44336",
        borderWidth: 2,
        trendlineLinear: {
          style: "rgba(255,105,180, .8)",
          lineStyle: "dotted",
          width: 4,
        },
      },
      {
        yAxisID: "acc",
        label: "acc",
        fill: false,
        data: [],
        borderColor: "#cccccc",
        borderWidth: 2,
      },
    ],
  },
  options: {
    tooltips: {
      // Disable the on-canvas tooltip
      enabled: true,
      titleFontFamily: "Roboto Mono",
      bodyFontFamily: "Roboto Mono",
      intersect: false,
      custom: function (tooltip) {
        if (!tooltip) return;
        // disable displaying the color box;
        tooltip.displayColors = false;
      },
      callbacks: {
        // HERE YOU CUSTOMIZE THE LABELS
        title: function () {
          return;
        },
        beforeLabel: function (tooltipItem, data) {
          let resultData =
            data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
          if (tooltipItem.datasetIndex !== 0) {
            return `error rate: ${Misc.roundTo2(
              resultData.y
            )}%\nacc: ${Misc.roundTo2(100 - resultData.y)}%`;
          }
          let label =
            `${data.datasets[tooltipItem.datasetIndex].label}: ${
              tooltipItem.yLabel
            }` +
            "\n" +
            `raw: ${resultData.raw}` +
            "\n" +
            `acc: ${resultData.acc}` +
            "\n\n" +
            `mode: ${resultData.mode} `;

          if (resultData.mode == "time") {
            label += resultData.mode2;
          } else if (resultData.mode == "words") {
            label += resultData.mode2;
          }

          let diff = resultData.difficulty;
          if (diff == undefined) {
            diff = "normal";
          }
          label += "\n" + `difficulty: ${diff}`;

          label +=
            "\n" +
            `punctuation: ${resultData.punctuation}` +
            "\n" +
            `language: ${resultData.language}` +
            "\n\n" +
            `date: ${moment(resultData.timestamp).format("DD MMM YYYY HH:mm")}`;

          return label;
        },
        label: function (tooltipItem, data) {
          return;
        },
        afterLabel: function (tooltipItem, data) {
          return;
        },
      },
    },
    animation: {
      duration: 250,
    },
    legend: {
      display: false,
      labels: {
        fontFamily: "Roboto Mono",
        fontColor: "#ffffff",
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    hover: {
      mode: "nearest",
      intersect: false,
    },
    scales: {
      xAxes: [
        {
          ticks: {
            fontFamily: "Roboto Mono",
          },
          type: "time",
          bounds: "ticks",
          distribution: "series",
          display: false,
          offset: true,
          scaleLabel: {
            display: false,
            labelString: "Date",
          },
        },
      ],
      yAxes: [
        {
          id: "wpm",
          ticks: {
            fontFamily: "Roboto Mono",
            beginAtZero: true,
            min: 0,
            stepSize: 10,
          },
          display: true,
          scaleLabel: {
            display: true,
            labelString: "Words per Minute",
            fontFamily: "Roboto Mono",
          },
        },
        {
          id: "acc",
          ticks: {
            fontFamily: "Roboto Mono",
            beginAtZero: true,
            max: 100,
          },
          display: true,
          position: "right",
          scaleLabel: {
            display: true,
            labelString: "Error rate (100 - accuracy)",
            fontFamily: "Roboto Mono",
          },
          gridLines: {
            display: false,
          },
        },
      ],
    },
  },
});

let activityChart = new Chart($(".pageAccount #activityChart"), {
  animationSteps: 60,
  type: "bar",
  data: {
    datasets: [
      {
        yAxisID: "count",
        label: "Seconds",
        data: [],
        trendlineLinear: {
          style: "rgba(255,105,180, .8)",
          lineStyle: "dotted",
          width: 2,
        },
        order: 3,
      },
      {
        yAxisID: "avgWpm",
        label: "Average Wpm",
        data: [],
        type: "line",
        order: 2,
        lineTension: 0,
        fill: false,
      },
    ],
  },
  options: {
    tooltips: {
      callbacks: {
        // HERE YOU CUSTOMIZE THE LABELS
        title: function (tooltipItem, data) {
          let resultData =
            data.datasets[tooltipItem[0].datasetIndex].data[
              tooltipItem[0].index
            ];
          return moment(resultData.x).format("DD MMM YYYY");
        },
        beforeLabel: function (tooltipItem, data) {
          let resultData =
            data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
          if (tooltipItem.datasetIndex === 0) {
            return `Time Typing: ${Misc.secondsToString(
              resultData.y
            )}\nTests Completed: ${resultData.amount}`;
          } else if (tooltipItem.datasetIndex === 1) {
            return `Average Wpm: ${Misc.roundTo2(resultData.y)}`;
          }
        },
        label: function (tooltipItem, data) {
          return;
        },
      },
    },
    animation: {
      duration: 250,
    },
    legend: {
      display: false,
      labels: {
        fontFamily: "Roboto Mono",
        fontColor: "#ffffff",
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    hover: {
      mode: "nearest",
      intersect: false,
    },
    scales: {
      xAxes: [
        {
          ticks: {
            fontFamily: "Roboto Mono",
            autoSkip: true,
            autoSkipPadding: 40,
          },
          type: "time",
          time: {
            unit: "day",
            displayFormats: {
              day: "D MMM",
            },
          },
          bounds: "ticks",
          distribution: "series",
          display: true,
          scaleLabel: {
            display: false,
            labelString: "Date",
          },
          offset: true,
        },
      ],
      yAxes: [
        {
          id: "count",
          ticks: {
            fontFamily: "Roboto Mono",
            beginAtZero: true,
            min: 0,
            autoSkip: true,
            autoSkipPadding: 40,
            stepSize: 10,
          },
          display: true,
          scaleLabel: {
            display: true,
            labelString: "Time Typing",
            fontFamily: "Roboto Mono",
          },
        },
        {
          id: "avgWpm",
          ticks: {
            fontFamily: "Roboto Mono",
            beginAtZero: true,
            min: 0,
            autoSkip: true,
            autoSkipPadding: 40,
            stepSize: 10,
          },
          display: true,
          position: "right",
          scaleLabel: {
            display: true,
            labelString: "Average Wpm",
            fontFamily: "Roboto Mono",
          },
          gridLines: {
            display: false,
          },
        },
      ],
    },
  },
});

let hoverChart = new Chart($(".pageAccount #hoverChart"), {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "wpm",
        data: [],
        borderColor: "rgba(125, 125, 125, 1)",
        borderWidth: 2,
        yAxisID: "wpm",
        order: 2,
        radius: 2,
      },
      {
        label: "raw",
        data: [],
        borderColor: "rgba(125, 125, 125, 1)",
        borderWidth: 2,
        yAxisID: "raw",
        order: 3,
        radius: 2,
      },
      {
        label: "errors",
        data: [],
        borderColor: "rgba(255, 125, 125, 1)",
        pointBackgroundColor: "rgba(255, 125, 125, 1)",
        borderWidth: 2,
        order: 1,
        yAxisID: "error",
        maxBarThickness: 10,
        type: "scatter",
        pointStyle: "crossRot",
        radius: function (context) {
          var index = context.dataIndex;
          var value = context.dataset.data[index];
          return value <= 0 ? 0 : 3;
        },
        pointHoverRadius: function (context) {
          var index = context.dataIndex;
          var value = context.dataset.data[index];
          return value <= 0 ? 0 : 5;
        },
      },
    ],
  },
  options: {
    tooltips: {
      titleFontFamily: "Roboto Mono",
      bodyFontFamily: "Roboto Mono",
      mode: "index",
      intersect: false,
    },
    legend: {
      display: false,
      labels: {
        defaultFontFamily: "Roboto Mono",
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      xAxes: [
        {
          ticks: {
            fontFamily: "Roboto Mono",
            autoSkip: true,
            autoSkipPadding: 40,
          },
          display: true,
          scaleLabel: {
            display: false,
            labelString: "Seconds",
            fontFamily: "Roboto Mono",
          },
        },
      ],
      yAxes: [
        {
          id: "wpm",
          display: true,
          scaleLabel: {
            display: true,
            labelString: "Words per Minute",
            fontFamily: "Roboto Mono",
          },
          ticks: {
            fontFamily: "Roboto Mono",
            beginAtZero: true,
            min: 0,
            autoSkip: true,
            autoSkipPadding: 40,
          },
          gridLines: {
            display: true,
          },
        },
        {
          id: "raw",
          display: false,
          scaleLabel: {
            display: true,
            labelString: "Raw Words per Minute",
            fontFamily: "Roboto Mono",
          },
          ticks: {
            fontFamily: "Roboto Mono",
            beginAtZero: true,
            min: 0,
            autoSkip: true,
            autoSkipPadding: 40,
          },
          gridLines: {
            display: false,
          },
        },
        {
          id: "error",
          display: true,
          position: "right",
          scaleLabel: {
            display: true,
            labelString: "Errors",
            fontFamily: "Roboto Mono",
          },
          ticks: {
            precision: 0,
            fontFamily: "Roboto Mono",
            beginAtZero: true,
            autoSkip: true,
            autoSkipPadding: 40,
          },
          gridLines: {
            display: false,
          },
        },
      ],
    },
    annotation: {
      annotations: [
        {
          enabled: false,
          type: "line",
          mode: "horizontal",
          scaleID: "wpm",
          value: "-30",
          borderColor: "red",
          borderWidth: 1,
          borderDash: [2, 2],
          label: {
            // Background color of label, default below
            backgroundColor: "blue",
            fontFamily: "Roboto Mono",

            // Font size of text, inherits from global
            fontSize: 11,

            // Font style of text, default below
            fontStyle: "normal",

            // Font color of text, default below
            fontColor: "#fff",

            // Padding of label to add left/right, default below
            xPadding: 6,

            // Padding of label to add top/bottom, default below
            yPadding: 6,

            // Radius of label rectangle, default below
            cornerRadius: 3,

            // Anchor position of label on line, can be one of: top, bottom, left, right, center. Default below.
            position: "center",

            // Whether the label is enabled and should be displayed
            enabled: true,

            // Text to display in label - default is null. Provide an array to display values on a new line
            content: "PB",
          },
        },
      ],
    },
  },
});

function updateHoverChart(filteredId) {
  let data = filteredResults[filteredId].chartData;
  let labels = [];
  for (let i = 1; i <= data.wpm.length; i++) {
    labels.push(i.toString());
  }
  hoverChart.data.labels = labels;
  hoverChart.data.datasets[0].data = data.wpm;
  hoverChart.data.datasets[1].data = data.raw;
  hoverChart.data.datasets[2].data = data.err;

  hoverChart.options.scales.xAxes[0].ticks.minor.fontColor = themeColors.sub;
  hoverChart.options.scales.xAxes[0].scaleLabel.fontColor = themeColors.sub;
  hoverChart.options.scales.yAxes[0].ticks.minor.fontColor = themeColors.sub;
  hoverChart.options.scales.yAxes[2].ticks.minor.fontColor = themeColors.sub;
  hoverChart.options.scales.yAxes[0].scaleLabel.fontColor = themeColors.sub;
  hoverChart.options.scales.yAxes[2].scaleLabel.fontColor = themeColors.sub;

  hoverChart.data.datasets[0].borderColor = themeColors.main;
  hoverChart.data.datasets[0].pointBackgroundColor = themeColors.main;
  hoverChart.data.datasets[1].borderColor = themeColors.sub;
  hoverChart.data.datasets[1].pointBackgroundColor = themeColors.sub;

  hoverChart.options.annotation.annotations[0].borderColor = themeColors.sub;
  hoverChart.options.annotation.annotations[0].label.backgroundColor =
    themeColors.sub;
  hoverChart.options.annotation.annotations[0].label.fontColor = themeColors.bg;

  let maxChartVal = Math.max(...[Math.max(...data.wpm), Math.max(...data.raw)]);
  let minChartVal = Math.min(...[Math.min(...data.wpm), Math.min(...data.raw)]);
  hoverChart.options.scales.yAxes[0].ticks.max = Math.round(maxChartVal);
  hoverChart.options.scales.yAxes[1].ticks.max = Math.round(maxChartVal);

  if (!config.startGraphsAtZero) {
    hoverChart.options.scales.yAxes[0].ticks.min = Math.round(minChartVal);
    hoverChart.options.scales.yAxes[1].ticks.min = Math.round(minChartVal);
  } else {
    hoverChart.options.scales.yAxes[0].ticks.min = 0;
    hoverChart.options.scales.yAxes[1].ticks.min = 0;
  }

  hoverChart.update({ duration: 0 });
}

function showHoverChart() {
  $(".pageAccount .hoverChartWrapper").stop(true, true).fadeIn(125);
  $(".pageAccount .hoverChartBg").stop(true, true).fadeIn(125);
}

function hideHoverChart() {
  $(".pageAccount .hoverChartWrapper").stop(true, true).fadeOut(125);
  $(".pageAccount .hoverChartBg").stop(true, true).fadeOut(125);
}

function updateHoverChartPosition(x, y) {
  $(".pageAccount .hoverChartWrapper").css({ top: y, left: x });
}

$(document).on("click", ".pageAccount .hoverChartButton", (event) => {
  console.log("updating");
  let filterid = $(event.currentTarget).attr("filteredResultsId");
  if (filterid === undefined) return;
  updateHoverChart(filterid);
  showHoverChart();
  updateHoverChartPosition(
    event.pageX - $(".pageAccount .hoverChartWrapper").outerWidth(),
    event.pageY + 30
  );
});

$(document).on("click", ".pageAccount .hoverChartBg", (event) => {
  hideHoverChart();
});

Misc.getLanguageList().then((languages) => {
  languages.forEach((language) => {
    $(
      ".pageAccount .content .filterButtons .buttonsAndTitle.languages .buttons"
    ).append(
      `<div class="button" filter="${language}">${language.replace(
        "_",
        " "
      )}</div>`
    );
  });
});

$(
  ".pageAccount .content .filterButtons .buttonsAndTitle.funbox .buttons"
).append(`<div class="button" filter="none">none</div>`);
Misc.getFunboxList().then((funboxModes) => {
  funboxModes.forEach((funbox) => {
    $(
      ".pageAccount .content .filterButtons .buttonsAndTitle.funbox .buttons"
    ).append(
      `<div class="button" filter="${funbox.name}">${funbox.name.replace(
        /_/g,
        " "
      )}</div>`
    );
  });
});

function updateFilterTags() {
  $(
    ".pageAccount .content .filterButtons .buttonsAndTitle.tags .buttons"
  ).empty();
  if (db_getSnapshot().tags.length > 0) {
    $(".pageAccount .content .filterButtons .buttonsAndTitle.tags").removeClass(
      "hidden"
    );
    $(
      ".pageAccount .content .filterButtons .buttonsAndTitle.tags .buttons"
    ).append(`<div class="button" filter="none">no tag</div>`);
    db_getSnapshot().tags.forEach((tag) => {
      $(
        ".pageAccount .content .filterButtons .buttonsAndTitle.tags .buttons"
      ).append(`<div class="button" filter="${tag.id}">${tag.name}</div>`);
    });
  } else {
    $(".pageAccount .content .filterButtons .buttonsAndTitle.tags").addClass(
      "hidden"
    );
  }
}

function toggleFilter(group, filter) {
  try {
    if (group === "date") {
      Object.keys(ResultFilters.getGroup("date")).forEach((date) => {
        ResultFilters.setFilter("date", date, false);
      });
    }
    ResultFilters.toggleFilter(group, filter);
    ResultFilters.save();
  } catch (e) {
    Notifications.add(
      "Something went wrong toggling filter. Reverting to defaults",
      0
    );
    console.log("toggling filter error");
    console.error(e);
    ResultFilters.reset();
    showActiveFilters();
  }
}

function showActiveFilters() {
  let aboveChartDisplay = {};
  Object.keys(ResultFilters.getFilters()).forEach((group) => {
    aboveChartDisplay[group] = {
      all: true,
      array: [],
    };
    Object.keys(ResultFilters.getGroup(group)).forEach((filter) => {
      if (ResultFilters.getFilter(group, filter)) {
        aboveChartDisplay[group].array.push(filter);
      } else {
        aboveChartDisplay[group].all = false;
      }
      let buttonEl;
      if (group === "date") {
        buttonEl = $(
          `.pageAccount .group.topFilters .filterGroup[group="${group}"] .button[filter="${filter}"]`
        );
      } else {
        buttonEl = $(
          `.pageAccount .group.filterButtons .filterGroup[group="${group}"] .button[filter="${filter}"]`
        );
      }
      if (ResultFilters.getFilter(group, filter)) {
        buttonEl.addClass("active");
      } else {
        buttonEl.removeClass("active");
      }
    });
  });

  function addText(group) {
    let ret = "";
    ret += "<div class='group'>";
    if (group == "difficulty") {
      ret += `<span aria-label="Difficulty" data-balloon-pos="up"><i class="fas fa-fw fa-star"></i>`;
    } else if (group == "mode") {
      ret += `<span aria-label="Mode" data-balloon-pos="up"><i class="fas fa-fw fa-bars"></i>`;
    } else if (group == "punctuation") {
      ret += `<span aria-label="Punctuation" data-balloon-pos="up"><span class="punc" style="font-weight: 900;
      width: 1.25rem;
      text-align: center;
      display: inline-block;
      letter-spacing: -.1rem;">!?</span>`;
    } else if (group == "numbers") {
      ret += `<span aria-label="Numbers" data-balloon-pos="up"><span class="numbers" style="font-weight: 900;
        width: 1.25rem;
        text-align: center;
        margin-right: .1rem;
        display: inline-block;
        letter-spacing: -.1rem;">15</span>`;
    } else if (group == "words") {
      ret += `<span aria-label="Words" data-balloon-pos="up"><i class="fas fa-fw fa-font"></i>`;
    } else if (group == "time") {
      ret += `<span aria-label="Time" data-balloon-pos="up"><i class="fas fa-fw fa-clock"></i>`;
    } else if (group == "date") {
      ret += `<span aria-label="Date" data-balloon-pos="up"><i class="fas fa-fw fa-calendar"></i>`;
    } else if (group == "tags") {
      ret += `<span aria-label="Tags" data-balloon-pos="up"><i class="fas fa-fw fa-tags"></i>`;
    } else if (group == "language") {
      ret += `<span aria-label="Language" data-balloon-pos="up"><i class="fas fa-fw fa-globe-americas"></i>`;
    } else if (group == "funbox") {
      ret += `<span aria-label="Funbox" data-balloon-pos="up"><i class="fas fa-fw fa-gamepad"></i>`;
    }
    if (aboveChartDisplay[group].all) {
      ret += "all";
    } else {
      if (group === "tags") {
        ret += aboveChartDisplay.tags.array
          .map((id) => {
            if (id == "none") return id;
            let name = db_getSnapshot().tags.filter((t) => t.id == id)[0];
            if (name !== undefined) {
              return db_getSnapshot().tags.filter((t) => t.id == id)[0].name;
            }
          })
          .join(", ");
      } else {
        ret += aboveChartDisplay[group].array.join(", ").replace(/_/g, " ");
      }
    }
    ret += "</span></div>";
    return ret;
  }

  let chartString = "";

  //date
  chartString += addText("date");
  chartString += `<div class="spacer"></div>`;

  //mode
  chartString += addText("mode");
  chartString += `<div class="spacer"></div>`;

  //time
  if (aboveChartDisplay.mode.array.includes("time")) {
    chartString += addText("time");
    chartString += `<div class="spacer"></div>`;
  }

  //words
  if (aboveChartDisplay.mode.array.includes("words")) {
    chartString += addText("words");
    chartString += `<div class="spacer"></div>`;
  }

  //diff
  chartString += addText("difficulty");
  chartString += `<div class="spacer"></div>`;

  //punc
  chartString += addText("punctuation");
  chartString += `<div class="spacer"></div>`;

  //numbers
  chartString += addText("numbers");
  chartString += `<div class="spacer"></div>`;

  //language
  chartString += addText("language");
  chartString += `<div class="spacer"></div>`;

  //funbox
  chartString += addText("funbox");
  chartString += `<div class="spacer"></div>`;

  //tags
  chartString += addText("tags");

  $(".pageAccount .group.chart .above").html(chartString);

  refreshAccountPage();
}

function showChartPreloader() {
  $(".pageAccount .group.chart .preloader").stop(true, true).animate(
    {
      opacity: 1,
    },
    125
  );
}

function hideChartPreloader() {
  $(".pageAccount .group.chart .preloader").stop(true, true).animate(
    {
      opacity: 0,
    },
    125
  );
}

$(".pageAccount .topFilters .button.allFilters").click((e) => {
  Object.keys(ResultFilters.getFilters()).forEach((group) => {
    Object.keys(ResultFilters.getGroup(group)).forEach((filter) => {
      if (group === "date") {
        ResultFilters.setFilter(group, filter, false);
      } else {
        ResultFilters.setFilter(group, filter, true);
      }
    });
  });
  ResultFilters.setFilter("date", "all", true);
  showActiveFilters();
  ResultFilters.save();
});

$(".pageAccount .topFilters .button.currentConfigFilter").click((e) => {
  Object.keys(ResultFilters.getFilters()).forEach((group) => {
    Object.keys(ResultFilters.getGroup(group)).forEach((filter) => {
      ResultFilters.setFilter(group, filter, false);
    });
  });

  ResultFilters.setFilter("difficulty", config.difficulty, true);
  ResultFilters.setFilter("mode", config.mode, true);
  if (config.mode === "time") {
    ResultFilters.setFilter("time", config.time, true);
  } else if (config.mode === "words") {
    ResultFilters.setFilter("words", config.words, true);
  } else if (config.mode === "quote") {
    Object.keys(ResultFilters.getGroup("quoteLength")).forEach((ql) => {
      ResultFilters.setFilter("quoteLength", ql, true);
    });
  }
  if (config.punctuation) {
    ResultFilters.setFilter("punctuation", "on", true);
  } else {
    ResultFilters.setFilter("punctuation", "off", true);
  }
  if (config.numbers) {
    ResultFilters.setFilter("numbers", "on", true);
  } else {
    ResultFilters.setFilter("numbers", "off", true);
  }
  if (config.mode === "quote" && /english.*/.test(config.language)) {
    ResultFilters.setFilter("language", "english", true);
  } else {
    ResultFilters.setFilter("language", config.language, true);
  }
  ResultFilters.setFilter("funbox", activeFunBox, true);
  ResultFilters.setFilter("tags", "none", true);
  db_getSnapshot().tags.forEach((tag) => {
    if (tag.active === true) {
      ResultFilters.setFilter("tags", "none", false);
      ResultFilters.setFilter("tags", tag.id, true);
    }
  });

  ResultFilters.setFilter("date", "all", true);
  showActiveFilters();
  ResultFilters.save();
  console.log(ResultFilters.getFilters());
});

$(".pageAccount .topFilters .button.toggleAdvancedFilters").click((e) => {
  $(".pageAccount .filterButtons").slideToggle(250);
  $(".pageAccount .topFilters .button.toggleAdvancedFilters").toggleClass(
    "active"
  );
});

$(
  ".pageAccount .filterButtons .buttonsAndTitle .buttons, .pageAccount .group.topFilters .buttonsAndTitle.testDate .buttons"
).click(".button", (e) => {
  const filter = $(e.target).attr("filter");
  const group = $(e.target).parents(".buttons").attr("group");
  if ($(e.target).hasClass("allFilters")) {
    Object.keys(ResultFilters.getFilters()).forEach((group) => {
      Object.keys(ResultFilters.getGroup(group)).forEach((filter) => {
        if (group === "date") {
          ResultFilters.setFilter(group, filter, false);
        } else {
          ResultFilters.setFilter(group, filter, true);
        }
      });
    });
    ResultFilters.setFilter("date", "all", true);
  } else if ($(e.target).hasClass("noFilters")) {
    Object.keys(ResultFilters.getFilters()).forEach((group) => {
      if (group !== "date") {
        Object.keys(ResultFilters.getGroup(group)).forEach((filter) => {
          ResultFilters.setFilter(group, filter, false);
        });
      }
    });
  } else {
    if (e.shiftKey) {
      Object.keys(ResultFilters.getGroup(group)).forEach((filter) => {
        ResultFilters.setFilter(group, filter, false);
      });
      ResultFilters.setFilter(group, filter, true);
    } else {
      toggleFilter(group, filter);
    }
  }
  showActiveFilters();
  ResultFilters.save();
});

function fillPbTables() {
  $(".pageAccount .timePbTable tbody").html(`
  <tr>
    <td>15</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
    <td>30</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
    <td>60</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
    <td>120</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  `);
  $(".pageAccount .wordsPbTable tbody").html(`
  <tr>
    <td>10</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
    <td>25</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
    <td>50</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
    <td>100</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  `);

  const pb = db_getSnapshot().personalBests;
  let pbData;
  let text;

  text = "";
  try {
    pbData = pb.time[15].sort((a, b) => b.wpm - a.wpm)[0];
    text += `<tr>
      <td>15</td>
      <td>${pbData.wpm}</td>
      <td>${pbData.raw === undefined ? "-" : pbData.raw}</td>
      <td>${pbData.acc === undefined ? "-" : pbData.acc + "%"}</td>
      <td>
      ${pbData.consistency === undefined ? "-" : pbData.consistency + "%"}
      </td>
    </tr>`;
  } catch (e) {
    text += `<tr>
      <td>15</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
    </tr>`;
  }
  try {
    pbData = pb.time[30].sort((a, b) => b.wpm - a.wpm)[0];
    text += `<tr>
      <td>30</td>
      <td>${pbData.wpm}</td>
      <td>${pbData.raw === undefined ? "-" : pbData.raw}</td>
      <td>${pbData.acc === undefined ? "-" : pbData.acc + "%"}</td>
      <td>
      ${pbData.consistency === undefined ? "-" : pbData.consistency + "%"}
      </td>
    </tr>`;
  } catch (e) {
    text += `<tr>
      <td>30</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
    </tr>`;
  }
  try {
    pbData = pb.time[60].sort((a, b) => b.wpm - a.wpm)[0];
    text += `<tr>
      <td>60</td>
      <td>${pbData.wpm}</td>
      <td>${pbData.raw === undefined ? "-" : pbData.raw}</td>
      <td>${pbData.acc === undefined ? "-" : pbData.acc + "%"}</td>
      <td>
      ${pbData.consistency === undefined ? "-" : pbData.consistency + "%"}
      </td>
    </tr>`;
  } catch (e) {
    text += `<tr>
      <td>60</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
    </tr>`;
  }
  try {
    pbData = pb.time[120].sort((a, b) => b.wpm - a.wpm)[0];
    text += `<tr>
      <td>120</td>
      <td>${pbData.wpm}</td>
      <td>${pbData.raw === undefined ? "-" : pbData.raw}</td>
      <td>${pbData.acc === undefined ? "-" : pbData.acc + "%"}</td>
      <td>
      ${pbData.consistency === undefined ? "-" : pbData.consistency + "%"}
      </td>
    </tr>`;
  } catch (e) {
    text += `<tr>
      <td>120</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
    </tr>`;
  }
  $(".pageAccount .timePbTable tbody").html(text);

  text = "";
  try {
    pbData = pb.words[10].sort((a, b) => b.wpm - a.wpm)[0];
    text += `<tr>
      <td>10</td>
      <td>${pbData.wpm}</td>
      <td>${pbData.raw === undefined ? "-" : pbData.raw}</td>
      <td>${pbData.acc === undefined ? "-" : pbData.acc + "%"}</td>
      <td>
      ${pbData.consistency === undefined ? "-" : pbData.consistency + "%"}
      </td>
    </tr>`;
  } catch (e) {
    text += `<tr>
      <td>10</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
    </tr>`;
  }
  try {
    pbData = pb.words[25].sort((a, b) => b.wpm - a.wpm)[0];
    text += `<tr>
      <td>25</td>
      <td>${pbData.wpm}</td>
      <td>${pbData.raw === undefined ? "-" : pbData.raw}</td>
      <td>${pbData.acc === undefined ? "-" : pbData.acc + "%"}</td>
      <td>
      ${pbData.consistency === undefined ? "-" : pbData.consistency + "%"}
      </td>
    </tr>`;
  } catch (e) {
    text += `<tr>
      <td>25</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
    </tr>`;
  }
  try {
    pbData = pb.words[50].sort((a, b) => b.wpm - a.wpm)[0];
    text += `<tr>
      <td>50</td>
      <td>${pbData.wpm}</td>
      <td>${pbData.raw === undefined ? "-" : pbData.raw}</td>
      <td>${pbData.acc === undefined ? "-" : pbData.acc + "%"}</td>
      <td>
      ${pbData.consistency === undefined ? "-" : pbData.consistency + "%"}
      </td>
    </tr>`;
  } catch (e) {
    text += `<tr>
      <td>50</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
    </tr>`;
  }
  try {
    pbData = pb.words[100].sort((a, b) => b.wpm - a.wpm)[0];
    text += `<tr>
      <td>100</td>
      <td>${pbData.wpm}</td>
      <td>${pbData.raw === undefined ? "-" : pbData.raw}</td>
      <td>${pbData.acc === undefined ? "-" : pbData.acc + "%"}</td>
      <td>
      ${pbData.consistency === undefined ? "-" : pbData.consistency + "%"}
      </td>
    </tr>`;
  } catch (e) {
    text += `<tr>
      <td>100</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
    </tr>`;
  }
  $(".pageAccount .wordsPbTable tbody").html(text);
}

let filteredResults = [];
let visibleTableLines = 0;

function loadMoreLines() {
  if (filteredResults == [] || filteredResults.length == 0) return;
  for (let i = visibleTableLines; i < visibleTableLines + 10; i++) {
    const result = filteredResults[i];
    if (result == undefined) continue;
    let withpunc = "";
    let diff = result.difficulty;
    if (diff == undefined) {
      diff = "normal";
    }

    let raw;
    try {
      raw = result.rawWpm.toFixed(2);
      if (raw == undefined) {
        raw = "-";
      }
    } catch (e) {
      raw = "-";
    }

    let icons = `<span aria-label="${result.language.replace(
      "_",
      " "
    )}" data-balloon-pos="up"><i class="fas fa-fw fa-globe-americas"></i></span>`;

    if (diff === "normal") {
      icons += `<span aria-label="${result.difficulty}" data-balloon-pos="up"><i class="far fa-fw fa-star"></i></span>`;
    } else if (diff === "expert") {
      icons += `<span aria-label="${result.difficulty}" data-balloon-pos="up"><i class="fas fa-fw fa-star-half-alt"></i></span>`;
    } else if (diff === "master") {
      icons += `<span aria-label="${result.difficulty}" data-balloon-pos="up"><i class="fas fa-fw fa-star"></i></span>`;
    }

    if (result.punctuation) {
      icons += `<span aria-label="punctuation" data-balloon-pos="up" style="font-weight:900">!?</span>`;
    }

    if (result.numbers) {
      icons += `<span aria-label="numbers" data-balloon-pos="up" style="font-weight:900">15</span>`;
    }

    if (result.blindMode) {
      icons += `<span aria-label="blind mode" data-balloon-pos="up"><i class="fas fa-fw fa-eye-slash"></i></span>`;
    }

    if (result.funbox !== "none" && result.funbox !== undefined) {
      icons += `<span aria-label="${result.funbox.replace(
        /_/g,
        " "
      )}" data-balloon-pos="up"><i class="fas fa-gamepad"></i></span>`;
    }

    if (result.chartData === undefined) {
      icons += `<span class="hoverChartButton" aria-label="No chart data found" data-balloon-pos="up"><i class="fas fa-chart-line"></i></span>`;
    } else if (result.chartData === "toolong") {
      icons += `<span class="hoverChartButton" aria-label="Chart history is not available for long tests" data-balloon-pos="up"><i class="fas fa-chart-line"></i></span>`;
    } else {
      icons += `<span class="hoverChartButton" aria-label="View graph" data-balloon-pos="up" filteredResultsId="${i}" style="opacity: 1"><i class="fas fa-chart-line"></i></span>`;
    }

    let tagNames = "";

    if (result.tags !== undefined && result.tags.length > 0) {
      result.tags.forEach((tag) => {
        db_getSnapshot().tags.forEach((snaptag) => {
          if (tag === snaptag.id) {
            tagNames += snaptag.name + ", ";
          }
        });
      });
      tagNames = tagNames.substring(0, tagNames.length - 2);
    }

    let restags;
    if (result.tags === undefined) {
      restags = "[]";
    } else {
      restags = JSON.stringify(result.tags);
    }

    let tagIcons = `<span id="resultEditTags" resultId="${result.id}" tags='${restags}' aria-label="no tags" data-balloon-pos="up" style="opacity: .25"><i class="fas fa-fw fa-tag"></i></span>`;

    if (tagNames !== "") {
      if (result.tags !== undefined && result.tags.length > 1) {
        tagIcons = `<span id="resultEditTags" resultId="${result.id}" tags='${restags}' aria-label="${tagNames}" data-balloon-pos="up"><i class="fas fa-fw fa-tags"></i></span>`;
      } else {
        tagIcons = `<span id="resultEditTags" resultId="${result.id}" tags='${restags}' aria-label="${tagNames}" data-balloon-pos="up"><i class="fas fa-fw fa-tag"></i></span>`;
      }
    }

    let consistency = result.consistency;

    if (consistency === undefined) {
      consistency = "-";
    } else {
      consistency = consistency.toFixed(2) + "%";
    }

    let pb = result.isPb;
    if (pb) {
      pb = '<i class="fas fa-fw fa-crown"></i>';
    } else {
      pb = "";
    }

    $(".pageAccount .history table tbody").append(`
    <tr>
    <td>${pb}</td>
    <td>${result.wpm.toFixed(2)}</td>
    <td>${raw}</td>
    <td>${result.acc.toFixed(2)}%</td>
    <td>${result.correctChars}</td>
    <td>${result.incorrectChars}</td>
    <td>${consistency}</td>
    <td>${result.mode} ${result.mode2}${withpunc}</td>
    <td class="infoIcons">${icons}</td>
    <td>${tagIcons}</td>
    <td>${moment(result.timestamp).format("DD MMM YYYY<br>HH:mm")}</td>
    </tr>`);
  }
  visibleTableLines += 10;
  if (visibleTableLines >= filteredResults.length) {
    $(".pageAccount .loadMoreButton").addClass("hidden");
  } else {
    $(".pageAccount .loadMoreButton").removeClass("hidden");
  }
}

function clearGlobalStats() {
  $(".pageAccount .globalTimeTyping .val").text(`-`);
  $(".pageAccount .globalTestsStarted .val").text(`-`);
  $(".pageAccount .globalTestsCompleted .val").text(`-`);
}

function refreshGlobalStats() {
  if (db_getSnapshot().globalStats.time != undefined) {
    let th = Math.floor(db_getSnapshot().globalStats.time / 3600);
    let tm = Math.floor((db_getSnapshot().globalStats.time % 3600) / 60);
    let ts = Math.floor((db_getSnapshot().globalStats.time % 3600) % 60);
    $(".pageAccount .globalTimeTyping .val").text(`

      ${th < 10 ? "0" + th : th}:${tm < 10 ? "0" + tm : tm}:${
      ts < 10 ? "0" + ts : ts
    }
  `);
  }
  if (db_getSnapshot().globalStats.started != undefined) {
    $(".pageAccount .globalTestsStarted .val").text(
      db_getSnapshot().globalStats.started
    );
  }
  if (db_getSnapshot().globalStats.completed != undefined) {
    $(".pageAccount .globalTestsCompleted .val").text(
      db_getSnapshot().globalStats.completed
    );
  }
}

let totalSecondsFiltered = 0;

function refreshAccountPage() {
  function cont() {
    refreshThemeColorObject();
    refreshGlobalStats();
    fillPbTables();

    let chartData = [];
    let wpmChartData = [];
    let accChartData = [];
    visibleTableLines = 0;

    let topWpm = 0;
    let topMode = "";
    let testRestarts = 0;
    let totalWpm = 0;
    let testCount = 0;

    let last10 = 0;
    let wpmLast10total = 0;

    let totalAcc = 0;
    let totalAcc10 = 0;

    let rawWpm = {
      total: 0,
      count: 0,
      last10Total: 0,
      last10Count: 0,
      max: 0,
    };

    let totalSeconds = 0;
    totalSecondsFiltered = 0;

    let totalCons = 0;
    let totalCons10 = 0;
    let consCount = 0;

    let activityChartData = {};

    filteredResults = [];
    $(".pageAccount .history table tbody").empty();
    db_getSnapshot().results.forEach((result) => {
      let tt = 0;
      if (result.testDuration == undefined) {
        //test finished before testDuration field was introduced - estimate
        if (result.mode == "time") {
          tt = parseFloat(result.mode2);
        } else if (result.mode == "words") {
          tt = (parseFloat(result.mode2) / parseFloat(result.wpm)) * 60;
        }
      } else {
        tt = parseFloat(result.testDuration);
      }
      if (result.incompleteTestSeconds != undefined) {
        tt += result.incompleteTestSeconds;
      } else if (result.restartCount != undefined && result.restartCount > 0) {
        tt += (tt / 4) * result.restartCount;
      }
      totalSeconds += tt;

      //apply filters
      try {
        let resdiff = result.difficulty;
        if (resdiff == undefined) {
          resdiff = "normal";
        }
        if (!ResultFilters.getFilter("difficulty", resdiff)) return;
        if (!ResultFilters.getFilter("mode", result.mode)) return;

        if (result.mode == "time") {
          let timefilter = "custom";
          if ([15, 30, 60, 120].includes(parseInt(result.mode2))) {
            timefilter = result.mode2;
          }
          if (!ResultFilters.getFilter("time", timefilter)) return;
        } else if (result.mode == "words") {
          let wordfilter = "custom";
          if ([10, 25, 50, 100, 200].includes(parseInt(result.mode2))) {
            wordfilter = result.mode2;
          }
          if (!ResultFilters.getFilter("words", wordfilter)) return;
        }

        if (result.quoteLength != null) {
          let filter = null;
          if (result.quoteLength === 0) {
            filter = "short";
          } else if (result.quoteLength === 1) {
            filter = "medium";
          } else if (result.quoteLength === 2) {
            filter = "long";
          } else if (result.quoteLength === 3) {
            filter = "thicc";
          }
          if (
            filter !== null &&
            !ResultFilters.getFilter("quoteLength", filter)
          )
            return;
        }

        let langFilter = ResultFilters.getFilter("language", result.language);

        if (
          result.language === "english_expanded" &&
          ResultFilters.getFilter("language", "english_1k")
        ) {
          langFilter = true;
        }
        if (!langFilter) return;

        let puncfilter = "off";
        if (result.punctuation) {
          puncfilter = "on";
        }
        if (!ResultFilters.getFilter("punctuation", puncfilter)) return;

        let numfilter = "off";
        if (result.numbers) {
          numfilter = "on";
        }
        if (!ResultFilters.getFilter("numbers", numfilter)) return;

        if (result.funbox === "none" || result.funbox === undefined) {
          if (!ResultFilters.getFilter("funbox", "none")) return;
        } else {
          if (!ResultFilters.getFilter("funbox", result.funbox)) return;
        }

        let tagHide = true;

        if (result.tags === undefined || result.tags.length === 0) {
          //no tags, show when no tag is enabled
          if (db_getSnapshot().tags.length > 0) {
            if (ResultFilters.getFilter("tags", "none")) tagHide = false;
          } else {
            tagHide = false;
          }
        } else {
          //tags exist
          let validTags = db_getSnapshot().tags.map((t) => t.id);
          result.tags.forEach((tag) => {
            //check if i even need to check tags anymore
            if (!tagHide) return;
            //check if tag is valid
            if (validTags.includes(tag)) {
              //tag valid, check if filter is on
              if (ResultFilters.getFilter("tags", tag)) tagHide = false;
            } else {
              //tag not found in valid tags, meaning probably deleted
              if (ResultFilters.getFilter("tags", "none")) tagHide = false;
            }
          });
        }

        if (tagHide) return;

        let timeSinceTest = Math.abs(result.timestamp - Date.now()) / 1000;

        let datehide = true;

        if (
          ResultFilters.getFilter("date", "all") ||
          (ResultFilters.getFilter("date", "last_day") &&
            timeSinceTest <= 86400) ||
          (ResultFilters.getFilter("date", "last_week") &&
            timeSinceTest <= 604800) ||
          (ResultFilters.getFilter("date", "last_month") &&
            timeSinceTest <= 2592000)
        ) {
          datehide = false;
        }

        if (datehide) return;

        filteredResults.push(result);
      } catch (e) {
        Notifications.add(
          "Something went wrong when filtering. Resetting filters.",
          0
        );
        console.log(result);
        console.error(e);
        ResultFilters.reset();
        showActiveFilters();
      }

      //filters done
      //=======================================

      let resultDate = new Date(result.timestamp);
      resultDate.setSeconds(0);
      resultDate.setMinutes(0);
      resultDate.setHours(0);
      resultDate.setMilliseconds(0);
      resultDate = resultDate.getTime();

      if (Object.keys(activityChartData).includes(String(resultDate))) {
        activityChartData[resultDate].amount++;
        activityChartData[resultDate].time +=
          result.testDuration + result.incompleteTestSeconds;
        activityChartData[resultDate].totalWpm += result.wpm;
      } else {
        activityChartData[resultDate] = {
          amount: 1,
          time: result.testDuration + result.incompleteTestSeconds,
          totalWpm: result.wpm,
        };
      }

      tt = 0;
      if (result.testDuration == undefined) {
        //test finished before testDuration field was introduced - estimate
        if (result.mode == "time") {
          tt = parseFloat(result.mode2);
        } else if (result.mode == "words") {
          tt = (parseFloat(result.mode2) / parseFloat(result.wpm)) * 60;
        }
      } else {
        tt = parseFloat(result.testDuration);
      }
      if (result.incompleteTestSeconds != undefined) {
        tt += result.incompleteTestSeconds;
      } else if (result.restartCount != undefined && result.restartCount > 0) {
        tt += (tt / 4) * result.restartCount;
      }
      totalSecondsFiltered += tt;

      if (last10 < 10) {
        last10++;
        wpmLast10total += result.wpm;
        totalAcc10 += result.acc;
        result.consistency !== undefined
          ? (totalCons10 += result.consistency)
          : 0;
      }
      testCount++;

      if (result.consistency !== undefined) {
        consCount++;
        totalCons += result.consistency;
      }

      if (result.rawWpm != null) {
        if (rawWpm.last10Count < 10) {
          rawWpm.last10Count++;
          rawWpm.last10Total += result.rawWpm;
        }
        rawWpm.total += result.rawWpm;
        rawWpm.count++;
        if (result.rawWpm > rawWpm.max) {
          rawWpm.max = result.rawWpm;
        }
      }

      totalAcc += result.acc;

      if (result.restartCount != undefined) {
        testRestarts += result.restartCount;
      }

      chartData.push({
        x: result.timestamp,
        y: result.wpm,
        acc: result.acc,
        mode: result.mode,
        mode2: result.mode2,
        punctuation: result.punctuation,
        language: result.language,
        timestamp: result.timestamp,
        difficulty: result.difficulty,
        raw: result.rawWpm,
      });

      wpmChartData.push(result.wpm);

      accChartData.push({
        x: result.timestamp,
        y: 100 - result.acc,
      });

      if (result.wpm > topWpm) {
        let puncsctring = result.punctuation ? ",<br>with punctuation" : "";
        let numbsctring = result.numbers
          ? ",<br> " + (result.punctuation ? "&" : "") + "with numbers"
          : "";
        topWpm = result.wpm;
        topMode = result.mode + " " + result.mode2 + puncsctring + numbsctring;
      }

      totalWpm += result.wpm;
    });
    loadMoreLines();
    ////////

    let thisDate = new Date(Date.now());
    thisDate.setSeconds(0);
    thisDate.setMinutes(0);
    thisDate.setHours(0);
    thisDate.setMilliseconds(0);
    thisDate = thisDate.getTime();

    let activityChartData_amount = [];
    let activityChartData_time = [];
    let activityChartData_avgWpm = [];
    let lastTimestamp = 0;
    Object.keys(activityChartData).forEach((date) => {
      let datecheck;
      if (lastTimestamp > 0) {
        datecheck = lastTimestamp;
      } else {
        datecheck = thisDate;
      }

      let numDaysBetweenTheDays = (datecheck - date) / 86400000;

      if (numDaysBetweenTheDays > 1) {
        if (datecheck === thisDate) {
          activityChartData_amount.push({
            x: parseInt(thisDate),
            y: 0,
          });
        }

        for (let i = 0; i < numDaysBetweenTheDays - 1; i++) {
          activityChartData_amount.push({
            x: parseInt(datecheck) - 86400000 * (i + 1),
            y: 0,
          });
        }
      }

      activityChartData_amount.push({
        x: parseInt(date),
        y: activityChartData[date].amount,
      });
      activityChartData_time.push({
        x: parseInt(date),
        y: Misc.roundTo2(activityChartData[date].time),
        amount: activityChartData[date].amount,
      });
      activityChartData_avgWpm.push({
        x: parseInt(date),
        y: Misc.roundTo2(
          activityChartData[date].totalWpm / activityChartData[date].amount
        ),
      });
      lastTimestamp = date;
    });

    activityChart.data.datasets[0].data = activityChartData_time;
    activityChart.data.datasets[1].data = activityChartData_avgWpm;

    activityChart.options.legend.labels.fontColor = themeColors.sub;

    activityChart.options.scales.xAxes[0].ticks.minor.fontColor =
      themeColors.sub;
    activityChart.options.scales.yAxes[0].ticks.minor.fontColor =
      themeColors.sub;
    activityChart.options.scales.yAxes[0].scaleLabel.fontColor =
      themeColors.sub;
    activityChart.data.datasets[0].borderColor = themeColors.main;
    activityChart.data.datasets[0].backgroundColor = themeColors.main;

    activityChart.data.datasets[0].trendlineLinear.style = themeColors.sub;

    activityChart.options.scales.yAxes[1].ticks.minor.fontColor =
      themeColors.sub;
    activityChart.options.scales.yAxes[1].scaleLabel.fontColor =
      themeColors.sub;
    activityChart.data.datasets[1].borderColor = themeColors.sub;

    activityChart.options.legend.labels.fontColor = themeColors.sub;

    resultHistoryChart.options.scales.xAxes[0].ticks.minor.fontColor =
      themeColors.sub;
    resultHistoryChart.options.scales.yAxes[0].ticks.minor.fontColor =
      themeColors.sub;
    resultHistoryChart.options.scales.yAxes[0].scaleLabel.fontColor =
      themeColors.sub;
    resultHistoryChart.options.scales.yAxes[1].ticks.minor.fontColor =
      themeColors.sub;
    resultHistoryChart.options.scales.yAxes[1].scaleLabel.fontColor =
      themeColors.sub;
    resultHistoryChart.data.datasets[0].borderColor = themeColors.main;
    resultHistoryChart.data.datasets[1].borderColor = themeColors.sub;

    resultHistoryChart.options.legend.labels.fontColor = themeColors.sub;
    resultHistoryChart.data.datasets[0].trendlineLinear.style = themeColors.sub;

    resultHistoryChart.data.datasets[0].data = chartData;
    resultHistoryChart.data.datasets[1].data = accChartData;

    let wpms = chartData.map((r) => r.y);
    let minWpmChartVal = Math.min(...wpms);
    let maxWpmChartVal = Math.max(...wpms);

    let accuracies = accChartData.map((r) => r.y);
    let minAccuracyChartVal = Math.min(...accuracies);
    let maxAccuracyChartVal = Math.max(...accuracies);

    resultHistoryChart.options.scales.yAxes[0].ticks.max =
      Math.floor(maxWpmChartVal) + (10 - (Math.floor(maxWpmChartVal) % 10));
    // resultHistoryChart.options.scales.yAxes[1].ticks.max = Math.ceil(
    //   maxAccuracyChartVal
    // );

    if (!config.startGraphsAtZero) {
      resultHistoryChart.options.scales.yAxes[0].ticks.min = Math.floor(
        minWpmChartVal
      );
      // resultHistoryChart.options.scales.yAxes[1].ticks.min = Math.floor(
      //   minAccuracyChartVal
      // );
    } else {
      resultHistoryChart.options.scales.yAxes[0].ticks.min = 0;
      // resultHistoryChart.options.scales.yAxes[1].ticks.min = 0;
    }

    if (chartData == [] || chartData.length == 0) {
      $(".pageAccount .group.noDataError").removeClass("hidden");
      $(".pageAccount .group.chart").addClass("hidden");
      $(".pageAccount .group.dailyActivityChart").addClass("hidden");
      $(".pageAccount .group.history").addClass("hidden");
      $(".pageAccount .triplegroup.stats").addClass("hidden");
    } else {
      $(".pageAccount .group.noDataError").addClass("hidden");
      $(".pageAccount .group.chart").removeClass("hidden");
      $(".pageAccount .group.dailyActivityChart").removeClass("hidden");
      $(".pageAccount .group.history").removeClass("hidden");
      $(".pageAccount .triplegroup.stats").removeClass("hidden");
    }

    let th = Math.floor(totalSeconds / 3600);
    let tm = Math.floor((totalSeconds % 3600) / 60);
    let ts = Math.floor((totalSeconds % 3600) % 60);
    $(".pageAccount .timeTotal .val").text(`

      ${th < 10 ? "0" + th : th}:${tm < 10 ? "0" + tm : tm}:${
      ts < 10 ? "0" + ts : ts
    }
    `);
    let tfh = Math.floor(totalSecondsFiltered / 3600);
    let tfm = Math.floor((totalSecondsFiltered % 3600) / 60);
    let tfs = Math.floor((totalSecondsFiltered % 3600) % 60);
    $(".pageAccount .timeTotalFiltered .val").text(`

    ${tfh < 10 ? "0" + tfh : tfh}:${tfm < 10 ? "0" + tfm : tfm}:${
      tfs < 10 ? "0" + tfs : tfs
    }
  `);

    $(".pageAccount .highestWpm .val").text(topWpm);
    $(".pageAccount .averageWpm .val").text(Math.round(totalWpm / testCount));
    $(".pageAccount .averageWpm10 .val").text(
      Math.round(wpmLast10total / last10)
    );

    $(".pageAccount .highestRaw .val").text(rawWpm.max);
    $(".pageAccount .averageRaw .val").text(
      Math.round(rawWpm.total / rawWpm.count)
    );
    $(".pageAccount .averageRaw10 .val").text(
      Math.round(rawWpm.last10Total / rawWpm.last10Count)
    );

    $(".pageAccount .highestWpm .mode").html(topMode);
    $(".pageAccount .testsTaken .val").text(testCount);

    $(".pageAccount .avgAcc .val").text(Math.round(totalAcc / testCount) + "%");
    $(".pageAccount .avgAcc10 .val").text(
      Math.round(totalAcc10 / last10) + "%"
    );

    if (totalCons == 0 || totalCons == undefined) {
      $(".pageAccount .avgCons .val").text("-");
      $(".pageAccount .avgCons10 .val").text("-");
    } else {
      $(".pageAccount .avgCons .val").text(
        Math.round(totalCons / consCount) + "%"
      );
      $(".pageAccount .avgCons10 .val").text(
        Math.round(totalCons10 / Math.min(last10, consCount)) + "%"
      );
    }

    $(".pageAccount .testsStarted .val").text(`${testCount + testRestarts}`);

    $(".pageAccount .testsCompleted .val").text(
      `${testCount}(${Math.floor(
        (testCount / (testCount + testRestarts)) * 100
      )}%)`
    );

    $(".pageAccount .avgRestart .val").text(
      (testRestarts / testCount).toFixed(1)
    );

    if (resultHistoryChart.data.datasets[0].data.length > 0) {
      resultHistoryChart.options.plugins.trendlineLinear = true;
    } else {
      resultHistoryChart.options.plugins.trendlineLinear = false;
    }

    if (activityChart.data.datasets[0].data.length > 0) {
      activityChart.options.plugins.trendlineLinear = true;
    } else {
      activityChart.options.plugins.trendlineLinear = false;
    }

    let wpmPoints = filteredResults.map((r) => r.wpm).reverse();

    let trend = Misc.findLineByLeastSquares(wpmPoints);

    let wpmChange = trend[1][1] - trend[0][1];

    let wpmChangePerHour = wpmChange * (3600 / totalSecondsFiltered);

    let plus = wpmChangePerHour > 0 ? "+" : "";

    $(".pageAccount .group.chart .below .text").text(
      `Speed change per hour spent typing: ${
        plus + Misc.roundTo2(wpmChangePerHour)
      } wpm.`
    );

    resultHistoryChart.update({ duration: 0 });
    activityChart.update({ duration: 0 });

    swapElements($(".pageAccount .preloader"), $(".pageAccount .content"), 250);
  }
  if (db_getSnapshot() === null) {
    Notifications.add(`Missing account data. Please refresh.`, -1);
    $(".pageAccount .preloader").html("Missing account data. Please refresh.");
  } else if (db_getSnapshot().results === undefined) {
    db_getUserResults().then((d) => {
      if (d) {
        showActiveFilters();
      } else {
        setTimeout(() => {
          changePage("");
        }, 500);
      }
    });
  } else {
    console.log("using db snap");
    try {
      cont();
    } catch (e) {
      console.error(e);
      Notifications.add(`Something went wrong: ${e}`, -1);
    }
  }
}

function showResultEditTagsPanel() {
  if ($("#resultEditTagsPanelWrapper").hasClass("hidden")) {
    $("#resultEditTagsPanelWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125);
  }
}

function hideResultEditTagsPanel() {
  if (!$("#resultEditTagsPanelWrapper").hasClass("hidden")) {
    $("#resultEditTagsPanelWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        (e) => {
          $("#resultEditTagsPanelWrapper").addClass("hidden");
        }
      );
  }
}

$(".pageAccount .toggleAccuracyOnChart").click((params) => {
  toggleChartAccuracy();
});

$(".pageAccount .toggleChartStyle").click((params) => {
  toggleChartStyle();
});

$(document).on("click", ".pageAccount .group.history #resultEditTags", (f) => {
  if (db_getSnapshot().tags.length > 0) {
    let resultid = $(f.target).parents("span").attr("resultid");
    let tags = $(f.target).parents("span").attr("tags");
    $("#resultEditTagsPanel").attr("resultid", resultid);
    $("#resultEditTagsPanel").attr("tags", tags);
    updateActiveResultEditTagsPanelButtons(JSON.parse(tags));
    showResultEditTagsPanel();
  }
});

$(document).on("click", "#resultEditTagsPanelWrapper .button.tag", (f) => {
  $(f.target).toggleClass("active");
});

$("#resultEditTagsPanelWrapper").click((e) => {
  if ($(e.target).attr("id") === "resultEditTagsPanelWrapper") {
    hideResultEditTagsPanel();
  }
});

function updateResultEditTagsPanelButtons() {
  $("#resultEditTagsPanel .buttons").empty();
  db_getSnapshot().tags.forEach((tag) => {
    $("#resultEditTagsPanel .buttons").append(
      `<div class="button tag" tagid="${tag.id}">${tag.name}</div>`
    );
  });
}

function updateActiveResultEditTagsPanelButtons(active) {
  if (active === []) return;
  $.each($("#resultEditTagsPanel .buttons .button"), (index, obj) => {
    let tagid = $(obj).attr("tagid");
    if (active.includes(tagid)) {
      $(obj).addClass("active");
    } else {
      $(obj).removeClass("active");
    }
  });
}

$("#resultEditTagsPanel .confirmButton").click((f) => {
  let resultid = $("#resultEditTagsPanel").attr("resultid");
  let oldtags = JSON.parse($("#resultEditTagsPanel").attr("tags"));

  let newtags = [];
  $.each($("#resultEditTagsPanel .buttons .button"), (index, obj) => {
    let tagid = $(obj).attr("tagid");
    if ($(obj).hasClass("active")) {
      newtags.push(tagid);
    }
  });
  showBackgroundLoader();
  hideResultEditTagsPanel();
  CloudFunctions.updateResultTags({
    uid: firebase.auth().currentUser.uid,
    tags: newtags,
    resultid: resultid,
  }).then((r) => {
    hideBackgroundLoader();
    if (r.data.resultCode === 1) {
      Notifications.add("Tags updated.", 1, 2);
      db_getSnapshot().results.forEach((result) => {
        if (result.id === resultid) {
          result.tags = newtags;
        }
      });

      let tagNames = "";

      if (newtags.length > 0) {
        newtags.forEach((tag) => {
          db_getSnapshot().tags.forEach((snaptag) => {
            if (tag === snaptag.id) {
              tagNames += snaptag.name + ", ";
            }
          });
        });
        tagNames = tagNames.substring(0, tagNames.length - 2);
      }

      let restags;
      if (newtags === undefined) {
        restags = "[]";
      } else {
        restags = JSON.stringify(newtags);
      }

      $(`.pageAccount #resultEditTags[resultid='${resultid}']`).attr(
        "tags",
        restags
      );
      if (newtags.length > 0) {
        $(`.pageAccount #resultEditTags[resultid='${resultid}']`).css(
          "opacity",
          1
        );
        $(`.pageAccount #resultEditTags[resultid='${resultid}']`).attr(
          "aria-label",
          tagNames
        );
      } else {
        $(`.pageAccount #resultEditTags[resultid='${resultid}']`).css(
          "opacity",
          0.25
        );
        $(`.pageAccount #resultEditTags[resultid='${resultid}']`).attr(
          "aria-label",
          "no tags"
        );
      }
    } else {
      Notifications.add("Error updating tags: " + r.data.message, -1);
    }
  });
});

function updateLbMemory(mode, mode2, type, value) {
  db_getSnapshot().lbMemory[mode + mode2][type] = value;
}
$(".pageLogin .register input").keyup((e) => {
  if ($(".pageLogin .register .button").hasClass("disabled")) return;
  if (e.key == "Enter") {
    signUp();
  }
});

$(".pageLogin .register .button").click((e) => {
  if ($(".pageLogin .register .button").hasClass("disabled")) return;
  signUp();
});

$(".pageLogin .login input").keyup((e) => {
  if (e.key == "Enter") {
    configChangedBeforeDb = false;
    signIn();
  }
});

$(".pageLogin .login .button.signIn").click((e) => {
  configChangedBeforeDb = false;
  signIn();
});

$(".pageLogin .login .button.signInWithGoogle").click((e) => {
  configChangedBeforeDb = false;
  signInWithGoogle();
});

$(".signOut").click((e) => {
  signOut();
});

$(".pageAccount .loadMoreButton").click((e) => {
  loadMoreLines();
});

$(".pageLogin #forgotPasswordButton").click((e) => {
  let email = prompt("Email address");
  if (email) {
    firebase
      .auth()
      .sendPasswordResetEmail(email)
      .then(function () {
        // Email sent.
        Notifications.add("Email sent", 1, 2);
      })
      .catch(function (error) {
        // An error happened.
        Notifications.add(error.message, -1);
      });
  }
});
