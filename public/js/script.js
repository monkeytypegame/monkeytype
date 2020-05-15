let wordsList = [];
let currentWordIndex = 0;
let inputHistory = [];
let currentInput = "";
let time = 0;
let timers = [];
let testActive = false;
let testStart, testEnd;
let wpmHistory = [];
let currentCommands = commands;

let accuracyStats = {
  correct: 0,
  incorrect: 0
}

let customText = "The quick brown fox jumps over the lazy dog";

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

function test() {
  $("#resultScreenshot").removeClass("hidden");
  html2canvas($("#resultScreenshot"), {
    onclone: function(clonedDoc) {
      clonedDoc.getElementById("resultScreenshot").style.display = "block";
    }
  }).then((canvas) => {
    $("#resultScreenshot").removeClass("hidden");
    document.body.appendChild(canvas);
  });
}

function getLastChar(word) {
  return word.charAt(word.length - 1);
}

function setFocus(foc) {
  if (foc) {
    // focus = true;
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

  if (config.mode == "time" || config.mode == "words") {

    let wordsBound = config.mode == "time" ? 50 : config.words;
    let randomWord = words[Math.floor(Math.random() * words.length)];
    wordsList.push(randomWord);
    for (let i = 1; i < wordsBound; i++) {
      randomWord = words[Math.floor(Math.random() * words.length)];
      previousWord = wordsList[i - 1];
      while (randomWord == previousWord && (!config.punctuation && "I")) {
        randomWord = words[Math.floor(Math.random() * words.length)];
      }
      wordsList.push(randomWord);
    }

  } else if (config.mode == "custom") {
    let w = customText.split(" ");
    for (let i = 0; i < w.length; i++) {
      wordsList.push(w[i]);
    }
  }
  if (config.punctuation) {
    wordsList = buildSentences(wordsList);
  }
  showWords();
}

function buildSentences() {
  let returnList = [];
  $.each(wordsList, (index, word) => {
    let previousWord = returnList[index - 1];
    if (index == 0 || getLastChar(previousWord) == ".") {
      //always capitalise the first word or if there was a dot
      word = capitalizeFirstLetter(word);
    } else if (
      //10% chance to add a dot or if its a last word
      (Math.random() < 0.1 && getLastChar(previousWord) != "." && index != wordsList.length - 2) || index == wordsList.length - 1) {
      word += ".";
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
    returnList.push(word);
  })
  return returnList;
}

function addWord() {
  let randomWord = words[Math.floor(Math.random() * words.length)];
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
    $("#words").css("height", "78px").css("overflow", "hidden");
    for (let i = 0; i < wordsList.length; i++) {
      let w = "<div class='word'>";
      for (let c = 0; c < wordsList[i].length; c++) {
        w += "<letter>" + wordsList[i].charAt(c) + "</letter>";
      }
      w += "</div>";
      $("#words").append(w);
    }
  }
  updateActiveElement();
  updateCaretPosition();
}

function updateActiveElement() {
  $("#words .word").removeClass("active");
  $($("#words .word")[currentWordIndex])
    .addClass("active")
    .removeClass("error");
}

function compareInput() {
  $(".word.active").empty();
  let ret = "";
  let currentWord = wordsList[currentWordIndex];
  let letterElems = $($("#words .word")[currentWordIndex]).children("letter");
  for (let i = 0; i < currentInput.length; i++) {
    if (currentWord[i] == currentInput[i]) {
      ret += '<letter class="correct">' + currentWord[i] + "</letter>";
      // $(letterElems[i]).removeClass('incorrect').addClass('correct');
    } else {
      if (currentWord[i] == undefined) {
        ret +=
          '<letter class="incorrect extra">' + currentInput[i] + "</letter>";
        // $($('#words .word')[currentWordIndex]).append('<letter class="incorrect">' + currentInput[i] + "</letter>");
      } else {
        ret += '<letter class="incorrect">' + currentWord[i] + "</letter>";
        // $(letterElems[i]).removeClass('correct').addClass('incorrect');
      }
    }
  }
  if (currentInput.length < currentWord.length) {
    for (let i = currentInput.length; i < currentWord.length; i++) {
      ret += "<letter>" + currentWord[i] + "</letter>";
    }
  }
  $(".word.active").html(ret);
  if (currentWord == currentInput && currentWordIndex == wordsList.length - 1) {
    inputHistory.push(currentInput);
    currentInput = "";
    showResult();
  }
  // liveWPM()
}

function highlightBadWord() {
  $(".word.active").addClass("error");
}

function showTimer() {
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
  updateCaretPosition();
  $("#caret").removeClass("hidden");
  startCaretAnimation();
}

function stopCaretAnimation() {
  $("#caret").css("animation-name", "none");
  $("#caret").css("background-color", "var(--caret-color)");
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
  }

  if (Math.round(caret.position().top) != Math.round(newTop)) {
    caret.css("top", newTop);
    duration = 10;
  }

  caret.stop(true, true).animate({
    top: newTop,
    left: newLeft
  }, duration)

}

