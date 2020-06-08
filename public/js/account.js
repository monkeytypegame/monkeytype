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

$(".pageAccount .loadMoreButton").click(e => {
  loadMoreLines();
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
  let nname = $(".pageLogin .register input")[0].value;
  let email = $(".pageLogin .register input")[1].value;
  let password = $(".pageLogin .register input")[2].value;
  let passwordVerify = $(".pageLogin .register input")[3].value;

  const namecheck = firebase.functions().httpsCallable('checkNameAvailability')

  namecheck({name:nname}).then(d => {
    if(d.data === 0){
      showNotification("Name unavailable", 3000);
      $(".pageLogin .preloader").addClass('hidden');
      return;
    }else if(d.data === 1){
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
  })



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
    db_getUserSnapshot();
    var displayName = user.displayName;
    var email = user.email;
    var emailVerified = user.emailVerified;
    var photoURL = user.photoURL;
    var isAnonymous = user.isAnonymous;
    var uid = user.uid;
    var providerData = user.providerData;
    showNotification('Signed in', 1000);
    $(".pageLogin .preloader").addClass('hidden');
    updateAccountLoginButton();
    verifyUsername();
    $("#menu .button.account .text").text(displayName);
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
        trendlineLinear: {
          style: "rgba(255,105,180, .8)",
          lineStyle: "dotted",
          width: 2
        }
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

          let diff = resultData.difficulty;
          if(diff == undefined){
            diff = "normal"
          }
          label += '\n' +
          `difficulty: ${diff}`

          

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
      display: false,
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
    },
  }
});

Object.keys(words).forEach(language => {
  $(".pageAccount .content .filterButtons .buttons.languages")
  .append(`<div class="button" filter="${language}">${language.replace('_',' ')}</div>`); 
})

let activeFilters = ["all"];


$(document).ready(e =>{
  activeFilters = config.resultFilters;
  // console.log(activeFilters);
  if(activeFilters.includes("all")){
    toggleFilterButton("all")
  }else{
    activeFilters.forEach(filter => {
      toggleFilterButton(filter);
    })
  }
})


