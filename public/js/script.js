let wordsList = [];
let currentWordIndex = 0;
let inputHistory = [];
let currentInput = "";
let time = 0;
let timers = [];
let testActive = false;
let testStart, testEnd;
let wpmHistory = [];
let rawHistory = [];
let restartCount = 0;
let incompleteTestSeconds = 0;
let currentTestLine = 0;
let pageTransition = false;
let keypressPerSecond = [];
let currentKeypressCount = 0;
let afkDetected = false;
let errorsPerSecond = [];
let currentErrorCount = 0;
let resultVisible = false;
let activeWordTopBeforeJump = 0;
let activeWordTop = 0;
let activeWordJumped = false;
let sameWordset = false;

let accuracyStats = {
  correct: 0,
  incorrect: 0
}

let customText = "The quick brown fox jumps over the lazy dog";

const testCompleted = firebase.functions().httpsCallable('testCompleted');

function showNotification(text, time) {
  let noti = $(".notification");
  noti.text(text);
  noti.css('top', `-${noti.outerHeight()}px`);
  noti.stop(true, true).animate({
    top: "1rem"
  }, 250, 'swing', () => {
    noti.stop(true, true).animate({
      opacity: 1
    }, time, () => {
      noti.stop(true, true).animate({
        top: `-${noti.outerHeight()}px`
      }, 250, 'swing');
    })
  });
}

function copyResultToClipboard() {
  let src = $('#middle');
  var sourceX = src.position().left;/*X position from div#target*/
  var sourceY = src.position().top;/*Y position from div#target*/
  var sourceWidth = src.width();/*clientWidth/offsetWidth from div#target*/
  var sourceHeight = src.height();/*clientHeight/offsetHeight from div#target*/

  let bgColor = getComputedStyle(document.body).getPropertyValue('--bg-color').replace(' ', '');

  html2canvas(document.body,{
    backgroundColor: bgColor,
    height: sourceHeight + 50,
    width: sourceWidth + 50,
    x: sourceX - 25,
    y: sourceY - 25
  }).then(function(canvas) {
    // document.body.appendChild(canvas);
    canvas.toBlob(function(blob) {
      navigator.clipboard
        .write([
          new ClipboardItem(
            Object.defineProperty({}, blob.type, {
              value: blob,
              enumerable: true
            })
          )
        ])
    });
    showNotification('Copied to clipboard',1000);
  });
}

function getReleasesFromGitHub() {
  $.getJSON("https://api.github.com/repos/Miodec/monkey-type/releases", data => {
    $('#bottom .version').text(data[0].name).css('opacity', 1);
    $("#versionHistory .releases").empty();
    data.forEach(release => {
      if (!release.draft && !release.prerelease) {
        $("#versionHistory .releases").append(`
          <div class="release">
            <div class="title">${release.name}</div>
            <div class="date">${moment(release.published_at).format('DD MMM YYYY')}</div>
            <div class="body">${release.body.replace(/\r\n/g, '<br>')}</div>
          </div>
        `);
      }
    })
  })
}

function verifyUsername(){
//   test = firebase.functions().httpsCallable('moveResults')
// test2 = firebase.functions().httpsCallable('getNames')
// test3 = firebase.functions().httpsCallable('checkNameAvailability')
  const check = firebase.functions().httpsCallable('checkIfNeedsToChangeName')
  check({uid: firebase.auth().currentUser.uid}).then(data => {
    if(data.data === 1){
      $('.nameChangeMessage').slideDown();
    }else if(data.data === 2){
      $('.nameChangeMessage').slideDown();
    }
  })

  $('.nameChangeMessage').click(e => {
    alert(`Im currently preparing the system to be ready for leaderboards and other awesome features - it looks like you need to change your display name.
    
    It either contains special characters, or your display name is the same as someone elses and your account was made later.
    
    Sorry for this inconvenience.
    `);
    let newName = prompt('Please provide a new username - you can use lowercase and uppercase characters, numbers and one of these special characters ( . _ - ). The new name cannot be longer than 12 characters.',firebase.auth().currentUser.displayName);
    
    cn = firebase.functions().httpsCallable('changeName');
    cn({uid:firebase.auth().currentUser.uid,name:newName}).then(d => {
      if(d.data === 1){
        //all good
        alert('Thanks! All good.');
        location.reload();
        $('.nameChangeMessage').slideUp();
      }else if(d.data === 0){
        //invalid or unavailable
        alert('Name invalid or taken. Try again.');
      }else if(d.data === -1){
        //error
        alert('Unknown error. Contact Miodec on Discord.');
      }
    });
    
  })
}

function getLastChar(word) {
  return word.charAt(word.length - 1);
}

function setFocus(foc) {
  if (foc) {
    // focus = true;
    stopCaretAnimation();
    $("#top").addClass("focus");
    $("#bottom").addClass("focus");
    $("body").css("cursor", "none");
  } else {
    startCaretAnimation();
    $("#top").removeClass("focus");
    $("#bottom").removeClass("focus");
    $("body").css("cursor", "default");
  }
}

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function roundedToFixed(float, digits){
  let rounded = Math.pow(10, digits);
  return (Math.round(float * rounded) / rounded).toFixed(digits);
}

function initWords() {
  testActive = false;
  wordsList = [];
  currentWordIndex = 0;
  accuracyStats = {
    correct: 0,
    incorrect: 0
  }
  inputHistory = [];
  currentInput = "";

  let language = words[config.language];

  if (language == undefined || language == []) {
    config.language = "english";
    language = words[config.language];
  }

  if (config.mode == "time" || config.mode == "words") {

    let wordsBound = config.mode == "time" ? 60 : config.words;
    for (let i = 0; i < wordsBound; i++) {
      randomWord = language[Math.floor(Math.random() * language.length)];
      previousWord = wordsList[i - 1];
      while (randomWord == previousWord || (!config.punctuation && randomWord == "I") || randomWord.indexOf(' ') > -1) {
        randomWord = language[Math.floor(Math.random() * language.length)];
      }
      if (config.punctuation && config.mode != "custom"){
        randomWord = punctuateWord(previousWord, randomWord, i, wordsBound);
      }
      wordsList.push(randomWord);
    }

  } else if (config.mode == "custom") {
    let w = customText.split(" ");
    for (let i = 0; i < w.length; i++) {
      wordsList.push(w[i]);
    }
  }
  showWords();
}

