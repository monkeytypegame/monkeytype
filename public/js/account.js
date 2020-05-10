$(".pageAccount .register input").keyup(e => {
  if (e.key == "Enter") {

    let name = $(".pageAccount .register input")[0].value;
    let email = $(".pageAccount .register input")[1].value;
    let password = $(".pageAccount .register input")[2].value;

    firebase.auth().createUserWithEmailAndPassword(email, password).then(user => {
      // Account has been created here.
      let usr = user.user;
      usr.updateProfile({
        displayName: name
      }).then(function() {
        // Update successful.
        alert('user created');
      }).catch(function(error) {
        // An error happened.
        usr.delete().then(function() {
          // User deleted.
          alert('cant have this display name');
        }).catch(function(error) {
          // An error happened.

        });
      });
    }).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      alert(errorMessage);
    });


  }
})

$(".pageLogin .login input").keyup(e => {
  if (e.key == "Enter") {

    let email = $(".pageLogin .login input")[0].value;
    let password = $(".pageLogin .login input")[1].value;

    firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
      alert(error.message);
    });


  }
})



function signOut() {
  firebase.auth().signOut().then(function() {
    alert('signed out');
  }).catch(function(error) {
    alert(error.message);
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
    console.log('user signed in');
    // ...
  } else {
    // User is signed out.
    // ...
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
    legend: {
      display: true,
      labels: {
        defaultFontFamily: "Roboto Mono"
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
        type: 'time',
        bounds: 'ticks',

        distribution: 'series',
        display: false,
        scaleLabel: {
          display: true,
          labelString: 'Date'
        },
      }],
      yAxes: [{
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
  db_getUserResults().then(data => {

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

    let testCount = data.length;

    data.forEach(result => {
      let withpunc = '';
      if (result.punctuation) {
        withpunc = ', with punctuation';
      }
      $(".pageAccount .history table tbody").prepend(`
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
        let puncsctring = result.punctuation ? ",<br>with punctuatin" : "";
        topWpm = result.wpm;
        topMode = result.mode + " " + result.mode2 + puncsctring;
      }
    })

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



    resultHistoryChart.update({ duration: 0 });

    $(".pageAccount .highestWpm .val").text(topWpm);
    $(".pageAccount .highestWpm .mode").html(topMode);

    $(".pageAccount .testsTaken .val").text(testCount);

    let favMode = testModes.words10;
    let favModeName = 'words10';
    $.each(testModes, (key, mode) => {
      if (mode.length > favMode.length) {
        favMode = mode;
        favModeName = key;
      }
    })

    $(".pageAccount .favouriteTest .val").text(`${favModeName} (${Math.floor((favMode.length/testCount) * 100)}%)`);



    $(".page.pageAccount").removeClass('hidden');
  })
}