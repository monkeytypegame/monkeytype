/*
TODO:
  One method I could use to store data is store actions instead of keystrokes
    Have an event for every possible action
      This helps when using special settings like no backspace
    Examples:
      If the program detects a correct letter, write correct letter to the list with the time it occurred at
      If removed last word, add that event
  Fix critical bugs that break replay
    Might want to rewrite with linked list or word and letter classes
  Add a pause button
  Support for ctrl-backspace deletes an entire word
  When you click on a word, teh replay jumps to that word
  Export replay as video
  Export replay as typing test file?
    And add ability to upload file to watch replay
*/
let wordsList = [];
let replayData = [];
let replayStartTime = 0;
let replayRecording = true;
let wordPos = 0;
let curPos = 0;
let targetWordPos = 0;
let targetCurPos = 0;
let timeoutList = [];
const toggleButton = document.getElementById("playpauseReplayButton")
  .children[0];

function replayGetWordsList(wordsListFromScript) {
  wordsList = wordsListFromScript;
}

function initializeReplayPrompt(wordsList) {
  const replayWordsElement = document.getElementById("replayWords");
  replayWordsElement.innerHTML = "";
  wordsList.forEach((item, i) => {
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

function startReplayRecording() {
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

function pauseReplay() {
  timeoutList.forEach((item, i) => {
    clearTimeout(item);
  });
  timeoutList = [];
  targetCurPos = curPos;
  targetWordPos = wordPos;
  toggleButton.className = "fas fa-play";
  toggleButton.parentNode.setAttribute("aria-label", "Resume replay");
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
  return startingIndex;
}

function playReplay() {
  curPos = 0;
  wordPos = 0;
  toggleButton.className = "fas fa-pause";
  toggleButton.parentNode.setAttribute("aria-label", "Pause replay");
  initializeReplayPrompt(wordsList);
  let startingIndex = loadOldReplay();
  let lastTime = replayData[startingIndex].time;
  replayData.forEach((item, i) => {
    if (i < startingIndex) {
      return;
    }
    timeoutList.push(
      setTimeout(() => {
        console.log(item);
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

function handleDisplayLogic(item) {
  if (item.action === "correctLetter") {
    document
      .getElementById("replayWords")
      .children[wordPos].children[curPos].classList.add("correct");
    curPos++;
  } else if (item.action === "incorrectLetter") {
    let myElement;
    if (
      curPos >=
      document.getElementById("replayWords").children[wordPos].children.length
    ) {
      //if letter is an extra
      myElement = document.createElement("letter");
      myElement.classList.add("extra");
      myElement.innerHTML = item.letter;
      document
        .getElementById("replayWords")
        .children[wordPos].appendChild(myElement);
    }
    myElement = document.getElementById("replayWords").children[wordPos]
      .children[curPos];
    myElement.classList.add("incorrect");
    curPos++;
  } else if (item.action === "deleteLetter") {
    let myElement = document.getElementById("replayWords").children[wordPos]
      .children[curPos - 1];
    if (myElement.classList.contains("extra")) {
      myElement.remove();
    } else {
      myElement.className = "";
    }
    curPos--;
  } else if (item.action === "submitCorrectWord") {
    wordPos++;
    curPos = 0;
  } else if (item.action === "submitErrorWord") {
    document
      .getElementById("replayWords")
      .children[wordPos].classList.add("error");
    wordPos++;
    curPos = 0;
  } else if (item.action === "clearWord") {
    let promptWord = document.createElement("div");
    let wordArr = wordsList[wordPos].split("");
    wordArr.forEach((letter, i) => {
      promptWord.innerHTML += `<letter>${letter}</letter>`;
    });
    document.getElementById("replayWords").children[wordPos].innerHTML =
      promptWord.innerHTML;
    curPos = 0;
  } else if (item.action === "backWord") {
    wordPos--;
    curPos = document.getElementById("replayWords").children[wordPos].children
      .length;
    while (
      document.getElementById("replayWords").children[wordPos].children[
        curPos - 1
      ].className === ""
    ) {
      curPos--;
    }
    document
      .getElementById("replayWords")
      .children[wordPos].classList.remove("error");
  }
}

function toggleReplayDisplay() {
  if ($("#resultReplay").stop(true, true).hasClass("hidden")) {
    initializeReplayPrompt(wordsList);
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
    pauseReplay();
    $("#resultReplay").slideUp(250, () => {
      $("#resultReplay").addClass("hidden");
    });
  }
}

$(".pageTest #playpauseReplayButton").click(async (event) => {
  if (toggleButton.className === "fas fa-play") {
    playReplay();
  } else if (toggleButton.className === "fas fa-pause") {
    pauseReplay();
  }
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
