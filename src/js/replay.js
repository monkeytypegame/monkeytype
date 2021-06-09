/*
TODO:
  Export replay as video
  Export replay as typing test file?
    .ttr file extension (stands for typing test record)
      Should just be json, but fields should be specified by some format
        metadata field with rules, website source, mode, name of typist
        data field should be a list of objects, like monkeytype replay uses
        signature or verfication field should be able to check file validity with server
    And add ability to upload file to watch replay
*/
import config from './config';
import * as Sound from './sound';

let wordsList = [];
let replayData = [];
let replayStartTime = 0;
let replayRecording = true;
let wordPos = 0;
let curPos = 0;
let targetWordPos = 0;
let targetCurPos = 0;
let timeoutList = [];
let stopwatchList = [];
const toggleButton = document.getElementById("playpauseReplayButton")
  .children[0];

function replayGetWordsList(wordsListFromScript) {
  wordsList = wordsListFromScript;
}

function initializeReplayPrompt() {
  const replayWordsElement = document.getElementById("replayWords");
  replayWordsElement.innerHTML = "";
  let wordCount = 0;
  replayData.forEach((item) => {
    //trim wordsList for timed tests
    if (item.action === "backWord") {
      wordCount--;
    } else if (
      item.action === "submitCorrectWord" ||
      item.action === "submitErrorWord"
    ) {
      wordCount++;
    }
  });
  wordsList.forEach((item, i) => {
    if (i > wordCount) return;
    let x = document.createElement("div");
    x.className = "word";
    for (i = 0; i < item.length; i++) {
      let letter = document.createElement("LETTER");
      letter.innerHTML = item[i];
      x.appendChild(letter);
    }
    replayWordsElement.appendChild(x);
  });
}

export function pauseReplay() {
  timeoutList.forEach((item) => {
    clearTimeout(item);
  });
  timeoutList = [];
  stopwatchList.forEach((item) => {
    clearTimeout(item);
  });
  stopwatchList = [];
  targetCurPos = curPos;
  targetWordPos = wordPos;
  toggleButton.className = "fas fa-play";
  toggleButton.parentNode.setAttribute("aria-label", "Resume replay");
}

function playSound(error = false){
  if(error){
    if(config.playSoundOnError){
      Sound.playError();
    }else{
      Sound.playClick();
    }
  }else{
    Sound.playClick();
  }
}

function handleDisplayLogic(item) {
  let activeWord = document.getElementById("replayWords").children[wordPos];
  if (item.action === "correctLetter") {
    playSound();
    activeWord.children[curPos].classList.add("correct");
    curPos++;
  } else if (item.action === "incorrectLetter") {
    playSound(true);
    let myElement;
    if (curPos >= activeWord.children.length) {
      //if letter is an extra
      myElement = document.createElement("letter");
      myElement.classList.add("extra");
      myElement.innerHTML = item.letter;
      activeWord.appendChild(myElement);
    }
    myElement = activeWord.children[curPos];
    myElement.classList.add("incorrect");
    curPos++;
  } else if (item.action === "deleteLetter") {
    playSound();
    let myElement = activeWord.children[curPos - 1];
    if (myElement.classList.contains("extra")) {
      myElement.remove();
    } else {
      myElement.className = "";
    }
    curPos--;
  } else if (item.action === "submitCorrectWord") {
    playSound();
    wordPos++;
    curPos = 0;
  } else if (item.action === "submitErrorWord") {
    playSound(true);
    activeWord.classList.add("error");
    wordPos++;
    curPos = 0;
  } else if (item.action === "clearWord") {
    playSound();
    let promptWord = document.createElement("div");
    let wordArr = wordsList[wordPos].split("");
    wordArr.forEach((letter) => {
      promptWord.innerHTML += `<letter>${letter}</letter>`;
    });
    activeWord.innerHTML = promptWord.innerHTML;
    curPos = 0;
  } else if (item.action === "backWord") {
    playSound();
    wordPos--;
    activeWord = document.getElementById("replayWords").children[wordPos];
    curPos = activeWord.children.length;
    while (activeWord.children[curPos - 1].className === "") curPos--;
    activeWord.classList.remove("error");
  }
}

function loadOldReplay() {
  let startingIndex = 0;
  curPos = 0;
  wordPos = 0;
  replayData.forEach((item, i) => {
    if (
      wordPos < targetWordPos ||
      (wordPos === targetWordPos && curPos < targetCurPos)
    ) {
      //quickly display everything up to the target
      handleDisplayLogic(item);
      startingIndex = i + 1;
    }
  });
  const time = Math.floor(replayData[startingIndex].time / 1000);
  $("#replayStopwatch").text(time + "s");
  return startingIndex;
}

