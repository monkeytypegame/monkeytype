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

function replayGetWordsList(wordsListFromScript) {
  wordsList = wordsListFromScript;
}

function initializeReplayPrompt(wordsList) {
  const replayWordsElement = document.getElementById("replayWords");
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
}

function stopReplayRecording() {
  replayRecording = false;
}

function addReplayEvent(action, letter = undefined) {
  if (replayRecording === false) {
    return;
  }
  /*
    This function is called whenever an event happens during a live test
      The event is then stored in the replayData list as a json object
    action is a string
  */
  const acceptedActions = [
    "correctLetter",
    "incorrectLetter",
    "extraLetter",
    "deleteLetter",
    "submitErrorWord",
    "submitCorrectWord",
    "clearWord",
  ];
  let timeDelta = performance.now() - replayStartTime;
  if (
    action === "incorrectLetter" ||
    action === "extraLetter" ||
    action === "correctLetter"
  ) {
    replayData.push({ action: action, letter: letter, time: timeDelta });
  } else {
    replayData.push({ action: action, time: timeDelta });
  }
  console.log(replayData);
}

function playReplay() {
  let stopReplay = false;
  let wordPos = 0;
  let curPos = 0;
  $(".pageTest #startReplayButton").click((event) => {
    stopReplay = true;
  });
  replayData.forEach((item, i) => {
    setTimeout(() => {
      if (stopReplay == true) {
        return;
      }
      console.log(item);
      //Add logic here
    }, item.time);
  });
}

function toggleReplayDisplay() {
  if ($("#resultReplay").stop(true, true).hasClass("hidden")) {
    initializeReplayPrompt(wordsList);
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
    $("#resultReplay").slideUp(250, () => {
      $("#resultReplay").addClass("hidden");
    });
  }
}

$(".pageTest #startReplayButton").click(async (event) => {
  playReplay();
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