function emulateLayout(event){
  if (config.layout == "default")
    return event;
  const qwertyMasterLayout = {"Backquote":"`~","Digit1":"1!","Digit2":"2@","Digit3":"3#","Digit4":"4$","Digit5":"5%","Digit6":"6^","Digit7":"7&","Digit8":"8*","Digit9":"9(","Digit0":"0)","Minus":"-_","Equal":"=+","KeyQ":"qQ","KeyW":"wW","KeyE":"eE","KeyR":"rR","KeyT":"tT","KeyY":"yY","KeyU":"uU","KeyI":"iI","KeyO":"oO","KeyP":"pP","BracketLeft":"[{","BracketRight":"]}","KeyA":"aA","KeyS":"sS","KeyD":"dD","KeyF":"fF","KeyG":"gG","KeyH":"hH","KeyJ":"jJ","KeyK":"kK","KeyL":"lL","Semicolon":";:","Quote":"'\"","Backslash":"\\|","KeyZ":"zZ","KeyX":"xX","KeyC":"cC","KeyV":"vV","KeyB":"bB","KeyN":"nN","KeyM":"mM","Comma":",<","Period":".>","Slash":"/?","Space":"  "}
  let layoutMap = layouts[config.layout];
  let qwertyMap = layouts["qwerty"];

  let qwertyKey = qwertyMasterLayout[event.code];
  let mapIndex;
  let newKey;
  let shift = event.shiftKey ? 1 : 0;
  for (let i = 0; i < qwertyMap.length; i++) {
    const key = qwertyMap[i];
    let keyIndex = key.indexOf(qwertyKey);
    if (keyIndex != -1){
      mapIndex = i;
    }
  }
  if (!shift && /[A-Z]/gm.test(event.key)){
    shift = 1;
  }
  newKey = layoutMap[mapIndex][shift];
  event.keyCode = newKey.charCodeAt(0);
  event.charCode = newKey.charCodeAt(0);
  event.which = newKey.charCodeAt(0);
  event.key = newKey;
  return event;
}

function punctuateWord(previousWord, currentWord, index, maxindex){

  let word = currentWord;

  if (index == 0 || getLastChar(previousWord) == "." || getLastChar(previousWord) == "?" || getLastChar(previousWord) == "!") {
    //always capitalise the first word or if there was a dot
    word = capitalizeFirstLetter(word);
  } else if (
    //10% chance to end a sentence
    (Math.random() < 0.1 && getLastChar(previousWord) != "." && index != maxindex - 2) || index == maxindex - 1) {
    let rand = Math.random();
    if (rand <= 0.8) {
      word += ".";
    } else if (rand > .8 && rand < .9){
      word += "?";
    } else {
      word += "!";
    }
  } else if (Math.random() < 0.01 &&
    getLastChar(previousWord) != "," &&
    getLastChar(previousWord) != ".") {
    //1% chance to add quotes
    word = `"${word}"`;
  } else if (Math.random() < 0.01) {
    //1% chance to add a colon
    word = word + ":";
  } else if (
    Math.random() < 0.01 &&
    getLastChar(previousWord) != "," &&
    getLastChar(previousWord) != "." &&
    previousWord != "-"
  ) {
    //1% chance to add a dash
    word = "-";
  } else if (
    Math.random() < 0.2 &&
    getLastChar(previousWord) != ","
  ) {
    //2% chance to add a comma
    word += ",";
  }
  return word;

}