function toggleFilterButton(filter){
  const element = $(`.pageAccount .content .filterButtons .button[filter=${filter}]`);
  if(element.hasClass('active')){
    //disable that filter
    
    if(filter == 'all' || filter == 'none'){
      return;
    }else if(filter == "mode_words"){
      // $.each($(`.pageAccount .content .filterButtons .buttons.wordsFilter .button`),(index,obj)=>{
      //   let f = $(obj).attr('filter')
      //   disableFilterButton(f)
      // })
    }else if(filter == "mode_time"){
      // $.each($(`.pageAccount .content .filterButtons .buttons.timeFilter .button`),(index,obj)=>{
      //   let f = $(obj).attr('filter')
      //   disableFilterButton(f)
      // })
    }else if(filter == "punc_off"){
      enableFilterButton("punc_on");
    }else if(filter == "punc_on"){
      enableFilterButton("punc_off");
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
    }
    // else if(filter == "mode_words"){
    //   $.each($(`.pageAccount .content .filterButtons .buttons.wordsFilter .button`),(index,obj)=>{
    //     let f = $(obj).attr('filter');
    //     enableFilterButton(f);
    //   })
    // }else if(filter == "mode_time"){
    //   $.each($(`.pageAccount .content .filterButtons .buttons.timeFilter .button`),(index,obj)=>{
    //     let f = $(obj).attr('filter');
    //     enableFilterButton(f);
    //   })
    // }else if(['10','25','50','100','200'].includes(filter)){
    //   enableFilterButton('words');
    // }else if(['15','30','60','120'].includes(filter)){
    //   enableFilterButton('time');
    // }

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


function showChartPreloader(){
  $(".pageAccount .group.chart .preloader").stop(true,true).animate({
    opacity: 1
  },125);
}

function hideChartPreloader(){
  $(".pageAccount .group.chart .preloader").stop(true,true).animate({
    opacity: 0
  },125);
}


$('.pageAccount .filterButtons').click('.button',e =>{
  const filter = $(e.target).attr('filter');
  toggleFilterButton(filter);
  config.resultFilters = activeFilters;
  saveConfigToCookie();
})

let filteredResults = [];
let visibleTableLines = 0;

function loadMoreLines(){
  if(filteredResults == [] || filteredResults.length == 0) return;
  for(let i = visibleTableLines; i < visibleTableLines+10; i++){
    result = filteredResults[i];
    if(result == undefined) continue;
    let withpunc = '';
    if (result.punctuation) {
      withpunc = '<br>punctuation';
    }
    if (result.blindMode) {
      withpunc = '<br>blind';
    }
    let diff = result.difficulty;
    if (diff == undefined){
      diff = 'normal';
    }

    let raw = result.rawWpm;
    if (raw == undefined){
      raw = '-';
    }
    
    $(".pageAccount .history table tbody").append(`
    <tr>
    <td>${Math.round(result.wpm)}</td>
    <td>${Math.round(raw)}</td>
    <td>${Math.round(result.acc)}%</td>
    <td>${result.correctChars}</td>
    <td>${result.incorrectChars}</td>
    <td>${result.mode} ${result.mode2}${withpunc}</td>
    <td>${diff}</td>
    <td>${result.language.replace('_','<br>')}</td>
    <td>${moment(result.timestamp).format('DD MMM YYYY<br>HH:mm')}</td>
    </tr>`);
  }
  visibleTableLines+=10;
}

function refreshAccountPage() {

  function cont(){
    
    let chartData = [];
    visibleTableLines = 0;
    
    let topWpm = 0;
    let topMode = '';
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
      max: 0
    }

    let totalSeconds = 0;
    let totalSecondsFiltered = 0;
    
    let tableEl = "";

    filteredResults = [];
    $(".pageAccount .history table tbody").empty();
    dbSnapshot.results.forEach(result => {


      let tt = 0;
      if(result.testDuration == undefined){
        //test finished before testDuration field was introduced - estimate
        if(result.mode == "time"){
          tt = parseFloat(result.mode2);
        }else if(result.mode == "words"){
          tt = (parseFloat(result.mode2)/parseFloat(result.wpm)) * 60;
        }
      }else{
        tt = parseFloat(result.testDuration);
      }
      if(result.incompleteTestSeconds != undefined){
        tt += result.incompleteTestSeconds;
      }else if(result.restartCount != undefined && result.restartCount > 0){
        tt += (tt/4) * result.restartCount;
      }
      totalSeconds += tt;


      // console.log(result);
      //apply filters
      let resdiff = result.difficulty;
      if(resdiff == undefined){
        resdiff = "normal";
      }
      if(!activeFilters.includes("difficulty_"+resdiff)) return;
      if(!activeFilters.includes("mode_"+result.mode)) return;
      if(result.mode == "time"){
        let timefilter = "time_custom";
        if([15,30,60,120].includes(parseInt(result.mode2))){
          timefilter = "time_"+result.mode2;
        }
        if(!activeFilters.includes(timefilter)) return;
      }else if(result.mode == "words"){
        let wordfilter = "words_custom";
        if([10,25,50,100,200].includes(parseInt(result.mode2))){
          wordfilter = "words_"+result.mode2;
        }
        if(!activeFilters.includes(wordfilter)) return;
      }

      if(!activeFilters.includes(result.language)) return;

      let puncfilter = "punc_off";
      if(result.punctuation){
        puncfilter = "punc_on";
      }
      if(!activeFilters.includes(puncfilter)) return;

      filteredResults.push(result);

      //filters done

      tt = 0;
      if(result.timeDuration == null){
        //test finished before timeduration field was introduced - estimate
        if(result.mode == "time"){
          tt = parseFloat(result.mode2);
        }else if(result.mode == "words"){
          tt = (parseFloat(result.mode2)/parseFloat(result.wpm)) * 60;
        }
      }else{
        tt = parseFloat(result.timeDuration);
      }
      if(result.restartCount != null){
        tt += (tt/4) * result.restartCount;
      }
      totalSecondsFiltered += tt;



      if(last10 < 10){
        last10++;
        wpmLast10total += result.wpm;
        totalAcc10 += result.acc;
      }
      testCount++;


      if(result.rawWpm != null){
        if(rawWpm.last10Count < 10){
          rawWpm.last10Count++;
          rawWpm.last10Total += result.rawWpm;
        }
        rawWpm.total += result.rawWpm;
        rawWpm.count++;
        if(result.rawWpm > rawWpm.max){
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
        difficulty: result.difficulty
      });

      if (result.wpm > topWpm) {
        let puncsctring = result.punctuation ? ",<br>with punctuation" : "";
        topWpm = result.wpm;
        topMode = result.mode + " " + result.mode2 + puncsctring;
      }

      totalWpm += result.wpm;
    })
    loadMoreLines();
    ////////

    let mainColor = getComputedStyle(document.body).getPropertyValue('--main-color').replace(' ', '');
    let subColor = getComputedStyle(document.body).getPropertyValue('--sub-color').replace(' ','');
  
    resultHistoryChart.options.scales.xAxes[0].ticks.minor.fontColor = subColor;
    resultHistoryChart.options.scales.yAxes[0].ticks.minor.fontColor = subColor;
    resultHistoryChart.data.datasets[0].borderColor = mainColor;
    resultHistoryChart.options.legend.labels.fontColor = subColor;
    resultHistoryChart.data.datasets[0].trendlineLinear.style = subColor;

    resultHistoryChart.data.datasets[0].data = chartData;

    if(chartData == [] || chartData.length == 0){
      $(".pageAccount .group.noDataError").removeClass('hidden');
      $(".pageAccount .group.chart").addClass('hidden');
      $(".pageAccount .group.history").addClass('hidden');
      $(".pageAccount .triplegroup.stats").addClass('hidden');
    }else{
      $(".pageAccount .group.noDataError").addClass('hidden');
      $(".pageAccount .group.chart").removeClass('hidden');
      $(".pageAccount .group.history").removeClass('hidden');
      $(".pageAccount .triplegroup.stats").removeClass('hidden');
    }

    $(".pageAccount .timeTotal .val").text(moment.utc(moment.duration(totalSeconds, "seconds").asMilliseconds()).format("HH:mm:ss"));
    $(".pageAccount .timeTotalFiltered .val").text(moment.utc(moment.duration(totalSecondsFiltered, "seconds").asMilliseconds()).format("HH:mm:ss"));


    $(".pageAccount .highestWpm .val").text(topWpm);
    $(".pageAccount .averageWpm .val").text(Math.round(totalWpm/testCount));
    $(".pageAccount .averageWpm10 .val").text(Math.round(wpmLast10total/last10));

    $(".pageAccount .highestRaw .val").text(rawWpm.max);
    $(".pageAccount .averageRaw .val").text(Math.round(rawWpm.total/rawWpm.count));
    $(".pageAccount .averageRaw10 .val").text(Math.round(rawWpm.last10Total/rawWpm.last10Count));

    $(".pageAccount .highestWpm .mode").html(topMode);
    $(".pageAccount .testsTaken .val").text(testCount);

    $(".pageAccount .avgAcc .val").text(Math.round(totalAcc/testCount)+"%");
    $(".pageAccount .avgAcc10 .val").text(Math.round(totalAcc10/last10)+"%");

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

    if(resultHistoryChart.data.datasets[0].length > 0){
      resultHistoryChart.options.plugins.trendlineLinear = true;
    }else{
      resultHistoryChart.options.plugins.trendlineLinear = false;
    }
    
    resultHistoryChart.update({duration: 0});
    
    swapElements($(".pageAccount .preloader"), $(".pageAccount .content"), 250);
  }

  if (dbSnapshot.length == 0) {
    // console.log('no db snap');
    // db_getUserResults().then(data => {
    //   if(!data) return;
    //   dbSnapshot = data;
    //   cont();
    // })
  } else {
    // console.log('using db snap');
    cont();
  }
}
