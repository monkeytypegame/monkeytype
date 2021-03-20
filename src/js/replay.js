/*
// TODO:
  * Stop replay when a new test is started or a new replay is requested
  * Make replay.js es6/refactored
*/
let wordsList = [];
export function replayGetWordsList(wordsListFromScript) {
  wordsList = wordsListFromScript;
}

function showReplayWords(wordsList) {
  const wordsString = wordsList.join(" ");
  $("#replayWords").text(wordsString);
}

let replayTrackingStarted = false; // mirrors testActive state, only exists because of es6 modules
function startReplayTracking() {
  replayTrackingStarted = true;
}
function stopReplayTracking() {
  replayTrackingStarted = false;
}

//save keys and time between keys to lists
let keysPressed = [];
let timeBetweenKeys = [];
let lastInputTime = performance.now();
const ignoredKeys = ["Tab", "Shift", "Control", "Alt", "Escape"];
$(document).keydown((event) => {
  //make sure that test is active and key is not forbidden
  if (replayTrackingStarted && ignoredKeys.indexOf(event.key) < 0) {
    keysPressed.push(event.key);
    timeBetweenKeys.push(performance.now() - lastInputTime);
    lastInputTime = performance.now();
  }
});

function clearReplayData() {
  //set to first letter of first word and 0ms to type first letter
  keysPressed = [wordsList[0][0]];
  timeBetweenKeys = [0];
  lastInputTime = performance.now();
}

function toggleReplayDisplay() {
  if ($("#resultReplay").stop(true, true).hasClass("hidden")) {
    showReplayWords(wordsList);
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

async function startReplay() {
  showReplayWords(wordsList);
  //show replay of the typing test
  let promptPart = document.getElementById("replayWords").innerHTML;
  let promptPartLast = ""; //passed letters will go here
  let inputPart = '<div class="word">'; //html representation of input
  let replayOutput = "</div>"; //combined inputPart and promptPart
  let lastTime = 0;
  keysPressed.forEach((item, i) => {
    setTimeout(() => {
      // TODO handle pressing backspace when last word was correct
      // pressing backspace when last word was skipped results in the entire prompt being underlined and word stays underlined after it's fixed
      // error class persists after correction
      if (keysPressed[i] == " " && promptPart[0] == " ") {
        // if space was pressed and space was expected
        inputPart += '</div><div class="word">'; //end word and create new word
        promptPartLast += promptPart[0]; //add typed letter to last prompt
        promptPart = promptPart.substring(1); //removed last typed character from prompt
      } else if (keysPressed[i] == promptPart[0]) {
        //if pressed key is correct:
        inputPart += '<letter class="correct">' + keysPressed[i] + "</letter>";
        promptPartLast += promptPart[0]; //add typed letter to last prompt
        promptPart = promptPart.substring(1); //removed last typed character from prompt
      } else if (keysPressed[i] == "Backspace") {
        let lastLetterIndex = inputPart.lastIndexOf("<letter"); //get index of last inputted letter
        if (promptPartLast.slice(-1) == " ") {
          //if going back a word check for error
        }
        if (
          inputPart.substring(lastLetterIndex).substring(15, 22) == "skipped"
        ) {
          //if the last word was skipped
          let closeTagStart = inputPart
            .substring(lastLetterIndex)
            .lastIndexOf("</letter>");
          let skippedLetters = inputPart
            .substring(lastLetterIndex)
            .substring(24, closeTagStart); //area between "incorrect"> and </letter>
          promptPart = skippedLetters + " " + promptPart;
          promptPartLast = promptPartLast.slice(0, skippedLetters.length + 1); //remove skippedLetters and space from lastletters
        } else if (
          inputPart.substring(lastLetterIndex).substring(25, 30) != "extra"
        ) {
          //if the last character was not an extra
          promptPart = promptPartLast.slice(-1) + promptPart; // set as last removed character + current string
          promptPartLast = promptPartLast.slice(0, -1); // remove last character from partlast
        }
        inputPart = inputPart.substring(0, lastLetterIndex); // remove last letter element
      } else if (keysPressed[i] != " " && promptPart[0] == " ") {
        // if a key other than space was pressed, but space was expected
        inputPart +=
          '<letter class="incorrect extra">' + keysPressed[i] + "</letter>";
      } else if (keysPressed[i] == " " && promptPart[0] != " ") {
        // if space is pressed but next character is not a space
        let skipToIndex = promptPart.indexOf(" ");
        let skippedText = promptPart.substring(0, skipToIndex); //-1 to remove the space
        promptPart = promptPart.substring(skipToIndex + 1);
        promptPartLast += skippedText + " ";
        inputPart +=
          '<letter class="skipped">' +
          skippedText +
          '</letter></div><div class="word">';
      } else if (keysPressed[i] != promptPart[0]) {
        //keyPressed is not correct
        inputPart +=
          '<letter class="incorrect">' + keysPressed[i] + "</letter>";
        promptPartLast += promptPart[0]; //add typed letter to last prompt
        promptPart = promptPart.substring(1); //removed next character from prompt
      } else {
        console.log("Invalid replay situation");
      }

      //check if last submitted word was an error
      if (keysPressed[i] == " ") {
        let nextWordIndex = inputPart.lastIndexOf('<div class="word"');
        let submittedWordIndex = inputPart.lastIndexOf(
          '<div class="word"',
          nextWordIndex - 1
        ); // get index of last submitted word
        let submittedWordSubstring = inputPart.substring(
          submittedWordIndex,
          nextWordIndex
        );
        if (
          submittedWordSubstring.indexOf("incorrect") >= 0 ||
          submittedWordSubstring.indexOf("skipped") >= 0
        ) {
          let newSubmittedWord =
            submittedWordSubstring.slice(0, 16) +
            " error" +
            submittedWordSubstring.slice(16);
          inputPart = inputPart.replace(
            submittedWordSubstring,
            newSubmittedWord
          ); //replace submittedWordSubstring with newSubmittedWord
        } else if (submittedWordSubstring.indexOf("error") >= 0) {
          //if there was an error but there isn't anymore
          let newSubmittedWord = "";
          if (
            submittedWordSubstring.indexOf("incorrect") < 0 ||
            submittedWordSubstring.indexOf("skipped") < 0
          ) {
            // if there are no incorrect or skipped words
            newSubmittedWord =
              submittedWordSubstring.slice(0, 16) +
              submittedWordSubstring.slice(22);
          }
          inputPart = inputPart.replace(
            submittedWordSubstring,
            newSubmittedWord
          );
        }
      }
      replayOutput = inputPart + promptPart;
      document.getElementById("replayWords").innerHTML = replayOutput;
    }, lastTime + timeBetweenKeys[i]);
    lastTime += timeBetweenKeys[i];
  });
}

$(".pageTest #startReplayButton").click(async (event) => {
  startReplay();
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
  clearReplayData,
  replayTrackingStarted,
  startReplayTracking,
  stopReplayTracking,
};