function addWord() {
  let language = words[config.language];
  let randomWord = language[Math.floor(Math.random() * language.length)];
  previousWord = wordsList[wordsList.length - 1];
  previousWordStripped = previousWord.replace(/[.?!":\-,]/g,'').toLowerCase();
  while (previousWordStripped == randomWord || randomWord.indexOf(' ') > -1 || (!config.punctuation && randomWord == "I")) {
    randomWord = language[Math.floor(Math.random() * language.length)];
  }
  if (config.punctuation && config.mode != "custom"){
    randomWord = punctuateWord(previousWord, randomWord, wordsList.length, 0)
  }
  wordsList.push(randomWord);

  let w = "<div class='word'>";
  for (let c = 0; c < randomWord.length; c++) {
    w += "<letter>" + randomWord.charAt(c) + "</letter>";
  }
  w += "</div>";
  $("#words").append(w);
}

function showWords() {
  $("#words").empty();
  if (config.mode == "words" || config.mode == "custom") {
    $("#words").css("height", "auto");
    for (let i = 0; i < wordsList.length; i++) {
      let w = "<div class='word'>";
      for (let c = 0; c < wordsList[i].length; c++) {
        w += "<letter>" + wordsList[i].charAt(c) + "</letter>";
      }
      w += "</div>";
      $("#words").append(w);
    }
  } else if (config.mode == "time") {
    for (let i = 0; i < wordsList.length; i++) {
      let w = "<div class='word'>";
      for (let c = 0; c < wordsList[i].length; c++) {
        w += "<letter>" + wordsList[i].charAt(c) + "</letter>";
      }
      w += "</div>";
      $("#words").append(w);
    }
    $("#words").removeClass('hidden');
    const wordHeight = $($(".word")[0]).outerHeight(true);
    $("#words").css("height", wordHeight * 3 + 'px').css("overflow", "hidden");
  }
  updateActiveElement();
  updateCaretPosition();
}

function updateActiveElement() {
  $("#words .word").removeClass("active");
  $($("#words .word")[currentWordIndex])
    .addClass("active")
    .removeClass("error");
  activeWordTop = $("#words .word.active").position().top;
}

function compareInput(wrdIndex,input,showError) {
  $($('#words .word')[wrdIndex]).empty();
  let ret = "";
  let currentWord = wordsList[wrdIndex];
  for (let i = 0; i < input.length; i++) {
    if (currentWord[i] == input[i]) {
      ret += '<letter class="correct">' + currentWord[i] + "</letter>";
      // $(letterElems[i]).removeClass('incorrect').addClass('correct');
    } else {
      if(config.difficulty == "master"){
        if(!resultVisible) showResult(true);
        let testNow = Date.now();
        let testSeconds = roundTo2((testNow - testStart) / 1000);
        incompleteTestSeconds += testSeconds;
        restartCount++;
      }
      if(!showError){
        if (currentWord[i] == undefined) {
          // ret += '<letter class="correct">' + input[i] + "</letter>";
        } else {
          ret += '<letter class="correct">' + currentWord[i] + "</letter>";
        }
      }else{
        if (currentWord[i] == undefined) {
          ret += '<letter class="incorrect extra">' + input[i] + "</letter>";
        } else {
          ret += '<letter class="incorrect">' + currentWord[i] + "</letter>";
        }
      }
    }
  }
  if (input.length < currentWord.length) {
    for (let i = input.length; i < currentWord.length; i++) {
      ret += "<letter>" + currentWord[i] + "</letter>";
    }
  }
  $($('#words .word')[wrdIndex]).html(ret);
  if ((currentWord == input || (config.quickEnd && currentWord.length == input.length)) && wrdIndex == wordsList.length - 1) {
    inputHistory.push(input);
    currentInput = "";
    if(!resultVisible) showResult();
  }
  // liveWPM()
}

function highlightBadWord(index,showError) {
  if(!showError) return;
  $($("#words .word")[index]).addClass("error");
}

function showTimer() {
  if (!config.showTimerBar) return;
  $("#timerWrapper").css("opacity", 1);
}

function hideTimer() {
  $("#timerWrapper").css("opacity", 0);
}

function updateTimerBar() {
  let percent = ((time + 1) / config.time) * 100;
  $("#timer")
    .stop(true, true)
    .css("width", percent + "vw");
}


function hideCaret() {
  $("#caret").addClass("hidden");
}

function showCaret() {
  if($("#result").hasClass('hidden')){
    updateCaretPosition();
    $("#caret").removeClass("hidden");
    startCaretAnimation();
  }
}

function stopCaretAnimation() {
  $("#caret").css("animation-name", "none");
  $("#caret").css("opacity", "1");
}

function startCaretAnimation() {
  $("#caret").css("animation-name", "caretFlash");
}

function updateCaretPosition() {
  if ($("#words").hasClass('hidden')) return;
  let caret = $("#caret");
  let activeWord = $("#words .word.active");
  let inputLen = currentInput.length;
  let currentLetterIndex = inputLen - 1;
  if (currentLetterIndex == -1) {
    currentLetterIndex = 0;
  }
  let currentLetter = $($("#words .word.active letter")[currentLetterIndex]);
  if(currentLetter.length == 0) return;
  let currentLetterPos = currentLetter.position();
  let letterHeight = currentLetter.height();

  let newTop = 0;
  let newLeft = 0;

  newTop = currentLetterPos.top - letterHeight / 4;
  if (inputLen == 0) {
    // caret.css({
    //   top: currentLetterPos.top - letterHeight / 4,
    //   left: currentLetterPos.left - caret.width() / 2
    // });

    newLeft = currentLetterPos.left - caret.width() / 2;
  } else {
    // caret.css({
    //   top: currentLetterPos.top - letterHeight / 4,
    //   left: currentLetterPos.left + currentLetter.width() - caret.width() / 2
    // });
    newLeft = currentLetterPos.left + currentLetter.width() - caret.width() / 2;
  }

  let duration = 0;

  // if (config.smoothCaret && Math.round(caret.position().top) == Math.round(newTop)) {
  //   duration = 100;
  // }

  if (config.smoothCaret) {
    duration = 100;
    if (Math.round(caret.position().top) != Math.round(newTop)) {
      caret.css("top", newTop);
      duration = 10;
    }
  }

  caret.stop(true, true).animate({
    top: newTop,
    left: newLeft
  }, duration)

  let browserHeight = window.innerHeight;
  let middlePos = (browserHeight / 2) - $("#caret").outerHeight()/2;
  let contentHeight = document.body.scrollHeight;
  
  if (newTop >= middlePos &&  contentHeight > browserHeight) {
    window.scrollTo({
      left: 0,
      top: newTop - middlePos,
      behavior: 'smooth'
    })
  }

}

function countChars() {
  let correctWordChars = 0;
  let correctChars = 0;
  let incorrectChars = 0;
  let extraChars = 0;
  let missedChars = 0;
  let spaces = 0;
  for (let i = 0; i < inputHistory.length; i++) {
    if (inputHistory[i] == wordsList[i]) {
      //the word is correct
      correctWordChars += wordsList[i].length;
      correctChars += wordsList[i].length;
    } else if (inputHistory[i].length >= wordsList[i].length) {
      //too many chars
      for (let c = 0; c < inputHistory[i].length; c++) {
        if (c < wordsList[i].length) {
          //on char that still has a word list pair
          if (inputHistory[i][c] == wordsList[i][c]) {
            correctChars++;
          } else {
            incorrectChars++;
          }
        } else {
          //on char that is extra
          extraChars++;
        }
      }
    } else {
      //not enough chars
      for (let c = 0; c < wordsList[i].length; c++) {
        if (c < inputHistory[i].length) {
          //on char that still has a word list pair
          if (inputHistory[i][c] == wordsList[i][c]) {
            correctChars++;
          } else {
            incorrectChars++;
          }
        } else {
          //on char that is extra
          missedChars++;
        }
      }
    }
    if(i < inputHistory.length-1){
      spaces++;
    }
  }
  return {
    spaces: spaces,
    correctWordChars: correctWordChars,
    allCorrectChars: correctChars,
    incorrectChars: incorrectChars,
    extraChars: extraChars,
    missedChars: missedChars
  }
}

function roundTo2(num){
  return Math.round((num + Number.EPSILON) * 100) / 100
}

function calculateStats() {
  if (config.mode == "words" && config.difficulty == "normal") {
    if (inputHistory.length != wordsList.length) return;
  }
  let chars = countChars();

  let testNow = Date.now();
  let testSeconds = roundTo2((testNow - testStart) / 1000);
  let wpm = roundTo2(((chars.correctWordChars + chars.spaces) * (60 / testSeconds)) / 5);
  let wpmraw = roundTo2(((chars.allCorrectChars + chars.spaces + chars.incorrectChars + chars.extraChars) * (60/testSeconds))/5);
  let acc = roundTo2((accuracyStats.correct / (accuracyStats.correct + accuracyStats.incorrect)) * 100);
  return {
    wpm: wpm,
    wpmRaw: wpmraw,
    acc: acc,
    correctChars: chars.correctWordChars,
    incorrectChars: chars.incorrectChars + chars.extraChars + chars.missedChars,
    time: testSeconds,
    spaces: chars.spaces
  };
}

function hideCrown() {
  $("#result .stats .wpm .crownWrapper").css('opacity', 0);
}

function showCrown() {
  $("#result .stats .wpm .crownWrapper").animate({
    opacity: 1
  }, 250,"easeOutCubic");
}

function showResult(difficultyFailed = false) {
  resultVisible=true;
  testEnd = Date.now();
  testActive = false;
  setFocus(false);
  hideCaret();
  hideLiveWpm();
  testInvalid = false;
  let stats = calculateStats();
  if(stats === undefined){
    stats = {
      wpm: 0,
      wpmRaw: 0,
      acc: 0,
      correctChars: 0,
      incorrectChars: 0,
      time: 0,
      spaces: 0
    }
  }
  clearIntervals();
  let testtime = roundedToFixed(stats.time,1);
  $("#result .stats .wpm .bottom").text(Math.round(stats.wpm));
  $("#result .stats .raw .bottom").text(Math.round(stats.wpmRaw));
  $("#result .stats .acc .bottom").text(Math.round(stats.acc) + "%");
  $("#result .stats .key .bottom").text(stats.correctChars + stats.spaces + "/" + stats.incorrectChars);
  $("#result .stats .time .bottom").text(testtime+'s');

  setTimeout(function() {
    $("#resultExtraButtons").removeClass('hidden').css('opacity',1);
  }, 125);
  


  let mode2 = "";
  if (config.mode == "time") {
    mode2 = config.time;
    // $("#result .stats .time").addClass('hidden');
  } else if (config.mode == "words") {
    mode2 = config.words;
    // $("#result .stats .time").removeClass('hidden');
    // $("#result .stats .time .bottom").text(roundedToFixed(stats.time,1)+'s');
  }
  
  let pbVal = 0;

  if(difficultyFailed){
    showNotification("Test failed",2000);
  }else if(afkDetected){
    showNotification("Test invalid - AFK detected",2000);
  }else if(sameWordset){
    showNotification("Test invalid - repeated",2000);
  }else{
    let completedEvent = {
      wpm: stats.wpm,
      rawWpm: stats.wpmRaw,
      correctChars: stats.correctChars + stats.spaces,
      incorrectChars: stats.incorrectChars,
      acc: stats.acc,
      mode: config.mode,
      mode2: mode2,
      punctuation: config.punctuation,
      timestamp: Date.now(),
      language: config.language,
      restartCount: restartCount,
      incompleteTestSeconds: incompleteTestSeconds,
      difficulty: config.difficulty,
      testDuration: testtime,
      blindMode: config.blindMode,
      theme: config.theme
    };
    if(config.difficulty == "normal" || ((config.difficulty == "master" || config.difficulty == "expert") && !difficultyFailed)){
      // console.log(incompleteTestSeconds);
      // console.log(restartCount);
      restartCount = 0;
      incompleteTestSeconds = 0;
    }
    if (stats.wpm > 0 && stats.wpm < 350 && stats.acc > 50 && stats.acc <= 100) {
      if (firebase.auth().currentUser != null) {
        completedEvent.uid = firebase.auth().currentUser.uid;

        //check local pb
        let localPb = false;
        db_getLocalPB(config.mode,mode2,config.punctuation,config.language,config.difficulty).then(d => {
          if(d < stats.wpm){
            //new pb based on local
            hideCrown();
            showCrown();
            localPb = true;
          }
        })

        testCompleted({uid:firebase.auth().currentUser.uid,obj:completedEvent}).then(e => {
          // showNotification('done');
          if(e.data === -1){
            showNotification('Could not save result',3000);
          }else if(e.data === 1 || e.data === 2){
            dbSnapshot.results.unshift(completedEvent);
            try{
              firebase.analytics().logEvent('testCompleted', completedEvent);
            }catch(e){
              console.log("Analytics unavailable");
            }
            if(e.data === 2){
              //new pb
              if(!localPb){
                  showNotification('Local PB data is out of sync! Refresh the page to resync it or contact Miodec on Discord.',15000);
              }
              db_saveLocalPB(config.mode,mode2,config.punctuation,config.language,config.difficulty,stats.wpm);
            }else{
              if(localPb){
                showNotification('Local PB data is out of sync! Refresh the page to resync it or contact Miodec on Discord.',15000);
              }
            }

          }
        })

        $("#result .loginTip").addClass('hidden');
      } else {
        try{
          firebase.analytics().logEvent('testCompletedNoLogin', completedEvent);
        }catch(e){
          console.log("Analytics unavailable");
        }
        $("#result .loginTip").removeClass('hidden');

        // showNotification("Sign in to save your result",3000);
      }
    } else {
      showNotification("Test invalid", 3000);
      testInvalid = true;
      try{
        firebase.analytics().logEvent('testCompletedInvalid', completedEvent);
      }catch(e){
        console.log("Analytics unavailable");
      }
    }
  }


  let testType = "";


  testType += config.mode;
  if (config.mode == "time") {
    testType += " " + config.time
  } else if (config.mode == "words") {
    testType += " " + config.words
  }
  if(config.mode != "custom"){
    testType += "<br>" + config.language.replace('_', ' ');
  }
  if (config.punctuation) {
    testType += "<br>punctuation"
  }
  if (config.blindMode) {
    testType += "<br>blind"
  }
  if (config.difficulty == "expert") {
    testType += "<br>expert";
  }else if(config.difficulty == "master"){
    testType += "<br>master";
  }

  $("#result .stats .testType .bottom").html(testType);


  let otherText = "";
  if(difficultyFailed){
    otherText += "<br>failed"
  }
  if(afkDetected){
    otherText += "<br>afk detected"
  }
  if(testInvalid){
    otherText += "<br>invalid"
  }
  if(sameWordset){
    otherText += "<br>repeated"
  }

  if(otherText == ""){
    $("#result .stats .info").addClass('hidden');
  }else{
    $("#result .stats .info").removeClass('hidden');
    otherText = otherText.substring(4);
    $("#result .stats .info .bottom").html(otherText); 
  }

  let labels = [];
  for (let i = 1; i <= wpmHistory.length; i++) {
    labels.push(i.toString());
  }

  let mainColor = getComputedStyle(document.body).getPropertyValue('--main-color').replace(' ', '');
  let subColor = getComputedStyle(document.body).getPropertyValue('--sub-color').replace(' ', '');
  let bgColor = getComputedStyle(document.body).getPropertyValue('--bg-color').replace(' ', '');


  wpmOverTimeChart.options.scales.xAxes[0].ticks.minor.fontColor = subColor;
  wpmOverTimeChart.options.scales.xAxes[0].scaleLabel.fontColor = subColor;
  wpmOverTimeChart.options.scales.yAxes[0].ticks.minor.fontColor = subColor;
  wpmOverTimeChart.options.scales.yAxes[2].ticks.minor.fontColor = subColor;
  wpmOverTimeChart.options.scales.yAxes[0].scaleLabel.fontColor = subColor;
  wpmOverTimeChart.options.scales.yAxes[2].scaleLabel.fontColor = subColor;

  wpmOverTimeChart.data.labels = labels;

  wpmOverTimeChart.data.datasets[0].borderColor = mainColor;
  wpmOverTimeChart.data.datasets[0].data = wpmHistory;
  wpmOverTimeChart.data.datasets[1].borderColor = subColor;
  wpmOverTimeChart.data.datasets[1].data = rawHistory;

  wpmOverTimeChart.options.annotation.annotations[0].borderColor = subColor;
  wpmOverTimeChart.options.annotation.annotations[0].label.backgroundColor = subColor;
  wpmOverTimeChart.options.annotation.annotations[0].label.fontColor = bgColor;
  


  let maxVal = 0;
  rawHistory.forEach(raw =>{
    if(raw >= maxVal){
      maxVal = raw;
    }
  })
  wpmOverTimeChart.options.scales.yAxes[0].ticks.max = maxVal;
  wpmOverTimeChart.options.scales.yAxes[1].ticks.max = maxVal;


  let errorsNoZero = [];

  for(let i = 0; i < errorsPerSecond.length; i++){
    // if(errorsPerSecond[i] != 0){
      errorsNoZero.push({
        x: i+1,
        y: errorsPerSecond[i]
      });
    // }
  }

  wpmOverTimeChart.data.datasets[2].data = errorsNoZero;



  wpmOverTimeChart.update({ duration: 0 });
  swapElements($("#words"),$("#result"),250, () => {

    if(config.blindMode){
      $.each($('#words .word'),(i,word)=>{
        let input = inputHistory[i];
        if(input == undefined) input = currentInput;
        compareInput(i,input,true);
        if(inputHistory[i] != wordsList[i]){
          highlightBadWord(i,true);
        }
      })
    }


    let remove = false;
    $.each($('#words .word'),(i,obj)=>{
      if(remove){
        $(obj).remove();
      }else{
        $(obj).removeClass('hidden');
        if($(obj).hasClass('active')) remove = true;
      }
    });
  });
}

function restartTest(withSameWordset = false) {
  clearIntervals();
  time = 0;
  afkDetected = false;
  wpmHistory = [];
  rawHistory = [];
  setFocus(false);
  hideCaret();
  testActive = false;
  hideLiveWpm();
  keypressPerSecond = [];
  currentKeypressCount = 0;
  errorsPerSecond = [];
  currentErrorCount = 0;
  currentTestLine = 0;
  let el = null;
  if(resultVisible){
    //results are being displayed
    el = $("#result");
  }else{
    //words are being displayed
    el = $("#words");
  }

  if(resultVisible){
    $("#words").stop(true, true).animate({
      opacity: 0
    }, 125);
    $("#wordsTitle").stop(true,true).animate({
      opacity: 0
    }, 125, ()=>{
      $("#wordsTitle").slideUp(0);
    });
    $("#resultExtraButtons").stop(true,true).animate({
      opacity: 0
    }, 125, ()=>{
      $("#resultExtraButtons").addClass('hidden');
    });
  }
  resultVisible = false;

  el.stop(true, true).animate({
    opacity: 0
  }, 125, () => {
    if(!withSameWordset){
      sameWordset = false;
      initWords();
    }else{
      sameWordset = true;
      testActive = false;
      currentWordIndex = 0;
      accuracyStats = {
        correct: 0,
        incorrect: 0
      }
      inputHistory = [];
      currentInput = "";
      showWords();
    }
    $("#result").addClass('hidden');
    $("#words").css('opacity', 0).removeClass('hidden').stop(true, true).animate({
      opacity: 1
    }, 125, () => {
      hideCrown();
      clearIntervals();
      $("#restartTestButton").css('opacity', 1);
      if ($("#commandLineWrapper").hasClass('hidden')) focusWords();
      hideTimer();
      setTimeout(function() {
        $("#timer")
          .css("transition", "none")
          .css("width", "0vw")
          .stop(true, true)
          .animate({ top: 0 }, 0, () => {
            $("#timer").css("transition", "1s linear");
          });
      }, 250);
      wpmOverTimeChart.options.annotation.annotations[0].value = "-20";
      wpmOverTimeChart.update();


      // let oldHeight = $("#words").height();
      // let newHeight = $("#words")
      //   .css("height", "fit-content")
      //   .css("height", "-moz-fit-content")
      //   .height();
      // if (testMode == "words" || testMode == "custom") {
      //   $("#words")
      //     .stop(true, true)
      //     .css("height", oldHeight)
      //     .animate({ height: newHeight }, 250, () => {
      //       $("#words")
      //         .css("height", "fit-content")
      //         .css("height", "-moz-fit-content");
      //       $("#wordsInput").focus();  
      //       updateCaretPosition();
      //     });
      // } else if (testMode == "time") {
      //   $("#words")
      //     .stop(true, true)
      //     .css("height", oldHeight)
      //     .animate({ height: 78 }, 250, () => {
      //       $("#wordsInput").focus();  
      //       updateCaretPosition();
      //     });
      // }

    });
  })
}

function focusWords() {
  if (!$("#words").hasClass('hidden')) $("#wordsInput").focus();
}

function changeCustomText() {
  customText = prompt("Custom text");
  customText = customText.replace(/[\n\r\t ]/gm, ' ');
  customText = customText.replace(/ +/gm, ' ');
  // initWords();
}


function changePage(page) {
  if(pageTransition){
    return;
  }
  restartTest();
  let activePage = $(".page.active");
  $(".page").removeClass('active');
  $("#wordsInput").focusout();
  if (page == "test" || page == "") {
    pageTransition = true;
    swapElements(activePage, $(".page.pageTest"), 250, () => {
      pageTransition = false;
      focusWords();
      $(".page.pageTest").addClass('active');
      history.pushState('/', null, '/');
    });
    showTestConfig();
    hideSignOutButton();
    restartCount = 0;
    incompleteTestSeconds = 0;
    restartTest();
  } else if (page == "about") {
    pageTransition = true;
    swapElements(activePage, $(".page.pageAbout"), 250, ()=>{
      pageTransition = false;
      history.pushState('about', null, 'about');
      $(".page.pageAbout").addClass('active');
    });
    hideTestConfig();
    hideSignOutButton();
  } else if (page == "settings") {
    pageTransition = true;
    swapElements(activePage, $(".page.pageSettings"), 250, ()=>{
      pageTransition = false;
      history.pushState('settings', null, 'settings');
      $(".page.pageSettings").addClass('active');
    });
    updateSettingsPage();
    hideTestConfig();
    hideSignOutButton();
  } else if (page == "account") {
    if (!firebase.auth().currentUser) {
      changePage("login");
    } else {
      pageTransition = true;
      swapElements(activePage, $(".page.pageAccount"), 250, () =>{
        pageTransition = false;
        history.pushState('account', null, 'account');
        $(".page.pageAccount").addClass('active');
      });
      refreshAccountPage();
      hideTestConfig();
      showSignOutButton();
    }
  } else if (page == "login") {
    if (firebase.auth().currentUser != null) {
      changePage('account');
    } else {
      pageTransition = true;
      swapElements(activePage, $(".page.pageLogin"), 250, ()=>{
        pageTransition = false;
        history.pushState('login', null, 'login');
        $(".page.pageLogin").addClass('active');
      });
      hideTestConfig();
      hideSignOutButton();
    }
  }
}

function changeMode(mode,nosave) {
  config.mode = mode;
  $("#top .config .mode .button").removeClass("active");
  $("#top .config .mode .button[mode='" + mode + "']").addClass("active");
  if (config.mode == "time") {
    $("#top .config .wordCount").addClass("hidden");
    $("#top .config .time").removeClass("hidden");
    $("#top .config .customText").addClass("hidden");
    $("#top .config .punctuationMode").removeClass("hidden");
  } else if (config.mode == "words") {
    $("#top .config .wordCount").removeClass("hidden");
    $("#top .config .time").addClass("hidden");
    $("#top .config .customText").addClass("hidden");
    $("#top .config .punctuationMode").removeClass("hidden");
  } else if (config.mode == "custom") {
    $("#top .config .wordCount").addClass("hidden");
    $("#top .config .time").addClass("hidden");
    $("#top .config .customText").removeClass("hidden");
    $("#top .config .punctuationMode").addClass("hidden");
  }
  if(!nosave) saveConfigToCookie();
}

function liveWPM() {
  let correctWordChars = 0;
  for (let i = 0; i < inputHistory.length; i++) {
    if (inputHistory[i] == wordsList[i]) {
      //the word is correct
      //+1 for space
      correctWordChars += wordsList[i].length + 1;
    }
  }
  let testNow = Date.now();
  let testSeconds = (testNow - testStart) / 1000;
  wpm = (correctWordChars * (60 / testSeconds)) / 5;
  return Math.round(wpm);
}

function liveRaw() {
  let chars = 0;
  for (let i = 0; i < inputHistory.length; i++) {
      chars += inputHistory[i].length + 1;
  }
  let testNow = Date.now();
  let testSeconds = (testNow - testStart) / 1000;
  raw = (chars * (60 / testSeconds)) / 5;
  return Math.round(raw);
}

function updateLiveWpm(wpm) {
  if (!config.showLiveWpm) return;
  if (wpm == 0 || !testActive) hideLiveWpm();
  // let wpmstring = wpm < 100 ? `&nbsp;${wpm}` : `${wpm}`;
  $("#liveWpm").html(wpm);
}

function showLiveWpm() {
  if (!config.showLiveWpm) return;
  if (!testActive) return;
  $("#liveWpm").css('opacity', 0.25);
}

function hideLiveWpm() {
  $("#liveWpm").css('opacity', 0);
}

function swapElements(el1, el2, totalDuration, callback = function() { return; }) {
  if (
    (el1.hasClass('hidden') && !el2.hasClass('hidden')) ||
    (!el1.hasClass('hidden') && el2.hasClass('hidden'))
  ) {
    //one of them is hidden and the other is visible
    if (el1.hasClass("hidden")) {
      callback();
      return false;
    }
    $(el1).removeClass('hidden').css('opacity', 1).animate({
      opacity: 0
    }, totalDuration / 2, () => {
      $(el1).addClass('hidden');
      $(el2).removeClass('hidden').css('opacity', 0).animate({
        opacity: 1
      }, totalDuration / 2, () => {
        callback();
      });
    });

  } else if (el1.hasClass('hidden') && el2.hasClass('hidden')) {
    //both are hidden, only fade in the second
    $(el2).removeClass('hidden').css('opacity', 0).animate({
      opacity: 1
    }, totalDuration, () => {
      callback();
    });
  }else{
    callback();
  }

}

function clearIntervals() {
  timers.forEach(timer => {
    clearInterval(timer);
  })
}

function updateAccountLoginButton() {
  if (firebase.auth().currentUser != null) {
    swapElements($("#menu .button.login"), $("#menu .button.account"), 250);
    // $("#menu .button.account").removeClass('hidden');
    // $("#menu .button.login").addClass('hidden');
  } else {
    swapElements($("#menu .button.account"), $("#menu .button.login"), 250);
    // $("#menu .button.login").removeClass('hidden');
    // $("#menu .button.account").addClass('hidden');
  }
}

function toggleResultWordsDisplay(){
  if(resultVisible){
    if($("#words").hasClass('hidden')){
      //show 
      $("#wordsTitle").css('opacity',1).removeClass('hidden').slideDown(250);


      let newHeight = $("#words").removeClass('hidden').css('height','auto').outerHeight();

      $("#words").css({
        height: 0,
        opacity: 0
      }).animate({
        height: newHeight,
        opacity: 1
      }, 250);
    }else{
      //hide

      $("#wordsTitle").slideUp(250);

      let oldHeight = $("#words").outerHeight();
      $("#words").removeClass('hidden');
      $("#words").css({
        opacity: 1,
        height: oldHeight
      }).animate({
        height: 0,
        opacity: 0
      }, 250, ()=>{
        $("#words").addClass('hidden');
      });
    }
  }
}

function flipTestColors(tf){
  if(tf){
    $("#words").addClass('flipped');
  }else{
    $("#words").removeClass('flipped');
  }
}


$(document).on("click", "#top .logo", (e) => {
  changePage('test');
});

$(document).on("click", "#top .config .wordCount .button", (e) => {
  wrd = $(e.currentTarget).attr('wordCount');
  if(wrd == "custom"){
    let newWrd = prompt('Custom word amount');
    if(newWrd !== null && !isNaN(newWrd) && newWrd > 0){
      changeWordCount(newWrd);
    }
  }else{
    changeWordCount(wrd);
  }
  restartTest();
});

$(document).on("click", "#top .config .time .button", (e) => {
  time = $(e.currentTarget).attr('timeConfig');
  if(time == "custom"){
    let newTime = prompt('Custom time in seconds');
    if(newTime !== null && !isNaN(newTime) && newTime > 0){
      changeTimeConfig(newTime);
    }
  }else{
    changeTimeConfig(time);
  }
  restartTest();
});

$(document).on("click", "#top .config .customText .button", (e) => {
  changeCustomText();
  restartTest();

});

$(document).on("click", "#top .config .punctuationMode .button", (e) => {
  togglePunctuation();
  restartTest();
});

$("#words").click((e) => {
  focusWords();
});

$(document).on("click", "#top .config .mode .button", (e) => {
  if ($(e.currentTarget).hasClass("active")) return;
  mode = e.currentTarget.innerHTML;
  changeMode(mode);
  restartTest();
});

$(document).on("click", "#top #menu .button", (e) => {
  if($(e.currentTarget).hasClass('discord')) return;
  href = $(e.currentTarget).attr('href');
  changePage(href.replace('/', ''));
})

$(window).on('popstate', (e) => {
  let state = e.originalEvent.state;
  if (state == "" || state == "/") {
    // show test
    changePage('test')
  } else if (state == "about") {
    // show about
    changePage("about");
  } else if (state == "account" || state == "login") {
    if (firebase.auth().currentUser) {
      changePage("account");
    } else {
      changePage('login');
    }
  }

});

$(document).on("keypress", "#restartTestButton", (event) => {
  if (event.keyCode == 32 || event.keyCode == 13) {
    if (testActive) {
      let testNow = Date.now();
      let testSeconds = roundTo2((testNow - testStart) / 1000);
      incompleteTestSeconds += testSeconds;
      restartCount++;
    }
    restartTest();
  }
});

$(document.body).on("click", "#restartTestButton", (event) => {
  restartTest();
});

$(document).on("keypress", "#showWordHistoryButton", (event) => {
  if (event.keyCode == 32 || event.keyCode == 13) {
    toggleResultWordsDisplay();
  }
});

$(document.body).on("click", "#showWordHistoryButton", (event) => {
  toggleResultWordsDisplay();
});



$(document.body).on("click", "#restartTestButtonWithSameWordset", (event) => {
  restartTest(true);
});

$(document).on("keypress", "#restartTestButtonWithSameWordset", (event) => {
  if (event.keyCode == 32 || event.keyCode == 13) {
    restartTest(true);
  }
});



$(document.body).on("click", "#copyResultToClipboardButton", (event) => {
  copyResultToClipboard();
});

$(document.body).on("click", ".version", (event) => {
  $("#versionHistoryWrapper").css('opacity', 0).removeClass('hidden').animate({ opacity: 1 }, 125);
});

$(document.body).on("click", "#versionHistoryWrapper", (event) => {
  $("#versionHistoryWrapper").css('opacity', 1).animate({ opacity: 0 }, 125, () => {
    $("#versionHistoryWrapper").addClass('hidden');
  });
});

$("#wordsInput").keypress((event) => {
  event.preventDefault();
});

$("#wordsInput").on("focus", (event) => {
  showCaret();
});

$("#wordsInput").on("focusout", (event) => {
  hideCaret();
});

$(window).resize(() => {
  updateCaretPosition();
});

$(document).mousemove(function(event) {
  if($("#top").hasClass("focus") && (event.originalEvent.movementX > 0 || event.originalEvent.movementY > 0)){
    setFocus(false);
  }
});

//keypresses for the test, using different method to be more responsive
$(document).keypress(function(event) {
  event = emulateLayout(event);
  if (!$("#wordsInput").is(":focus")) return;
  if (event["keyCode"] == 13) return;
  if (event["keyCode"] == 32) return;
  if (event["keyCode"] == 27) return;
  if (event["keyCode"] == 93) return;
  //start the test
  if (currentInput == "" && inputHistory.length == 0) {
    try{
      if (firebase.auth().currentUser != null) {
        firebase.analytics().logEvent('testStarted');
      } else {
        firebase.analytics().logEvent('testStartedNoLogin');
      }
    }catch(e){
      console.log("Analytics unavailable");
    }
    testActive = true;
    testStart = Date.now();
    if (config.mode == "time") {
      showTimer();
    }
    updateTimerBar();
    clearIntervals();
    timers.push(setInterval(function() {
      time++;
      updateTimerBar();
      let wpm = liveWPM();
      updateLiveWpm(wpm);
      showLiveWpm();
      wpmHistory.push(wpm);
      rawHistory.push(liveRaw());
      keypressPerSecond.push(currentKeypressCount);
      currentKeypressCount = 0;
      errorsPerSecond.push(currentErrorCount);
      currentErrorCount = 0;
      if(keypressPerSecond[time-1] == 0 && keypressPerSecond[time-2] == 0 && keypressPerSecond[time-3] == 0 && keypressPerSecond[time-4] == 0 && !afkDetected){
        showNotification("AFK detected",3000);
        afkDetected = true;
      }
      if (config.mode == "time") {
        if (time >= config.time) {
          clearIntervals();
          hideCaret();
          testActive = false;
          showResult();
        }
      }
    }, 1000));
  } else {
    if (!testActive) return;
  }
  if (wordsList[currentWordIndex].substring(currentInput.length, currentInput.length + 1) != event["key"]) {
    accuracyStats.incorrect++;
    currentErrorCount++;
  } else {
    accuracyStats.correct++;
  }
  currentKeypressCount++;
  currentInput += event["key"];
  $("#words .word.active").attr('input',currentInput);
  setFocus(true);
  activeWordTopBeforeJump = activeWordTop;
  compareInput(currentWordIndex,currentInput,!config.blindMode);
  let newActiveTop = $("#words .word.active").position().top;
  if(activeWordTopBeforeJump != newActiveTop){
    activeWordJumped = true;
  }
  updateCaretPosition();
});

//handle keyboard events
$(document).keydown((event) => {


  //tab

  if (event["keyCode"] == 9) {
    if (config.quickTab && $(".pageTest").hasClass("active")) {
      event.preventDefault();
      if (testActive) {
        let testNow = Date.now();
        let testSeconds = roundTo2((testNow - testStart) / 1000);
        incompleteTestSeconds += testSeconds;
        restartCount++;
      }
      restartTest();
    }
  }

  //only for the typing test
  if ($("#wordsInput").is(":focus")) {
    //backspace
    if (event["keyCode"] == 8) {
      event.preventDefault();
      if (!testActive) return;
      if (currentInput == "" && inputHistory.length > 0) {
        if (
          (inputHistory[currentWordIndex - 1] == wordsList[currentWordIndex - 1] && !config.freedomMode) || $($(".word")[currentWordIndex - 1]).hasClass("hidden")
        ) {
          return;
        } else {
          if (event["ctrlKey"] || event["altKey"]) {
            currentInput = "";
            inputHistory.pop();
          } else {
            currentInput = inputHistory.pop();
          }
          currentWordIndex--;
          updateActiveElement();
          compareInput(currentWordIndex,currentInput,!config.blindMode);
        }
      } else {
        // if ($($(".word")[currentWordIndex - 1]).hasClass("hidden")) {
        //   return;
        // }
        if (event["ctrlKey"]) {
          currentInput = "";
        } else {
          currentInput = currentInput.substring(0, currentInput.length - 1);
        }
        compareInput(currentWordIndex,currentInput,!config.blindMode);
      }
      currentKeypressCount++;
      updateCaretPosition();
    }
    //space
    if (event["keyCode"] == 32) {
      if (!testActive) return;
      if (currentInput == "") return;
      event.preventDefault();
      let currentWord = wordsList[currentWordIndex];
      if (config.mode == "time") {
        let currentTop = $($("#words .word")[currentWordIndex]).position().top;
        let nextTop = $($("#words .word")[currentWordIndex + 1]).position().top;
        if (nextTop > currentTop || activeWordJumped) {
          //last word of the line
          if(currentTestLine > 0){

            let hideBound = currentTop;
            if(activeWordJumped){
              hideBound = activeWordTopBeforeJump;
            }
            activeWordJumped = false;

            let toHide = [];
            for (let i = 0; i < currentWordIndex + 1; i++) {
              let forWordTop = $($("#words .word")[i]).position().top;
              if(forWordTop < hideBound){
                // $($("#words .word")[i]).addClass("hidden");
                toHide.push($($("#words .word")[i]));
              }
            }
            toHide.forEach(el => el.addClass('hidden'));
          }
          currentTestLine++;
        }
      }
      if(config.blindMode) $("#words .word.active letter").addClass('correct');
      if (currentWord == currentInput) {
        inputHistory.push(currentInput);
        currentInput = "";
        currentWordIndex++;
        updateActiveElement();
        updateCaretPosition();
      } else {
        inputHistory.push(currentInput);
        highlightBadWord(currentWordIndex,!config.blindMode)
        currentInput = "";
        currentWordIndex++;
        if (currentWordIndex == wordsList.length) {
          showResult();
          return;
        }else if(config.difficulty == "expert" || config.difficulty == "master"){
          showResult(true);
          let testNow = Date.now();
          let testSeconds = roundTo2((testNow - testStart) / 1000);
          incompleteTestSeconds += testSeconds;
          restartCount++;
          return;
        }
        updateActiveElement();
        updateCaretPosition();
      }
      if (config.mode == "time") {
        addWord();
      }
    }
  }
});

loadConfigFromCookie();
getReleasesFromGitHub();

if (firebase.app().options.projectId === "monkey-type-dev-67af4") {
  $("#top .logo .bottom").text("monkey-dev");
  $("head title").text("Monkey Dev")
}

if (window.location.hostname === "localhost") {
  window.onerror = function(error) {
    this.showNotification(error,3000);
  };
  $("#top .logo .top").text("localhost");
  $("head title").text($("head title").text() + " (localhost)");
  firebase.functions().useFunctionsEmulator("http://localhost:5001");
}

$(document).on('mouseenter','#words .word',e =>{
  if(resultVisible){
    let input = $(e.currentTarget).attr('input');
    if(input != undefined) $(e.currentTarget).append(`<div class="wordInputAfter">${input}</div>`);
  }
})

$(document).on('mouseleave','#words .word',e =>{
  $('.wordInputAfter').remove();
})

$(document).ready(() => {
  updateFavicon(32,14);
  $('body').css('transition', '.25s');
  restartTest();
  if (config.quickTab) {
    $("#restartTestButton").addClass('hidden');
  }
  $("#centerContent").css("opacity", "0").removeClass("hidden").stop(true, true).animate({ opacity: 1 }, 250);
});

let ctx = $("#wpmChart");
let wpmOverTimeChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: "wpm",
      data: [],
      // backgroundColor: 'rgba(255, 255, 255, 0.25)',
      borderColor: 'rgba(125, 125, 125, 1)',
      borderWidth: 2,
      yAxisID: "wpm",
      order: 2,
      radius: 2
    },
    {
      label: "raw",
      data: [],
      // backgroundColor: 'rgba(255, 255, 255, 0.25)',
      borderColor: 'rgba(125, 125, 125, 1)',
      borderWidth: 2,
      yAxisID: "raw",
      order: 3,
      radius: 2
    },
    {
      label: "errors",
      data: [],
      // backgroundColor: 'rgba(255, 255, 255, 0.25)',
      borderColor: 'rgba(255, 125, 125, 1)',
      borderWidth: 2,
      order: 1,
      yAxisID: "error",
      // barPercentage: 0.1,
      maxBarThickness: 10,
      type: "scatter",
      pointStyle: "crossRot",
      radius: function(context) {
        var index = context.dataIndex;
        var value = context.dataset.data[index];
        return value.y <= 0 ? 0 : 3
      },
      pointHoverRadius: function(context) {
        var index = context.dataIndex;
        var value = context.dataset.data[index];
        return value.y <= 0 ? 0 : 5
      },
    }],
  },
  options: {
    tooltips: {
      titleFontFamily: "Roboto Mono",
      bodyFontFamily: "Roboto Mono",
      mode: 'index',
      intersect: false
    },
    legend: {
      display: false,
      labels: {
        defaultFontFamily: "Roboto Mono"
      }
    },
    responsive: true,
    maintainAspectRatio: false,
    // hover: {
    //   mode: 'x',
    //   intersect: false
    // },
    scales: {

      xAxes: [{
        ticks: {
          fontFamily: "Roboto Mono",
          autoSkip: true,
          autoSkipPadding: 40
        },
        display: true,
        scaleLabel: {
          display: true,
          labelString: 'Seconds',
          fontFamily: "Roboto Mono"
        }
      }],
      yAxes: [{
        id: "wpm",
        display: true,
        scaleLabel: {
          display: true,
          labelString: 'Words per Minute',
          fontFamily: 'Roboto Mono'
        },
        ticks: {
          fontFamily: 'Roboto Mono',
          beginAtZero: true,
          min: 0,
          autoSkip: true,
          autoSkipPadding: 40
        },
        gridLines: {
          display:false
        }
      },
      {
        id: "raw",
        display: false,
        scaleLabel: {
          display: true,
          labelString: 'Raw Words per Minute',
          fontFamily: 'Roboto Mono'
        },
        ticks: {
          fontFamily: 'Roboto Mono',
          beginAtZero: true,
          min: 0,
          autoSkip: true,
          autoSkipPadding: 40
        },
        gridLines: {
          display:false
        }
      },
      {
        id: "error",
        display: true,
        position: 'right',
        scaleLabel: {
          display: true,
          labelString: 'Errors',
          fontFamily: 'Roboto Mono'
        },
        ticks: {
          precision:0,
          fontFamily: 'Roboto Mono',
          beginAtZero: true,
          autoSkip: true,
          autoSkipPadding: 40
        },
        gridLines: {
          display:true
        }
      }
    ]
    },
    annotation: {
      annotations: [{
        enabled: false,
        type: 'line',
        mode: 'horizontal',
        scaleID: 'wpm',
        value: '-20',
        borderColor: 'red',
        borderWidth: 1,
        borderDash: [2,2],
        label: {
          // Background color of label, default below
          backgroundColor: 'blue',
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
      }]
    }
  }
});