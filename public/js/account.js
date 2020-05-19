$(".pageLogin .register input").keyup(e => {
  if (e.key == "Enter") {
    signUp();
  }
})

$(".pageLogin .register .button").click(e => {
    signUp();
})

$(".pageLogin .login input").keyup(e => {
  if (e.key == "Enter") {
    signIn();
  }
})

$(".pageLogin .login .button").click(e => {
  signIn();
})

$(".signOut").click(e => {
  signOut();
})

function showSignOutButton() {
  $(".signOut").removeClass('hidden').css("opacity",1);
}

function hideSignOutButton() {
  $(".signOut").css("opacity",0).addClass('hidden');
}

function signIn() {
  $(".pageLogin .preloader").removeClass('hidden');
  let email = $(".pageLogin .login input")[0].value;
  let password = $(".pageLogin .login input")[1].value;

  firebase.auth().signInWithEmailAndPassword(email, password).then(e => {
    changePage('account');
  }).catch(function(error) {
    showNotification(error.message, 5000);
    $(".pageLogin .preloader").addClass('hidden');
  });
}

function signUp() {
  $(".pageLogin .preloader").removeClass('hidden');
  let name = $(".pageLogin .register input")[0].value;
  let email = $(".pageLogin .register input")[1].value;
  let password = $(".pageLogin .register input")[2].value;
  let passwordVerify = $(".pageLogin .register input")[3].value;

  if (name == "") {
    showNotification("Name is required", 3000);
    $(".pageLogin .preloader").addClass('hidden');
    return;
  }

  if (password != passwordVerify) {
    showNotification("Passwords do not match", 3000);
    $(".pageLogin .preloader").addClass('hidden');
    return;
  }

  firebase.auth().createUserWithEmailAndPassword(email, password).then(user => {
    // Account has been created here.
    let usr = user.user;
    usr.updateProfile({
      displayName: name
    }).then(function() {
      // Update successful.
      showNotification("Account created", 2000);
      try{
        firebase.analytics().logEvent("accountCreated", usr.uid);
      }catch(e){
        console.log("Analytics unavailable");
      }
      $(".pageLogin .preloader").addClass('hidden');
      changePage('account');
    }).catch(function(error) {
      // An error happened.
      usr.delete().then(function() {
        // User deleted.
        showNotification("Name invalid", 2000);
         $(".pageLogin .preloader").addClass('hidden');
      }).catch(function(error) {
        // An error happened.
        $(".pageLogin .preloader").addClass('hidden');
      });
    });
  }).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    showNotification(errorMessage, 5000);
    $(".pageLogin .preloader").addClass('hidden');
  });


}

function signOut() {
  firebase.auth().signOut().then(function() {
    showNotification("Signed out", 2000);
    updateAccountLoginButton();
    changePage('login');
    dbSnapshot = null;
  }).catch(function(error) {
    showNotification(error.message, 5000);
  });
}

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in.
    var displayName = user.displayName;
    var email = user.email;
    var emailVerified = user.emailVerified;
    var photoURL = user.photoURL;
    var isAnonymous = user.isAnonymous;
    var uid = user.uid;
    var providerData = user.providerData;
    showNotification('Signed in', 2000);
    $(".pageLogin .preloader").addClass('hidden');
    updateAccountLoginButton() 
  }
});