function toggleReplayDisplay() {
  if ($("#resultReplay").stop(true, true).hasClass("hidden")) {
    initializeReplayPrompt();
    loadOldReplay();
    //show
    if (!$("#watchReplayButton").hasClass("loaded")) {
      $("#words").html(
        `<div class="preloader"><i class="fas fa-fw fa-spin fa-circle-notch"></i></div>`
      );
      $("#resultReplay")
        .removeClass("hidden")
        .css("display", "none")
        .slideDown(250);
    } else {
      $("#resultReplay")
        .removeClass("hidden")
        .css("display", "none")
        .slideDown(250);
    }
  } else {
    //hide
    if (toggleButton.parentNode.getAttribute("aria-label") != "Start replay") {
      pauseReplay();
    }
    $("#resultReplay").slideUp(250, () => {
      $("#resultReplay").addClass("hidden");
    });
  }
}

function startReplayRecording() {
  if (!$("#resultReplay").stop(true, true).hasClass("hidden")) {
    //hide replay display if user left it open
    toggleReplayDisplay();
  }
  $("#replayStopwatch").text(0 + "s");
  replayData = [];
  replayStartTime = performance.now();
  replayRecording = true;
  targetCurPos = 0;
  targetWordPos = 0;
}

function stopReplayRecording() {
  replayRecording = false;
}

function addReplayEvent(action, letter = undefined) {
  if (replayRecording === false) {
    return;
  }
  let timeDelta = performance.now() - replayStartTime;
  if (action === "incorrectLetter" || action === "correctLetter") {
    replayData.push({ action: action, letter: letter, time: timeDelta });
  } else {
    replayData.push({ action: action, time: timeDelta });
  }
}

function playReplay() {
  curPos = 0;
  wordPos = 0;
  toggleButton.className = "fas fa-pause";
  toggleButton.parentNode.setAttribute("aria-label", "Pause replay");
  initializeReplayPrompt();
  let startingIndex = loadOldReplay();
  let lastTime = replayData[startingIndex].time;
  let swTime = Math.round(lastTime / 1000); //starting time
  const swEndTime = Math.round(replayData[replayData.length - 1].time / 1000);
  while (swTime <= swEndTime) {
    const time = swTime;
    stopwatchList.push(
      setTimeout(() => {
        $("#replayStopwatch").text(time + "s");
      }, time * 1000 - lastTime)
    );
    swTime++;
  }
  replayData.forEach((item, i) => {
    if (i < startingIndex) return;
    timeoutList.push(
      setTimeout(() => {
        handleDisplayLogic(item);
      }, item.time - lastTime)
    );
  });
  timeoutList.push(
    setTimeout(() => {
      //after the replay has finished, this will run
      targetCurPos = 0;
      targetWordPos = 0;
      toggleButton.className = "fas fa-play";
      toggleButton.parentNode.setAttribute("aria-label", "Start replay");
    }, replayData[replayData.length - 1].time - lastTime)
  );
}

$(".pageTest #playpauseReplayButton").click(async (event) => {
  if (toggleButton.className === "fas fa-play") {
    playReplay();
  } else if (toggleButton.className === "fas fa-pause") {
    pauseReplay();
  }
});

$("#replayWords").click((event) => {
  //allows user to click on the place they want to start their replay at
  pauseReplay();
  const replayWords = document.querySelector("#replayWords");
  let range;
  let textNode;

  if (document.caretPositionFromPoint) {
    // standard
    range = document.caretPositionFromPoint(event.pageX, event.pageY);
    textNode = range.offsetNode;
  } else if (document.caretRangeFromPoint) {
    // WebKit
    range = document.caretRangeFromPoint(event.pageX, event.pageY);
    textNode = range.startContainer;
  }

  const words = [...replayWords.children];
  targetWordPos = words.indexOf(textNode.parentNode.parentNode);
  const letters = [...words[targetWordPos].children];
  targetCurPos = letters.indexOf(textNode.parentNode);

  initializeReplayPrompt();
  loadOldReplay();
});

$(document).on("keypress", "#watchReplayButton", (event) => {
  if (event.keyCode == 13) {
    toggleReplayDisplay();
  }
});

$(document.body).on("click", "#watchReplayButton", () => {
  toggleReplayDisplay();
});

export {
  startReplayRecording,
  stopReplayRecording,
  addReplayEvent,
  replayGetWordsList,
};