function countChars() {
  let correctWordChars = 0;
  let correctChars = 0;
  let incorrectChars = 0;
  let extraChars = 0;
  let missedChars = 0;
  for (let i = 0; i < inputHistory.length; i++) {
    if (inputHistory[i] == wordsList[i]) {
      //the word is correct
      //+1 for space
      correctWordChars += wordsList[i].length + 1;
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
  }
  return {
    correctWordChars: correctWordChars,
    allCorrectChars: correctChars,
    incorrectChars: incorrectChars,
    extraChars: extraChars,
    missedChars: missedChars
  }
}

function calculateStats() {
  if (config.mode == "words") {
    if (inputHistory.length != wordsList.length) return;
  }
  let chars = countChars();
  let totalChars = chars.allCorrectChars + chars.incorrectChars + chars.extraChars + chars.missedChars;

  let testNow = Date.now();
  let testSeconds = (testNow - testStart) / 1000;
  let wpm = Math.round((chars.correctWordChars * (60 / testSeconds)) / 5);
  let acc = Math.round((accuracyStats.correct / (accuracyStats.correct + accuracyStats.incorrect)) * 100);
  return { wpm: wpm, acc: acc, correctChars: chars.allCorrectChars, incorrectChars: chars.incorrectChars + chars.extraChars + chars.missedChars };
}

function hideCrown() {
  $("#result .stats .wpm .crownWrapper").css('width', 0);
}

function showCrown() {
  $("#result .stats .wpm .crownWrapper").animate({
    width: '1.7rem'
  }, 250);
}

function showResult() {
  //TODO: #2 Sometimes the caret jumps to the top left corner when showing results
  testEnd = Date.now();
  let stats = calculateStats();
  clearIntervals();
  $("#result .stats .wpm .bottom").text(stats.wpm);
  $("#result .stats .acc .bottom").text(stats.acc + "%");
  $("#result .stats .key .bottom").text(stats.correctChars + "/" + stats.incorrectChars);

  let mode2 = "";
  if (config.mode == "time") {
    mode2 = config.time;
  } else if (config.mode == "words") {
    mode2 = config.words;
  }
  hideCrown();
  let completedEvent = {
    wpm: stats.wpm,
    correctChars: stats.correctChars,
    incorrectChars: stats.incorrectChars,
    acc: stats.acc,
    mode: config.mode,
    mode2: mode2,
    punctuation: config.punctuation,
    timestamp: Date.now()
  };
  if (stats.wpm > 0 && stats.wpm < 250 && stats.acc > 50 && stats.acc <= 100) {
    if (firebase.auth().currentUser != null) {
      db_getUserHighestWpm(config.mode, mode2).then(data => {
        // console.log(`highest wpm for this mode is ${data}, current is ${stats.wpm}`);
        if (data < stats.wpm) {
          showCrown();
        }
        completedEvent.uid = firebase.auth().currentUser.uid;
        firebase.analytics().logEvent('testCompleted', completedEvent);
        db_testCompleted(completedEvent);
        dbSnapshot.unshift(completedEvent);
      });
      $("#result .loginTip").addClass('hidden');
    } else {
      firebase.analytics().logEvent('testCompletedNoLogin', completedEvent);
      $("#result .loginTip").removeClass('hidden');

      // showNotification("Sign in to save your result",3000);
    }
  } else {
    showNotification("Test invalid", 3000);
    firebase.analytics().logEvent('testCompletedInvalid', completedEvent);

  }


  let infoText = "";
  infoText = config.mode;

  if (config.mode == "time") {
    infoText += " " + config.time
  } else if (config.mode == "words") {
    infoText += " " + config.words
  }
  if (config.punctuation) {
    infoText += " with punctuation"
  }

  $("#result .stats .info .bottom").html(infoText);
  testActive = false;
  setFocus(false);
  hideCaret();
  hideLiveWpm();

  let labels = [];
  for (let i = 1; i <= wpmHistory.length; i++) {
    labels.push(i.toString());
  }

  let mainColor = getComputedStyle(document.body).getPropertyValue('--main-color').replace(' ', '');
  let subColor = getComputedStyle(document.body).getPropertyValue('--sub-color').replace(' ', '');


  wpmOverTimeChart.options.scales.xAxes[0].ticks.minor.fontColor = subColor;
  wpmOverTimeChart.options.scales.yAxes[0].ticks.minor.fontColor = subColor;
  wpmOverTimeChart.data.datasets[0].borderColor = mainColor;
  wpmOverTimeChart.data.labels = labels;
  wpmOverTimeChart.data.datasets[0].data = wpmHistory;
  wpmOverTimeChart.update({ duration: 0 });
  $("#words").animate({
    opacity: 0
  }, 125, () => {
    $("#words").addClass('hidden');
    $("#result").css('opacity', 0).removeClass('hidden');
    $("#result").animate({
      opacity: 1
    }, 125);
  })
}

function restartTest() {
  clearIntervals();
  time = 0;
  let fadetime = 125;
  setFocus(false);
  hideCaret();
  testActive = false;
  hideLiveWpm();

  $("#words").stop(true, true).animate({ opacity: 0 }, 125);
  $("#result").stop(true, true).animate({
    opacity: 0
  }, 125, () => {
    initWords();
    $("#result").addClass('hidden');
    $("#words").css('opacity', 0).removeClass('hidden').stop(true, true).animate({
      opacity: 1
    }, 125, () => {
      clearIntervals();
      $("#restartTestButton").css('opacity', 1);
      if ($("#commandLineWrapper").hasClass('hidden')) focusWords();
      wpmHistory = [];
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
  initWords();
}

function changeWordCount(wordCount) {
  changeMode("words");
  config.words = parseInt(wordCount);
  $("#top .config .wordCount .button").removeClass("active");
  $("#top .config .wordCount .button[wordCount='" + wordCount + "']").addClass(
    "active"
  );
  restartTest();
  saveConfigToCookie();
}

function changeTimeConfig(time) {
  changeMode("time");
  config.time = time;
  $("#top .config .time .button").removeClass("active");
  $("#top .config .time .button[timeConfig='" + time + "']").addClass("active");
  restartTest();
  saveConfigToCookie();
}

function changePage(page) {
  let activePage = $(".page.active");
  $(".page").removeClass('active');
  $("#wordsInput").focusout();
  if (page == "test" || page == "") {
    $(".page.pageTest").addClass('active');
    swapElements(activePage, $(".page.pageTest"), 250, focusWords);
    history.pushState('/', null, '/');
    showTestConfig();
    hideSignOutButton();
  } else if (page == "about") {
    $(".page.pageAbout").addClass('active');
    swapElements(activePage, $(".page.pageAbout"), 250);
    history.pushState('about', null, 'about');
    hideTestConfig();
    hideSignOutButton();
  } else if (page == "settings") {
    updateSettingsPage()
    $(".page.pageSettings").addClass('active');
    swapElements(activePage, $(".page.pageSettings"), 250);
    history.pushState('settings', null, 'settings');
    hideTestConfig();
    hideSignOutButton();
  } else if (page == "account") {
    if (!firebase.auth().currentUser) {
      changePage("login");
    } else {
      $(".page.pageAccount").addClass('active');
      swapElements(activePage, $(".page.pageAccount"), 250);
      refreshAccountPage();
      history.pushState('account', null, 'account');
      hideTestConfig();
      showSignOutButton();
    }
  } else if (page == "login") {
    if (firebase.auth().currentUser != null) {
      changePage('account');
    } else {
      $(".page.pageLogin").addClass('active');
      swapElements(activePage, $(".page.pageLogin"), 250);
      history.pushState('login', null, 'login');
      hideTestConfig();
      hideSignOutButton();

    }
  }
  // firebase.analytics().logEvent('changedPage', {
  //   page: page
  // });
}

function changeMode(mode) {
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
  saveConfigToCookie();
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
      return false;
    }

    $(el1).stop(true, true).removeClass('hidden').css('opacity', 1).animate({
      opacity: 0
    }, totalDuration / 2, () => {
      $(el1).addClass('hidden');
      $(el2).stop(true, true).removeClass('hidden').css('opacity', 0).animate({
        opacity: 1
      }, totalDuration / 2, () => {
        callback();
      });
    });

  } else if (el1.hasClass('hidden') && el2.hasClass('hidden')) {
    //both are hidden, only fade in the second
    $(el2).stop(true, true).removeClass('hidden').css('opacity', 0).animate({
      opacity: 1
    }, totalDuration, () => {
      callback();
    });
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
    swapElements($("#menu .button.login"), $("#menu .button.account"), 250);
    // $("#menu .button.login").removeClass('hidden');
    // $("#menu .button.account").addClass('hidden');
  }
}

$(document).on("click", "#top .logo", (e) => {
  changePage('test');
});

$(document).on("click", "#top .config .wordCount .button", (e) => {
  wrd = e.currentTarget.innerHTML;
  changeWordCount(wrd);
});

$(document).on("click", "#top .config .time .button", (e) => {
  time = e.currentTarget.innerHTML;
  changeTimeConfig(time);
});

$(document).on("click", "#top .config .customText .button", (e) => {
  changeCustomText();
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
    restartTest();
  }
});

$(document.body).on("click", "#restartTestButton", (event) => {
  restartTest();
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
  setFocus(false);
});

//keypresses for the test, using different method to be more responsive
$(document).keypress(function(event) {
  if (!$("#wordsInput").is(":focus")) return;
  if (event["keyCode"] == 13) return;
  if (event["keyCode"] == 32) return;
  //start the test
  if (currentInput == "" && inputHistory.length == 0) {
    if (firebase.auth().currentUser != null) {
      firebase.analytics().logEvent('testStarted');
    } else {
      firebase.analytics().logEvent('testStartedNoLogin');
    }
    testActive = true;
    stopCaretAnimation();
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
  } else {
    accuracyStats.correct++;
  }
  currentInput += event["key"];
  setFocus(true);
  compareInput();
  updateCaretPosition();
});

//handle keyboard events
$(document).keydown((event) => {


  //tab

  if (event["keyCode"] == 9) {
    if (config.quickTab && $(".pageTest").hasClass("active")) {
      event.preventDefault();
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
          inputHistory[currentWordIndex - 1] ==
          wordsList[currentWordIndex - 1] ||
          $($(".word")[currentWordIndex - 1]).hasClass("hidden")
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
          compareInput();
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
        compareInput();
      }
      updateCaretPosition();
    }
    //space
    if (event["keyCode"] == 32) {
      if (!testActive) return;
      event.preventDefault();
      if (currentInput == "") return;
      let currentWord = wordsList[currentWordIndex];
      if (config.mode == "time") {
        let currentTop = $($("#words .word")[currentWordIndex]).position().top;
        let nextTop = $($("#words .word")[currentWordIndex + 1]).position().top;
        if (nextTop > currentTop) {
          //last word of the line
          for (let i = 0; i < currentWordIndex + 1; i++) {
            $($("#words .word")[i]).addClass("hidden");
            // addWordLine();
          }
        }
      }
      if (currentWord == currentInput) {
        inputHistory.push(currentInput);
        currentInput = "";
        currentWordIndex++;
        updateActiveElement();
        updateCaretPosition();
      } else {
        inputHistory.push(currentInput);
        highlightBadWord();
        currentInput = "";
        currentWordIndex++;
        if (currentWordIndex == wordsList.length) {
          showResult();
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

$(document).ready(() => {
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
      borderWidth: 2
    }],
  },
  options: {
    tooltips: {
      titleFontFamily: "Roboto Mono",
      bodyFontFamily: "Roboto Mono"
    },
    legend: {
      display: false,
      labels: {
        defaultFontFamily: "Roboto Mono"
      }
    },
    responsive: true,
    maintainAspectRatio: false,
    tooltips: {
      mode: 'index',
      intersect: false,
    },
    hover: {
      mode: 'nearest',
      intersect: true
    },
    scales: {

      xAxes: [{
        ticks: {
          fontFamily: "Roboto Mono"
        },
        display: true,
        scaleLabel: {
          display: false,
          labelString: 'Seconds'
        }
      }],
      yAxes: [{
        display: true,
        scaleLabel: {
          display: false,
          labelString: 'Words per Minute'
        },
        ticks: {
          fontFamily: 'Roboto Mono',
          beginAtZero: true
        }
      }]
    }
  }
});