var resultHistoryChart = new Chart($(".pageAccount #resultHistoryChart"), {
  type: 'line',
  data: {
    datasets: [
      {
        label: "words 10",
        fill: false,
        data: [],
        borderColor: '#f44336',
        borderWidth: 2,
        // trendlineLinear: {
        //   style: "rgba(244,67,54,.25)",
        //   lineStyle: "solid",
        //   width: 1
        // }
      },
      {
        label: "words 25",
        fill: false,
        data: [],
        borderColor: '#FF5722',
        borderWidth: 2,
        // trendlineLinear: {
        //   style: "rgba(255,87,34,.25)",
        //   lineStyle: "solid",
        //   width: 1
        // }
      },
      {
        label: "words 50",
        fill: false,
        data: [],
        borderColor: '#FF9800',
        borderWidth: 2,
        // trendlineLinear: {
        //   style: "rgba(255,152,0,.25)",
        //   lineStyle: "solid",
        //   width: 1
        // }
      },
      {
        label: "words 100",
        fill: false,
        data: [],
        borderColor: '#FFC107',
        borderWidth: 2,
        // trendlineLinear: {
        //   style: "rgba(255,193,7,.25)",
        //   lineStyle: "solid",
        //   width: 1
        // }
      },
      {
        label: "words 200",
        fill: false,
        data: [],
        borderColor: '#FFEB3B',
        borderWidth: 2,
        // trendlineLinear: {
        //   style: "rgba(255,235,59,.25)",
        //   lineStyle: "solid",
        //   width: 1
        // }
      },
      {
        label: "time 15",
        fill: false,
        data: [],
        borderColor: '#3F51B5',
        borderWidth: 2,
        // trendlineLinear: {
        //   style: "rgba(63,81,181,.25)",
        //   lineStyle: "solid",
        //   width: 1
        // }
      },
      {
        label: "time 30",
        fill: false,
        data: [],
        borderColor: '#2196F3',
        borderWidth: 2,
        // trendlineLinear: {
        //   style: "rgba(33,150,243,.25)",
        //   lineStyle: "solid",
        //   width: 1
        // }
      },
      {
        label: "time 60",
        fill: false,
        data: [],
        borderColor: '#03A9F4',
        borderWidth: 2,
        // trendlineLinear: {
        //   style: "rgba(3,169,244,.25)",
        //   lineStyle: "solid",
        //   width: 1
        // }
      },
      {
        label: "time 120",
        fill: false,
        data: [],
        borderColor: '#00BCD4',
        borderWidth: 2,
        // trendlineLinear: {
        //   style: "rgba(0,188,212,.25)",
        //   lineStyle: "solid",
        //   width: 1
        // }
      },
      {
        label: "custom",
        fill: false,
        data: [],
        borderColor: '#4CAF50',
        borderWidth: 2,
        // trendlineLinear: {
        //   style: "rgba(76,175,80,.25)",
        //   lineStyle: "solid",
        //   width: 1
        // }
      }
    ],
  },
  options: {
    tooltips: {
      titleFontFamily: "Roboto Mono",
      bodyFontFamily: "Roboto Mono"
    },
    legend: {
      display: true,
      labels: {
        fontFamily: "Roboto Mono",
        fontColor: "#ffffff"
      }
    },
    responsive: true,
    // maintainAspectRatio: false,
    // tooltips: {
    //   mode: 'index',
    //   intersect: false,
    // },
    hover: {
      mode: 'nearest',
      intersect: true
    },
    scales: {
      xAxes: [{
        ticks: {
          fontFamily: "Roboto Mono"
        },
        type: 'time',
        time: {
          tooltipFormat:'DD MMM YYYY HH:mm'
        },
        bounds: 'ticks',
        distribution: 'series',
        display: false,
        scaleLabel: {
          display: true,
          labelString: 'Date'
        },
      }],
      yAxes: [{
        ticks: {
          fontFamily: "Roboto Mono",
          beginAtZero: true
        },
        display: true,
        scaleLabel: {
          display: false,
          labelString: 'Words per Minute'
        }
      }]
    }
  }
});


