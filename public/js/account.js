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
  animationSteps: 60,
  type: 'line',
  data: {
    datasets: [
      {
        label: "wpm",
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
    ],
  },
  options: {
    tooltips: {
      // Disable the on-canvas tooltip
      enabled: true,
      titleFontFamily: "Roboto Mono",
      bodyFontFamily: "Roboto Mono",
      intersect: false,
      custom: function(tooltip) {
        if (!tooltip) return;
        // disable displaying the color box;
        tooltip.displayColors = false;
      }, 
      callbacks : { // HERE YOU CUSTOMIZE THE LABELS
        title: function(){
          return;
        },
        beforeLabel : function(tooltipItem, data) {
          let resultData = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
          let label = `${data.datasets[tooltipItem.datasetIndex].label}: ${tooltipItem.yLabel}`
          + '\n' +
          `acc: ${resultData.acc}`
          + '\n\n' +
          `mode: ${resultData.mode} `;
        
          if(resultData.mode == "time"){
            label += resultData.mode2;
          }else if(resultData.mode == "words"){
            label += resultData.mode2;
          }

          label += '\n' +
          `punctuation: ${resultData.punctuation}`
          + '\n' +
          `language: ${resultData.language}`
          + '\n\n' +
          `date: ${moment(resultData.timestamp).format('DD MMM YYYY HH:mm')}`;
        
          return label;
        },
        label : function(tooltipItem, data) {
            return;
        },
        afterLabel : function(tooltipItem, data) {
          return;
        },
      }
    },
    animation: {
      duration: 250
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

Object.keys(words).forEach(language => {
  $(".pageAccount .content .filterButtons .buttons.languages")
  .append(`<div class="button" filter="${language}">${language.replace('_',' ')}</div>`); 
})

let activeFilters = ["all"];


$(document).ready(e =>{
  activeFilters = config.resultFilters;
  console.log(activeFilters);
  activeFilters.forEach(filter => {
    enableFilterButton(filter);
  })
})


function toggleFilterButton(filter){
  const element = $(`.pageAccount .content .filterButtons .button[filter=${filter}]`);
  if(element.hasClass('active')){
    //disable that filter
    
    if(filter == 'all' || filter == 'none'){
      return;
    }else if(filter == "words"){
      $.each($(`.pageAccount .content .filterButtons .buttons.wordsFilter .button`),(index,obj)=>{
        let f = $(obj).attr('filter')
        disableFilterButton(f)
      })
    }else if(filter == "time"){
      $.each($(`.pageAccount .content .filterButtons .buttons.timeFilter .button`),(index,obj)=>{
        let f = $(obj).attr('filter')
        disableFilterButton(f)
      })
    }else if(filter == "puncOff"){
      enableFilterButton("puncOn");
    }else if(filter == "puncOn"){
      enableFilterButton("puncOff");
    }
    disableFilterButton(filter);
    disableFilterButton('all'); 
    
  }else{
    //enable that filter
    disableFilterButton('none');
    
    if(filter == 'all'){
      $.each($(`.pageAccount .content .filterButtons .button`),(index,obj)=>{
        let f = $(obj).attr('filter');
        if(f != 'none'){
          enableFilterButton(f);
        }
      })
    }else if(filter == 'none'){
      disableFilterButton('all');
      $.each($(`.pageAccount .content .filterButtons .button`),(index,obj)=>{
        let f = $(obj).attr('filter');
        if(f != 'none'){
          disableFilterButton(f);
        }
      })
    }else if(filter == "words"){
      $.each($(`.pageAccount .content .filterButtons .buttons.wordsFilter .button`),(index,obj)=>{
        let f = $(obj).attr('filter');
        enableFilterButton(f);
      })
    }else if(filter == "time"){
      $.each($(`.pageAccount .content .filterButtons .buttons.timeFilter .button`),(index,obj)=>{
        let f = $(obj).attr('filter');
        enableFilterButton(f);
      })
    }else if(['10','25','50','100','200'].includes(filter)){
      enableFilterButton('words');
    }else if(['15','30','60','120'].includes(filter)){
      enableFilterButton('time');
    }

    enableFilterButton(filter);
  }
  updateActiveFilters();
}

function disableFilterButton(filter){
  const element = $(`.pageAccount .content .filterButtons .button[filter=${filter}]`);
  element.removeClass('active');
}

function enableFilterButton(filter){
  const element = $(`.pageAccount .content .filterButtons .button[filter=${filter}]`);
  element.addClass('active');
}

function updateActiveFilters(){
  activeFilters = [];
  $.each($(".pageAccount .filterButtons .button"),(i,obj)=>{
    if($(obj).hasClass('active')){
      activeFilters.push($(obj).attr('filter'));
    }
  })
  refreshAccountPage();
}


$('.pageAccount .filterButtons').click('.button',e =>{
  const filter = $(e.target).attr('filter');
  toggleFilterButton(filter);
  config.resultFilters = activeFilters;
  saveConfigToCookie();
})

function refreshAccountPage() {

  function cont(){
    
    let chartData = [];
    
    let topWpm = 0;
    let topMode = '';
    let testRestarts = 0;
    let totalWpm = 0;
    let testCount = 0;

    let wpmLast10total = 0;
    let wpmLast10count = 0;
    $(".pageAccount .history table tbody").empty();
    dbSnapshot.forEach(result => {
      
      //apply filters
      if(!activeFilters.includes(result.mode)){
        return
      }
      if(!activeFilters.includes(String(result.mode2))){
        return
      }
      if(!activeFilters.includes(result.language)){
        return
      }
      let puncfilter = "puncOff";
      if(result.punctuation){
        puncfilter = "puncOn";
      }
      if(!activeFilters.includes(puncfilter)){
        return
      }

      if(wpmLast10count < 10){
        wpmLast10count++;
        wpmLast10total += result.wpm;
      }
      testCount++;


      if (result.restartCount != undefined) {
        testRestarts += result.restartCount;
      }
      let withpunc = '';
      if (result.punctuation) {
        withpunc = 'on';
      }
      $(".pageAccount .history table tbody").append(`
      <tr>
      <td>${result.wpm}</td>
      <td>${result.acc}%</td>
      <td>${result.correctChars}</td>
      <td>${result.incorrectChars}</td>
      <td>${result.mode} ${result.mode2}</td>
      <td>${withpunc}</td>
      <td>${result.language.replace('_',' ')}</td>
      <td>${moment(result.timestamp).format('DD MMM YYYY HH:mm')}</td>
      </tr>`)
      chartData.push({
        x: result.timestamp,
        y: result.wpm,
        acc: result.acc,
        mode: result.mode,
        mode2: result.mode2,
        punctuation: result.punctuation,
        language: result.language,
        timestamp: result.timestamp
      });

      if (result.wpm > topWpm) {
        topWpm = result.wpm;
      }

      totalWpm += result.wpm;
    })
    ////////

    let totalWpm10 = 0;

    let mainColor = getComputedStyle(document.body).getPropertyValue('--main-color').replace(' ', '');
    let subColor = getComputedStyle(document.body).getPropertyValue('--sub-color').replace(' ','');
  
    resultHistoryChart.options.scales.xAxes[0].ticks.minor.fontColor = subColor;
    resultHistoryChart.options.scales.yAxes[0].ticks.minor.fontColor = subColor;
    resultHistoryChart.data.datasets[0].borderColor = mainColor;
    resultHistoryChart.options.legend.labels.fontColor = subColor;

    resultHistoryChart.data.datasets[0].data = chartData;

    $(".pageAccount .highestWpm .val").text(topWpm);
    $(".pageAccount .averageWpm .val").text(Math.round(totalWpm/testCount));
    $(".pageAccount .averageWpm10 .val").text(Math.round(wpmLast10total/wpmLast10count));
    // $(".pageAccount .highestWpm .mode").html(topMode);
    $(".pageAccount .testsTaken .val").text(testCount);

    $(".pageAccount .testsStarted .val").text(
      `${testCount + testRestarts}`
    );

    $(".pageAccount .testsCompleted .val").text(
      `${testCount}(${Math.floor((testCount / (testCount + testRestarts) * 100))}%)`
    );

    $(".pageAccount .avgRestart .val").text(
      ((testRestarts) / testCount).toFixed(1)
    );

    // if(testCount == 0){
    //   $('.pageAccount .group.chart').fadeOut(125);
    //   $('.pageAccount .triplegroup.stats').fadeOut(125);
    //   $('.pageAccount .group.history').fadeOut(125);
    // }else{
    //   $('.pageAccount .group.chart').fadeIn(125);
    //   $('.pageAccount .triplegroup.stats').fadeIn(125);
    //   $('.pageAccount .group.history').fadeIn(125);
    // }

    // let favMode = testModes.words10;
    // let favModeName = 'words10';
    // $.each(testModes, (key, mode) => {
    //   if (mode.length > favMode.length) {
    //     favMode = mode;
    //     favModeName = key;
    //   }
    // })
    // if (favModeName == 'words10' && testModes.words10.length == 0) {
    //   //new user  
    //   $(".pageAccount .favouriteTest .val").text(`-`);
    // } else {
    //   $(".pageAccount .favouriteTest .val").text(`${favModeName} (${Math.floor((favMode.length/testCount) * 100)}%)`);
    // }

    
    resultHistoryChart.update();
    
    swapElements($(".pageAccount .preloader"), $(".pageAccount .content"), 250);
  }

  if (dbSnapshot == null) {
    // console.log('no db snap');
    db_getUserResults().then(data => {
      if(!data) return;
      dbSnapshot = data;
      cont();
    })
  } else {
    // console.log('using db snap');
    cont();
  }
}
