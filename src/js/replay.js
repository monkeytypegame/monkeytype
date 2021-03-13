export function watchReplay(
  wordsList,
  inputHist,
  correctedHist,
  wpmHist,
  rawHist
) {
  console.log("Watching replay from function");
  console.log(wordsList);
  console.log(inputHist);
  console.log(correctedHist);
  console.log(wpmHist);
  console.log(rawHist);
  $("#exitReplay").removeClass("hidden");
  $("#replay").removeClass("hidden");
  //$("#typingTest").removeClass("hidden");
  $("#result").addClass("hidden");
}

function initializeWords() {}