function refreshAccountPage() {

  function cont(){
    
    let testModes = {
      words10: [],
      words25: [],
      words50: [],
      words100: [],
      words200: [],
      time15: [],
      time30: [],
      time60: [],
      time120: [],
      custom: []
    }
    
    let topWpm = 0;
    let topMode = '';
    let testRestarts = 0;
    let totalWpm = 0;

    let testCount = dbSnapshot.length;
    $(".pageAccount .history table tbody").empty();
    dbSnapshot.forEach(result => {
      if (result.restartCount != undefined) {
        testRestarts += result.restartCount;
      }
      let withpunc = '';
      if (result.punctuation) {
        withpunc = ', with punctuation';
      }
      $(".pageAccount .history table tbody").append(`
      <tr>
      <td>${result.wpm}</td>
      <td>${result.acc}%</td>
      <td>${result.correctChars}</td>
      <td>${result.incorrectChars}</td>
      <td>${result.mode} ${result.mode2}${withpunc}</td>
      <td>${moment(result.timestamp).format('DD MMM YYYY HH:mm')}</td>
      </tr>`)
      if (result.mode == "words" && result.mode2 == 10) {
        testModes.words10.push({ x: result.timestamp, y: result.wpm });
      }
      if (result.mode == "words" && result.mode2 == 25) {
        testModes.words25.push({ x: result.timestamp, y: result.wpm });
      }
      if (result.mode == "words" && result.mode2 == 50) {
        testModes.words50.push({ x: result.timestamp, y: result.wpm });
      }
      if (result.mode == "words" && result.mode2 == 100) {
        testModes.words100.push({ x: result.timestamp, y: result.wpm });
      }
      if (result.mode == "words" && result.mode2 == 200) {
        testModes.words200.push({ x: result.timestamp, y: result.wpm });
      }
      if (result.mode == "time" && result.mode2 == 15) {
        testModes.time15.push({ x: result.timestamp, y: result.wpm });
      }
      if (result.mode == "time" && result.mode2 == 30) {
        testModes.time30.push({ x: result.timestamp, y: result.wpm });
      }
      if (result.mode == "time" && result.mode2 == 60) {
        testModes.time60.push({ x: result.timestamp, y: result.wpm });
      }
      if (result.mode == "time" && result.mode2 == 120) {
        testModes.time120.push({ x: result.timestamp, y: result.wpm });
      }
      if (result.mode == "custom") {
        testModes.custom.push({ x: result.timestamp, y: result.wpm });
      }

      if (result.wpm > topWpm) {
        let puncsctring = result.punctuation ? ",<br>with punctuation" : "";
        topWpm = result.wpm;
        topMode = result.mode + " " + result.mode2 + puncsctring;
      }

      totalWpm += result.wpm;
    })

    let subColor = getComputedStyle(document.body).getPropertyValue('--sub-color').replace(' ','');
  
    resultHistoryChart.options.scales.xAxes[0].ticks.minor.fontColor = subColor;
    resultHistoryChart.options.scales.yAxes[0].ticks.minor.fontColor = subColor;
    resultHistoryChart.options.legend.labels.fontColor = subColor;

    resultHistoryChart.data.datasets[0].data = testModes.words10;
    resultHistoryChart.data.datasets[1].data = testModes.words25;
    resultHistoryChart.data.datasets[2].data = testModes.words50;
    resultHistoryChart.data.datasets[3].data = testModes.words100;
    resultHistoryChart.data.datasets[4].data = testModes.words200;
    resultHistoryChart.data.datasets[5].data = testModes.time15;
    resultHistoryChart.data.datasets[6].data = testModes.time30;
    resultHistoryChart.data.datasets[7].data = testModes.time60;
    resultHistoryChart.data.datasets[8].data = testModes.time120;
    resultHistoryChart.data.datasets[9].data = testModes.custom;

    $(".pageAccount .highestWpm .val").text(topWpm);
    $(".pageAccount .averageWpm .val").text(Math.round(totalWpm/testCount));
    $(".pageAccount .highestWpm .mode").html(topMode);
    $(".pageAccount .testsTaken .val").text(testCount);

    $(".pageAccount .testCompletion .val").text(
      Math.floor((testCount / (testCount + testRestarts) * 100)) + "%"
    );

    $(".pageAccount .avgRestart .val").text(
      ((testCount + testRestarts) / testCount).toFixed(1)
    );

    let favMode = testModes.words10;
    let favModeName = 'words10';
    $.each(testModes, (key, mode) => {
      if (mode.length > favMode.length) {
        favMode = mode;
        favModeName = key;
      }
    })
    if (favModeName == 'words10' && testModes.words10.length == 0) {
      //new user  
      $(".pageAccount .favouriteTest .val").text(`-`);
    } else {
      $(".pageAccount .favouriteTest .val").text(`${favModeName} (${Math.floor((favMode.length/testCount) * 100)}%)`);
    }

    
    resultHistoryChart.update({ duration: 0 });
    
    swapElements($(".pageAccount .preloader"), $(".pageAccount .content"), 250);
  }

  if (dbSnapshot == null) {
    // console.log('no db snap');
    db_getUserResults().then(data => {
      cont();
    })
  } else {
    // console.log('using db snap');
    cont();
  }
}