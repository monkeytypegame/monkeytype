let wordsList = [];
let currentWordIndex = 0;
let currentWordElementIndex = 0;
let inputHistory = [];
let correctedHistory = [];
let currentCorrected = "";
let currentInput = "";
let time = 0;
let timer = null;
let testActive = false;
let testStart, testEnd;
let testInvalid = false;
let wpmHistory = [];
let rawHistory = [];
let restartCount = 0;
let incompleteTestSeconds = 0;
let currentTestLine = 0;
let pageTransition = false;
let lineTransition = false;
let keypressPerSecond = [];
let currentKeypress = {
  count: 0,
  mod: 0,
  words: [],
};
let errorsPerSecond = [];
let currentError = {
  count: 0,
  words: [],
};
let resultVisible = false;
let activeWordTopBeforeJump = 0;
let activeWordTop = 0;
let activeWordJumped = false;
let sameWordset = false;
let quotes = null;
let focusState = false;
let activeFunBox = "none";
let manualRestart = false;
let bailout = false;
let notSignedInLastResult = null;
let caretAnimating = true;
let lastSecondNotRound = false;
let paceCaret = null;
let missedWords = [];
let verifyUserWhenLoggedIn = null;
let modeBeforePractise = null;
let memoryFunboxTimer = null;
let memoryFunboxInterval = null;

let themeColors = {
  bg: "#323437",
  main: "#e2b714",
  caret: "#e2b714",
  sub: "#646669",
  text: "#d1d0c5",
  error: "#ca4754",
  errorExtra: "#7e2a33",
  colorfulError: "#ca4754",
  colorfulErrorExtra: "#7e2a33",
};

let accuracyStats = {
  correct: 0,
  incorrect: 0,
};

let keypressStats = {
  spacing: {
    current: -1,
    array: [],
  },
  duration: {
    current: -1,
    array: [],
  },
};

let errorSound = new Audio("../sound/error.wav");
let clickSounds = null;

let isPreviewingTheme = false;

function initClickSounds() {
  clickSounds = {
    1: [
      {
        sounds: [
          new Audio("../sound/click1/click1_1.wav"),
          new Audio("../sound/click1/click1_1.wav"),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Audio("../sound/click1/click1_2.wav"),
          new Audio("../sound/click1/click1_2.wav"),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Audio("../sound/click1/click1_3.wav"),
          new Audio("../sound/click1/click1_3.wav"),
        ],
        counter: 0,
      },
    ],
    2: [
      {
        sounds: [
          new Audio("../sound/click2/click2_1.wav"),
          new Audio("../sound/click2/click2_1.wav"),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Audio("../sound/click2/click2_2.wav"),
          new Audio("../sound/click2/click2_2.wav"),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Audio("../sound/click2/click2_3.wav"),
          new Audio("../sound/click2/click2_3.wav"),
        ],
        counter: 0,
      },
    ],
    3: [
      {
        sounds: [
          new Audio("../sound/click3/click3_1.wav"),
          new Audio("../sound/click3/click3_1.wav"),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Audio("../sound/click3/click3_2.wav"),
          new Audio("../sound/click3/click3_2.wav"),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Audio("../sound/click3/click3_3.wav"),
          new Audio("../sound/click3/click3_3.wav"),
        ],
        counter: 0,
      },
    ],
    4: [
      {
        sounds: [
          new Audio("../sound/click4/click4_1.wav"),
          new Audio("../sound/click4/click4_1.wav"),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Audio("../sound/click4/click4_2.wav"),
          new Audio("../sound/click4/click4_2.wav"),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Audio("../sound/click4/click4_3.wav"),
          new Audio("../sound/click4/click4_3.wav"),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Audio("../sound/click4/click4_4.wav"),
          new Audio("../sound/click4/click4_4.wav"),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Audio("../sound/click4/click4_5.wav"),
          new Audio("../sound/click4/click4_5.wav"),
        ],
        counter: 0,
      },
      {
        sounds: [
          new Audio("../sound/click4/click4_6.wav"),
          new Audio("../sound/click4/click4_6.wav"),
        ],
        counter: 0,
      },
    ],
  };
}

let customText = "The quick brown fox jumps over the lazy dog".split(" ");
let customTextIsRandom = false;
let customTextWordCount = 1;
let randomQuote = null;

function refreshThemeColorObject() {
  let st = getComputedStyle(document.body);

  themeColors.bg = st.getPropertyValue("--bg-color").replace(" ", "");
  themeColors.main = st.getPropertyValue("--main-color").replace(" ", "");
  themeColors.caret = st.getPropertyValue("--caret-color").replace(" ", "");
  themeColors.sub = st.getPropertyValue("--sub-color").replace(" ", "");
  themeColors.text = st.getPropertyValue("--text-color").replace(" ", "");
  themeColors.error = st.getPropertyValue("--error-color").replace(" ", "");
  themeColors.errorExtra = st
    .getPropertyValue("--error-extra-color")
    .replace(" ", "");
  themeColors.colorfulError = st
    .getPropertyValue("--colorful-error-color")
    .replace(" ", "");
  themeColors.colorfulErrorExtra = st
    .getPropertyValue("--colorful-error-extra-color")
    .replace(" ", "");
  updateChartColors();
}

function copyResultToClipboard() {
  $(".pageTest .ssWatermark").removeClass("hidden");
  $(".pageTest .buttons").addClass("hidden");
  let src = $("#middle");
  var sourceX = src.position().left; /*X position from div#target*/
  var sourceY = src.position().top; /*Y position from div#target*/
  var sourceWidth = src.width(); /*clientWidth/offsetWidth from div#target*/
  var sourceHeight = src.height(); /*clientHeight/offsetHeight from div#target*/
  $(".notification").addClass("hidden");
  $(".pageTest .loginTip").addClass("hidden");
  try {
    html2canvas(document.body, {
      backgroundColor: themeColors.bg,
      height: sourceHeight + 50,
      width: sourceWidth + 50,
      x: sourceX - 25,
      y: sourceY - 25,
    }).then(function (canvas) {
      canvas.toBlob(function (blob) {
        try {
          navigator.clipboard
            .write([
              new ClipboardItem(
                Object.defineProperty({}, blob.type, {
                  value: blob,
                  enumerable: true,
                })
              ),
            ])
            .then((f) => {
              $(".notification").removeClass("hidden");
              Misc.showNotification("Copied to clipboard", 1000);
              $(".pageTest .ssWatermark").addClass("hidden");
              $(".pageTest .buttons").removeClass("hidden");
              if (firebase.auth().currentUser == null)
                $(".pageTest .loginTip").removeClass("hidden");
            })
            .catch((f) => {
              open(URL.createObjectURL(blob));
              $(".notification").removeClass("hidden");
              Misc.showNotification("Error saving image to clipboard", 2000);
              $(".pageTest .ssWatermark").addClass("hidden");
              $(".pageTest .buttons").removeClass("hidden");
              if (firebase.auth().currentUser == null)
                $(".pageTest .loginTip").removeClass("hidden");
            });
        } catch (e) {
          open(URL.createObjectURL(blob));
          $(".notification").removeClass("hidden");
          Misc.showNotification("Error saving image to clipboard", 2000);
          $(".pageTest .ssWatermark").addClass("hidden");
          $(".pageTest .buttons").removeClass("hidden");
          if (firebase.auth().currentUser == null)
            $(".pageTest .loginTip").removeClass("hidden");
        }
      });
    });
  } catch (e) {
    $(".notification").removeClass("hidden");
    Misc.showNotification("Error creating image", 2000);
    $(".pageTest .ssWatermark").addClass("hidden");
    $(".pageTest .buttons").removeClass("hidden");
    if (firebase.auth().currentUser == null)
      $(".pageTest .loginTip").removeClass("hidden");
  }
}

async function activateFunbox(funbox, mode) {
  if (testActive || resultVisible) {
    Misc.showNotification(
      "You can only change the funbox before starting a test.",
      4000
    );
    return false;
  }
  if (Misc.getCurrentLanguage().ligatures) {
    if (funbox == "choo_choo" || funbox == "earthquake") {
      Misc.showNotification(
        "Current language does not support this funbox mode",
        3000
      );
      activateFunbox("none", null);
      return;
    }
  }
  $("#funBoxTheme").attr("href", ``);
  $("#words").removeClass("nospace");
  // if (funbox === "none") {
  activeFunBox = "none";
  memoryFunboxInterval = clearInterval(memoryFunboxInterval);
  memoryFunboxTimer = null;
  $("#wordsWrapper").removeClass("hidden");
  // }

  if (mode === null || mode === undefined) {
    let list = await Misc.getFunboxList();
    mode = list.filter((f) => f.name === funbox)[0].type;
  }

  manualRestart = true;
  if (mode === "style") {
    if (funbox != undefined) {
      $("#funBoxTheme").attr("href", `funbox/${funbox}.css`);
      activeFunBox = funbox;
    }

    if (funbox === "simon_says") {
      setKeymapMode("next");
      settingsGroups.keymapMode.updateButton();
      restartTest();
    }

    if (funbox === "read_ahead" || funbox === "read_ahead_easy") {
      setHighlightMode("letter", true);
      restartTest();
    }
  } else if (mode === "script") {
    if (funbox === "tts") {
      $("#funBoxTheme").attr("href", `funbox/simon_says.css`);
      config.keymapMode = "off";
      settingsGroups.keymapMode.updateButton();
      restartTest();
    } else if (funbox === "layoutfluid") {
      config.keymapMode = "on";
      setKeymapMode("next");
      settingsGroups.keymapMode.updateButton();
      config.savedLayout = config.layout;
      setLayout("qwerty");
      settingsGroups.layout.updateButton();
      setKeymapLayout("qwerty");
      settingsGroups.keymapLayout.updateButton();
      restartTest();
    } else if (funbox === "memory") {
      setMode("words");
      setShowAllLines(true, true);
      restartTest(false, true);
      if (config.keymapMode === "next") {
        setKeymapMode("react");
      }
    } else if (funbox === "nospace") {
      $("#words").addClass("nospace");
      setHighlightMode("letter", true);
      restartTest(false, true);
    }
    activeFunBox = funbox;
  }

  if (funbox !== "layoutfluid" || mode !== "script") {
    if (config.layout !== config.savedLayout) {
      setLayout(config.savedLayout);
      settingsGroups.layout.updateButton();
    }
  }
  updateTestModesNotice();
  return true;
}

function toggleScriptFunbox(...params) {
  if (activeFunBox === "tts") {
    var msg = new SpeechSynthesisUtterance();
    msg.text = params[0];
    msg.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(msg);
  }
}

function getuid() {
  console.error("Only share this uid with Miodec and nobody else!");
  console.log(firebase.auth().currentUser.uid);
  console.error("Only share this uid with Miodec and nobody else!");
}

function setFocus(foc) {
  if (foc && !focusState) {
    focusState = true;
    stopCaretAnimation();
    $("#top").addClass("focus");
    $("#bottom").addClass("focus");
    $("body").css("cursor", "none");
    $("#middle").addClass("focus");
  } else if (!foc && focusState) {
    focusState = false;
    if (testActive) {
      stopCaretAnimation();
    } else {
      startCaretAnimation();
    }
    $("#top").removeClass("focus");
    $("#bottom").removeClass("focus");
    $("body").css("cursor", "default");
    $("#middle").removeClass("focus");
  }
}

async function initWords() {
  testActive = false;
  wordsList = [];
  currentWordIndex = 0;
  currentWordElementIndex = 0;
  accuracyStats = {
    correct: 0,
    incorrect: 0,
  };
  inputHistory = [];
  correctedHistory = [];
  currentCorrected = "";
  currentInput = "";

  let language = await Misc.getLanguage(config.language);
  if (language && language.name !== config.language) {
    config.language = "english";
  }

  if (config.mode === "quote" && quotes === null) {
    showBackgroundLoader();
    $.ajax({
      url: "js/english_quotes.json",
      async: false,
      success: function (data) {
        hideBackgroundLoader();
        quotes = data;
        quotes.groups.forEach((qg, i) => {
          let lower = qg[0];
          let upper = qg[1];
          quotes.groups[i] = quotes.quotes.filter((q) => {
            if (q.length >= lower && q.length <= upper) {
              q.group = i;
              return true;
            } else {
              return false;
            }
          });
        });
        quotes.quotes = [];
      },
    });
  }

  if (!language) {
    config.language = "english";
    language = words[config.language];
  }

  if (
    config.mode == "time" ||
    config.mode == "words" ||
    config.mode == "custom"
  ) {
    let wordsBound = 100;
    if (config.showAllLines) {
      if (config.mode === "custom") {
        if (customTextIsRandom) {
          wordsBound = customTextWordCount;
        } else {
          wordsBound = customText.length;
        }
      } else if (config.mode != "time") {
        wordsBound = config.words;
      }
    } else {
      if (config.mode === "words" && config.words < wordsBound) {
        wordsBound = config.words;
      }
      if (
        config.mode == "custom" &&
        customTextIsRandom &&
        customTextWordCount < wordsBound
      ) {
        wordsBound = customTextWordCount;
      }
      if (
        config.mode == "custom" &&
        !customTextIsRandom &&
        customText.length < wordsBound
      ) {
        wordsBound = customText.length;
      }
    }
    if (config.mode === "words" && config.words === 0) {
      wordsBound = 100;
    }
    if (activeFunBox === "plus_one") {
      wordsBound = 2;
    }
    let wordset = language.words;
    if (config.mode == "custom") {
      wordset = customText;
    }
    for (let i = 0; i < wordsBound; i++) {
      let randomWord = wordset[Math.floor(Math.random() * wordset.length)];
      const previousWord = wordsList[i - 1];
      const previousWord2 = wordsList[i - 2];
      if (config.mode == "custom" && customTextIsRandom) {
        randomWord = wordset[Math.floor(Math.random() * wordset.length)];
      } else if (config.mode == "custom" && !customTextIsRandom) {
        randomWord = customText[i];
      } else {
        while (
          randomWord == previousWord ||
          randomWord == previousWord2 ||
          (!config.punctuation && randomWord == "I") ||
          randomWord.indexOf(" ") > -1
        ) {
          randomWord = wordset[Math.floor(Math.random() * wordset.length)];
        }
      }

      if (activeFunBox === "rAnDoMcAsE") {
        let randomcaseword = "";
        for (let i = 0; i < randomWord.length; i++) {
          if (i % 2 != 0) {
            randomcaseword += randomWord[i].toUpperCase();
          } else {
            randomcaseword += randomWord[i];
          }
        }
        randomWord = randomcaseword;
      } else if (activeFunBox === "gibberish") {
        randomWord = Misc.getGibberish();
      } else if (activeFunBox === "58008") {
        setToggleSettings(false, true);
        randomWord = Misc.getNumbers(7);
      } else if (activeFunBox === "specials") {
        setToggleSettings(false, true);
        randomWord = Misc.getSpecials();
      } else if (activeFunBox === "ascii") {
        setToggleSettings(false, true);
        randomWord = Misc.getASCII();
      }

      if (config.punctuation && config.mode != "custom") {
        randomWord = punctuateWord(previousWord, randomWord, i, wordsBound);
      }
      if (config.numbers && config.mode != "custom") {
        if (Math.random() < 0.1) {
          randomWord = Misc.getNumbers(4);
        }
      }

      wordsList.push(randomWord);
    }
  } else if (config.mode == "quote") {
    let group = config.quoteLength;

    if (config.quoteLength === -1) {
      group = Math.floor(Math.random() * quotes.groups.length);
    }

    let rq =
      quotes.groups[group][
        Math.floor(Math.random() * quotes.groups[group].length)
      ];
    if (randomQuote != null && rq.id === randomQuote.id) {
      rq =
        quotes.groups[group][
          Math.floor(Math.random() * quotes.groups[group].length)
        ];
    }
    randomQuote = rq;
    let w = rq.text.trim().split(" ");
    for (let i = 0; i < w.length; i++) {
      wordsList.push(w[i]);
    }
  }
  //handle right-to-left languages
  if (language.leftToRight) {
    arrangeCharactersLeftToRight();
  } else {
    arrangeCharactersRightToLeft();
  }
  if (language.ligatures) {
    $("#words").addClass("withLigatures");
  } else {
    $("#words").removeClass("withLigatures");
  }
  showWords();
}

function arrangeCharactersRightToLeft() {
  $("#words").addClass("rightToLeftTest");
}

function arrangeCharactersLeftToRight() {
  $("#words").removeClass("rightToLeftTest");
}

function setToggleSettings(state, nosave) {
  setPunctuation(state, nosave);
  setNumbers(state, nosave);
}

function emulateLayout(event) {
  function emulatedLayoutShouldShiftKey(event, newKeyPreview) {
    if (config.capsLockBackspace) return event.shiftKey;
    const isCapsLockHeld = event.originalEvent.getModifierState("CapsLock");
    if (isCapsLockHeld)
      return Misc.isASCIILetter(newKeyPreview) !== event.shiftKey;
    return event.shiftKey;
  }

  function replaceEventKey(event, keyCode) {
    const newKey = String.fromCharCode(keyCode);
    event.keyCode = keyCode;
    event.charCode = keyCode;
    event.which = keyCode;
    event.key = newKey;
    event.code = "Key" + newKey.toUpperCase();
  }

  let newEvent = event;

  try {
    if (config.layout === "default") {
      //override the caps lock modifier for the default layout if needed
      if (config.capsLockBackspace && Misc.isASCIILetter(newEvent.key)) {
        replaceEventKey(
          newEvent,
          newEvent.shiftKey
            ? newEvent.key.toUpperCase().charCodeAt(0)
            : newEvent.key.toLowerCase().charCodeAt(0)
        );
      }
      return newEvent;
    }
    const keyEventCodes = [
      "Backquote",
      "Digit1",
      "Digit2",
      "Digit3",
      "Digit4",
      "Digit5",
      "Digit6",
      "Digit7",
      "Digit8",
      "Digit9",
      "Digit0",
      "Minus",
      "Equal",
      "KeyQ",
      "KeyW",
      "KeyE",
      "KeyR",
      "KeyT",
      "KeyY",
      "KeyU",
      "KeyI",
      "KeyO",
      "KeyP",
      "BracketLeft",
      "BracketRight",
      "Backslash",
      "KeyA",
      "KeyS",
      "KeyD",
      "KeyF",
      "KeyG",
      "KeyH",
      "KeyJ",
      "KeyK",
      "KeyL",
      "Semicolon",
      "Quote",
      "IntlBackslash",
      "KeyZ",
      "KeyX",
      "KeyC",
      "KeyV",
      "KeyB",
      "KeyN",
      "KeyM",
      "Comma",
      "Period",
      "Slash",
      "Space",
    ];
    const layoutMap = layouts[config.layout].keys;

    let mapIndex;
    for (let i = 0; i < keyEventCodes.length; i++) {
      if (newEvent.code == keyEventCodes[i]) {
        mapIndex = i;
      }
    }
    const newKeyPreview = layoutMap[mapIndex][0];
    const shift = emulatedLayoutShouldShiftKey(newEvent, newKeyPreview) ? 1 : 0;
    const newKey = layoutMap[mapIndex][shift];
    replaceEventKey(newEvent, newKey.charCodeAt(0));
  } catch (e) {
    return event;
  }
  return newEvent;
}

function punctuateWord(previousWord, currentWord, index, maxindex) {
  let word = currentWord;

  if (
    (index == 0 ||
      Misc.getLastChar(previousWord) == "." ||
      Misc.getLastChar(previousWord) == "?" ||
      Misc.getLastChar(previousWord) == "!") &&
    config.language.split("_")[0] != "code"
  ) {
    //always capitalise the first word or if there was a dot unless using a code alphabet
    word = Misc.capitalizeFirstLetter(word);
  } else if (
    (Math.random() < 0.1 &&
      Misc.getLastChar(previousWord) != "." &&
      Misc.getLastChar(previousWord) != "," &&
      index != maxindex - 2) ||
    index == maxindex - 1
  ) {
    let rand = Math.random();
    if (rand <= 0.8) {
      word += ".";
    } else if (rand > 0.8 && rand < 0.9) {
      if (config.language.split("_")[0] == "french") {
        word = "?";
      } else {
        word += "?";
      }
    } else {
      if (config.language.split("_")[0] == "french") {
        word = "!";
      } else {
        word += "!";
      }
    }
  } else if (
    Math.random() < 0.01 &&
    Misc.getLastChar(previousWord) != "," &&
    Misc.getLastChar(previousWord) != "." &&
    config.language.split("_")[0] !== "russian"
  ) {
    word = `"${word}"`;
  } else if (
    Math.random() < 0.01 &&
    Misc.getLastChar(previousWord) != "," &&
    Misc.getLastChar(previousWord) != "." &&
    config.language.split("_")[0] !== "russian"
  ) {
    word = `'${word}'`;
  } else if (
    Math.random() < 0.01 &&
    Misc.getLastChar(previousWord) != "," &&
    Misc.getLastChar(previousWord) != "."
  ) {
    if (config.language.split("_")[0] == "code") {
      let r = Math.random();
      if (r < 0.25) {
        word = `(${word})`;
      } else if (r < 0.5) {
        word = `{${word}}`;
      } else if (r < 0.75) {
        word = `[${word}]`;
      } else {
        word = `<${word}>`;
      }
    } else {
      word = `(${word})`;
    }
  } else if (Math.random() < 0.01) {
    if (config.language.split("_")[0] == "french") {
      word = ":";
    } else {
      word += ":";
    }
  } else if (
    Math.random() < 0.01 &&
    Misc.getLastChar(previousWord) != "," &&
    Misc.getLastChar(previousWord) != "." &&
    previousWord != "-"
  ) {
    word = "-";
  } else if (
    Math.random() < 0.01 &&
    Misc.getLastChar(previousWord) != "," &&
    Misc.getLastChar(previousWord) != "." &&
    Misc.getLastChar(previousWord) != ";"
  ) {
    if (config.language.split("_")[0] == "french") {
      word = ";";
    } else {
      word += ";";
    }
  } else if (Math.random() < 0.2 && Misc.getLastChar(previousWord) != ",") {
    word += ",";
  } else if (Math.random() < 0.25 && config.language.split("_")[0] == "code") {
    let specials = ["{", "}", "[", "]", "(", ")", ";", "=", "%", "/"];

    word = specials[Math.floor(Math.random() * 10)];
  }
  return word;
}

function addWord() {
  let bound = 100;
  if (activeFunBox === "plus_one") bound = 1;
  if (
    wordsList.length - inputHistory.length > bound ||
    (config.mode === "words" &&
      wordsList.length >= config.words &&
      config.words > 0) ||
    (config.mode === "custom" &&
      customTextIsRandom &&
      wordsList.length >= customTextWordCount) ||
    (config.mode === "custom" &&
      !customTextIsRandom &&
      wordsList.length >= customText.length)
  )
    return;
  const language =
    config.mode !== "custom"
      ? Misc.getCurrentLanguage()
      : {
          //borrow the direction of the current language
          leftToRight: Misc.getCurrentLanguage().leftToRight,
          words: customText,
        };
  const wordset = language.words;
  let randomWord = wordset[Math.floor(Math.random() * wordset.length)];
  const previousWord = wordsList[wordsList.length - 1];
  const previousWordStripped = previousWord
    .replace(/[.?!":\-,]/g, "")
    .toLowerCase();
  const previousWord2Stripped = wordsList[wordsList.length - 2]
    .replace(/[.?!":\-,]/g, "")
    .toLowerCase();

  if (config.mode === "custom" && customTextIsRandom && wordset.length < 3) {
    randomWord = wordset[Math.floor(Math.random() * wordset.length)];
  } else if (config.mode == "custom" && !customTextIsRandom) {
    randomWord = customText[wordsList.length];
  } else {
    while (
      previousWordStripped == randomWord ||
      previousWord2Stripped == randomWord ||
      randomWord.indexOf(" ") > -1 ||
      (!config.punctuation && randomWord == "I")
    ) {
      randomWord = wordset[Math.floor(Math.random() * wordset.length)];
    }
  }

  if (activeFunBox === "rAnDoMcAsE") {
    let randomcaseword = "";
    for (let i = 0; i < randomWord.length; i++) {
      if (i % 2 != 0) {
        randomcaseword += randomWord[i].toUpperCase();
      } else {
        randomcaseword += randomWord[i];
      }
    }
    randomWord = randomcaseword;
  } else if (activeFunBox === "gibberish") {
    randomWord = Misc.getGibberish();
  } else if (activeFunBox === "58008") {
    randomWord = Misc.getNumbers(7);
  } else if (activeFunBox === "specials") {
    randomWord = Misc.getSpecials();
  } else if (activeFunBox === "ascii") {
    randomWord = Misc.getASCII();
  }

  if (config.punctuation && config.mode != "custom") {
    randomWord = punctuateWord(previousWord, randomWord, wordsList.length, 0);
  }
  if (config.numbers && config.mode != "custom") {
    if (Math.random() < 0.1) {
      randomWord = Misc.getNumbers(4);
    }
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

  let wordsHTML = "";
  for (let i = 0; i < wordsList.length; i++) {
    wordsHTML += "<div class='word'>";
    for (let c = 0; c < wordsList[i].length; c++) {
      wordsHTML += "<letter>" + wordsList[i].charAt(c) + "</letter>";
    }
    wordsHTML += "</div>";
  }
  $("#words").html(wordsHTML);

  $("#wordsWrapper").removeClass("hidden");
  const wordHeight = $(document.querySelector(".word")).outerHeight(true);
  const wordsHeight = $(document.querySelector("#words")).outerHeight(true);
  if (config.showAllLines && config.mode != "time") {
    $("#words").css("height", "auto");
    $("#wordsWrapper").css("height", "auto");
    let nh = wordHeight * 3;

    if (nh > wordsHeight) {
      nh = wordsHeight;
    }
    $(".outOfFocusWarning").css("line-height", nh + "px");
  } else {
    $("#words")
      .css("height", wordHeight * 4 + "px")
      .css("overflow", "hidden");
    $("#wordsWrapper")
      .css("height", wordHeight * 3 + "px")
      .css("overflow", "hidden");
    $(".outOfFocusWarning").css("line-height", wordHeight * 3 + "px");
  }

  if (config.keymapMode === "next") {
    updateHighlightedKeymapKey();
  }

  updateActiveElement();
  updateCaretPosition();
}

$("#restartTestButton, #startTestButton").on("click", function () {
  if (activeFunBox === "memory") {
    memoryFunboxInterval = clearInterval(memoryFunboxInterval);
    memoryFunboxTimer = Math.round(Math.pow(wordsList.length, 1.2));
    memoryFunboxInterval = setInterval(() => {
      memoryFunboxTimer -= 1;
      Misc.showNotification(memoryFunboxTimer);
      if (memoryFunboxTimer < 0) {
        memoryFunboxInterval = clearInterval(memoryFunboxInterval);
        memoryFunboxTimer = null;
        $("#wordsWrapper").addClass("hidden");
      }
    }, 1000);

    if (config.keymapMode === "next") {
      setKeymapMode("react");
    }
  }
});

(function (history) {
  var pushState = history.pushState;
  history.pushState = function (state) {
    if (activeFunBox === "memory" && state !== "/") {
      memoryFunboxInterval = clearInterval(memoryFunboxInterval);
      memoryFunboxTimer = null;
    }
    return pushState.apply(history, arguments);
  };
})(window.history);

function updateActiveElement() {
  let active = document.querySelector("#words .active");
  if (active !== null) {
    if (config.highlightMode == "word") {
      active.querySelectorAll("letter").forEach((e) => {
        e.classList.remove("correct");
      });
    }
    active.classList.remove("active");
  }
  try {
    let activeWord = document.querySelectorAll("#words .word")[
      currentWordElementIndex
    ];
    activeWord.classList.add("active");
    activeWord.classList.remove("error");
    activeWordTop = document.querySelector("#words .active").offsetTop;
    if (config.highlightMode == "word") {
      activeWord.querySelectorAll("letter").forEach((e) => {
        e.classList.add("correct");
      });
    }
  } catch (e) {}
  toggleScriptFunbox(wordsList[currentWordIndex]);
}

function updateWordElement(showError) {
  let input = currentInput;
  let wordAtIndex;
  let currentWord;
  wordAtIndex = document.querySelector("#words .word.active");
  currentWord = wordsList[currentWordIndex];
  let ret = "";

  if (config.highlightMode == "word") {
    //only for word highlight

    let correctSoFar = false;
    if (currentWord.slice(0, input.length) == input) {
      // this is when input so far is correct
      correctSoFar = true;
    }
    let classString = correctSoFar ? "correct" : "incorrect";
    if (config.blindMode) {
      classString = "correct";
    }

    //show letters in the current word
    for (let i = 0; i < currentWord.length; i++) {
      ret += `<letter class="${classString}">` + currentWord[i] + `</letter>`;
    }

    //show any extra letters if hide extra letters is disabled
    if (currentInput.length > currentWord.length && !config.hideExtraLetters) {
      for (let i = currentWord.length; i < currentInput.length; i++) {
        let letter = currentInput[i];
        if (letter == " ") {
          letter = "_";
        }
        ret += `<letter class="${classString}">${letter}</letter>`;
      }
    }
  } else {
    for (let i = 0; i < input.length; i++) {
      let charCorrect;
      if (currentWord[i] == input[i]) {
        charCorrect = true;
      } else {
        charCorrect = false;
      }

      try {
        if (config.language === "russian" && charCorrect === false) {
          if (
            (currentWord[i].toLowerCase() === "е" &&
              input[i].toLowerCase() === "ё") ||
            (currentWord[i].toLowerCase() === "ё" &&
              input[i].toLowerCase() === "е")
          ) {
            charCorrect = true;
          }
        }
      } catch (e) {}

      if (charCorrect) {
        ret += '<letter class="correct">' + currentWord[i] + "</letter>";
      } else {
        // if (config.difficulty == "master") {
        //   if (!resultVisible) {
        //     failTest();
        //   }
        // }
        if (!showError) {
          if (currentWord[i] == undefined) {
          } else {
            ret += '<letter class="correct">' + currentWord[i] + "</letter>";
          }
        } else {
          if (currentWord[i] == undefined) {
            if (!config.hideExtraLetters) {
              let letter = input[i];
              if (letter == " ") {
                letter = "_";
              }
              ret += `<letter class="incorrect extra">${letter}</letter>`;
            }
          } else {
            ret +=
              '<letter class="incorrect">' +
              currentWord[i] +
              (config.indicateTypos ? `<hint>${input[i]}</hint>` : "") +
              "</letter>";
          }
        }
      }
    }

    if (input.length < currentWord.length) {
      for (let i = input.length; i < currentWord.length; i++) {
        ret += "<letter>" + currentWord[i] + "</letter>";
      }
    }
  }
  wordAtIndex.innerHTML = ret;
}

function highlightBadWord(index, showError) {
  if (!showError) return;
  $($("#words .word")[index]).addClass("error");
}

function showTimer() {
  let op = config.showTimerProgress ? config.timerOpacity : 0;
  if (config.timerStyle === "bar") {
    $("#timerWrapper").stop(true, true).removeClass("hidden").animate(
      {
        opacity: op,
      },
      125
    );
  } else if (config.timerStyle === "text") {
    $("#timerNumber")
      .stop(true, true)
      .removeClass("hidden")
      .css("opacity", 0)
      .animate(
        {
          opacity: op,
        },
        125
      );
  } else if (config.timerStyle === "mini") {
    if (op > 0) {
      $("#miniTimerAndLiveWpm .time")
        .stop(true, true)
        .removeClass("hidden")
        .animate(
          {
            opacity: op,
          },
          125
        );
    }
  }
}

function hideTimer() {
  $("#timerWrapper").stop(true, true).animate(
    {
      opacity: 0,
    },
    125
  );
  $("#miniTimerAndLiveWpm .time")
    .stop(true, true)
    .animate(
      {
        opacity: 0,
      },
      125,
      () => {
        $("#miniTimerAndLiveWpm .time").addClass("hidden");
      }
    );
  $("#timerNumber").stop(true, true).animate(
    {
      opacity: 0,
    },
    125
  );
}

function restartTimer() {
  if (config.timerStyle === "bar") {
    if (config.mode === "time") {
      $("#timer").stop(true, true).animate(
        {
          width: "100vw",
        },
        0
      );
    } else if (config.mode === "words" || config.mode === "custom") {
      $("#timer").stop(true, true).animate(
        {
          width: "0vw",
        },
        0
      );
    }
  }
}

function updateTimer() {
  if (!config.showTimerProgress) return;
  if (config.mode === "time") {
    if (config.timerStyle === "bar") {
      let percent = 100 - ((time + 1) / config.time) * 100;
      $("#timer")
        .stop(true, true)
        .animate(
          {
            width: percent + "vw",
          },
          1000,
          "linear"
        );
    } else if (config.timerStyle === "text") {
      let displayTime = Misc.secondsToString(config.time - time);
      if (config.time === 0) {
        displayTime = Misc.secondsToString(time);
      }
      $("#timerNumber").html("<div>" + displayTime + "</div>");
    } else if (config.timerStyle === "mini") {
      let displayTime = Misc.secondsToString(config.time - time);
      if (config.time === 0) {
        displayTime = Misc.secondsToString(time);
      }
      $("#miniTimerAndLiveWpm .time").html(displayTime);
    }
  } else if (
    config.mode === "words" ||
    config.mode === "custom" ||
    config.mode === "quote"
  ) {
    if (config.timerStyle === "bar") {
      let outof = wordsList.length;
      if (config.mode === "words") {
        outof = config.words;
      }
      if (config.mode === "custom") {
        if (customTextIsRandom) {
          outof = customTextWordCount;
        } else {
          outof = customText.length;
        }
      }
      let percent = Math.floor(((currentWordIndex + 1) / outof) * 100);
      $("#timer")
        .stop(true, true)
        .animate(
          {
            width: percent + "vw",
          },
          250
        );
    } else if (config.timerStyle === "text") {
      let outof = wordsList.length;
      if (config.mode === "words") {
        outof = config.words;
      }
      if (config.mode === "custom") {
        if (customTextIsRandom) {
          outof = customTextWordCount;
        } else {
          outof = customText.length;
        }
      }
      if (config.words === 0) {
        $("#timerNumber").html("<div>" + `${inputHistory.length}` + "</div>");
      } else {
        $("#timerNumber").html(
          "<div>" + `${inputHistory.length}/${outof}` + "</div>"
        );
      }
    } else if (config.timerStyle === "mini") {
      let outof = wordsList.length;
      if (config.mode === "words") {
        outof = config.words;
      }
      if (config.mode === "custom") {
        if (customTextIsRandom) {
          outof = customTextWordCount;
        } else {
          outof = customText.length;
        }
      }
      if (config.words === 0) {
        $("#miniTimerAndLiveWpm .time").html(`${inputHistory.length}`);
      } else {
        $("#miniTimerAndLiveWpm .time").html(`${inputHistory.length}/${outof}`);
      }
    }
  }
}

function hideCaret() {
  $("#caret").addClass("hidden");
}

function showCaret() {
  if ($("#result").hasClass("hidden")) {
    updateCaretPosition();
    $("#caret").removeClass("hidden");
    startCaretAnimation();
  }
}

function stopCaretAnimation() {
  if (caretAnimating === true) {
    $("#caret").css("animation-name", "none");
    $("#caret").css("opacity", "1");
    caretAnimating = false;
  }
}

function startCaretAnimation() {
  if (caretAnimating === false) {
    if (config.smoothCaret) {
      $("#caret").css("animation-name", "caretFlashSmooth");
    } else {
      $("#caret").css("animation-name", "caretFlashHard");
    }
    caretAnimating = true;
  }
}

function hideKeymap() {
  $(".keymap").addClass("hidden");
  // $("#liveWpm").removeClass("lower");
}

function showKeymap() {
  $(".keymap").removeClass("hidden");
  // $("#liveWpm").addClass("lower");
}

function flashPressedKeymapKey(key, correct) {
  if (key == undefined) return;
  switch (key) {
    case "\\":
    case "|":
      key = "#KeyBackslash";
      break;
    case "}":
    case "]":
      key = "#KeyRightBracket";
      break;
    case "{":
    case "[":
      key = "#KeyLeftBracket";
      break;
    case '"':
    case "'":
      key = "#KeyQuote";
      break;
    case ":":
    case ";":
      key = "#KeySemicolon";
      break;
    case "<":
    case ",":
      key = "#KeyComma";
      break;
    case ">":
    case ".":
      key = "#KeyPeriod";
      break;
    case "?":
    case "/":
      key = "#KeySlash";
      break;
    case "" || "Space":
      key = "#KeySpace";
      break;
    default:
      key = `#Key${key.toUpperCase()}`;
  }

  if (key == "#KeySpace") {
    key = ".key-split-space";
  }

  try {
    if (correct || config.blindMode) {
      $(key)
        .stop(true, true)
        .css({
          color: themeColors.bg,
          backgroundColor: themeColors.main,
          borderColor: themeColors.main,
        })
        .animate(
          {
            color: themeColors.sub,
            backgroundColor: "transparent",
            borderColor: themeColors.sub,
          },
          500,
          "easeOutExpo"
        );
    } else {
      $(key)
        .stop(true, true)
        .css({
          color: themeColors.bg,
          backgroundColor: themeColors.error,
          borderColor: themeColors.error,
        })
        .animate(
          {
            color: themeColors.sub,
            backgroundColor: "transparent",
            borderColor: themeColors.sub,
          },
          500,
          "easeOutExpo"
        );
    }
  } catch (e) {}
}

function updateHighlightedKeymapKey() {
  try {
    if ($(".active-key") != undefined) {
      $(".active-key").removeClass("active-key");
    }

    var currentKey = wordsList[currentWordIndex]
      .substring(currentInput.length, currentInput.length + 1)
      .toString()
      .toUpperCase();

    let highlightKey;
    switch (currentKey) {
      case "\\":
      case "|":
        highlightKey = "#KeyBackslash";
        break;
      case "}":
      case "]":
        highlightKey = "#KeyRightBracket";
        break;
      case "{":
      case "[":
        highlightKey = "#KeyLeftBracket";
        break;
      case '"':
      case "'":
        highlightKey = "#KeyQuote";
        break;
      case ":":
      case ";":
        highlightKey = "#KeySemicolon";
        break;
      case "<":
      case ",":
        highlightKey = "#KeyComma";
        break;
      case ">":
      case ".":
        highlightKey = "#KeyPeriod";
        break;
      case "?":
      case "/":
        highlightKey = "#KeySlash";
        break;
      case "":
        highlightKey = "#KeySpace";
        break;
      default:
        highlightKey = `#Key${currentKey}`;
    }

    $(highlightKey).addClass("active-key");
    if (highlightKey === "#KeySpace") {
      $("#KeySpace2").addClass("active-key");
    }
  } catch (e) {
    console.log("could not update highlighted keymap key: " + e.message);
  }
}

function updateCaretPosition() {
  if ($("#wordsWrapper").hasClass("hidden")) return;
  if ($("#caret").hasClass("off")) {
    return;
  }

  let caret = $("#caret");

  let inputLen = currentInput.length;
  let currentLetterIndex = inputLen - 1;
  if (currentLetterIndex == -1) {
    currentLetterIndex = 0;
  }
  try {
    let currentWordNodeList = document
      .querySelector("#words .active")
      .querySelectorAll("letter");
    let currentLetter = currentWordNodeList[currentLetterIndex];
    if (inputLen > currentWordNodeList.length) {
      currentLetter = currentWordNodeList[currentWordNodeList.length - 1];
    }

    if ($(currentLetter).length == 0) return;
    const isLanguageLeftToRight = Misc.getCurrentLanguage().leftToRight;
    let currentLetterPosLeft = isLanguageLeftToRight
      ? currentLetter.offsetLeft
      : currentLetter.offsetLeft + $(currentLetter).width();
    let currentLetterPosTop = currentLetter.offsetTop;
    let letterHeight = $(currentLetter).height();
    let newTop = 0;
    let newLeft = 0;

    newTop = currentLetterPosTop - Math.round(letterHeight / 5);
    if (inputLen == 0) {
      newLeft = isLanguageLeftToRight
        ? currentLetterPosLeft - caret.width() / 2
        : currentLetterPosLeft + caret.width() / 2;
    } else {
      newLeft = isLanguageLeftToRight
        ? currentLetterPosLeft + $(currentLetter).width() - caret.width() / 2
        : currentLetterPosLeft - $(currentLetter).width() + caret.width() / 2;
    }

    let smoothlinescroll = $("#words .smoothScroller").height();
    if (smoothlinescroll === undefined) smoothlinescroll = 0;

    if (config.smoothCaret) {
      caret.stop(true, false).animate(
        {
          top: newTop - smoothlinescroll,
          left: newLeft,
        },
        100
      );
    } else {
      caret.stop(true, true).animate(
        {
          top: newTop - smoothlinescroll,
          left: newLeft,
        },
        0
      );
    }

    if (config.showAllLines) {
      let browserHeight = window.innerHeight;
      let middlePos = browserHeight / 2 - $("#caret").outerHeight() / 2;
      let contentHeight = document.body.scrollHeight;

      if (newTop >= middlePos && contentHeight > browserHeight) {
        window.scrollTo({
          left: 0,
          top: newTop - middlePos,
          behavior: "smooth",
        });
      }
    }
  } catch (e) {
    console.log("could not move caret: " + e.message);
  }
}

function countChars() {
  let correctWordChars = 0;
  let correctChars = 0;
  let incorrectChars = 0;
  let extraChars = 0;
  let missedChars = 0;
  let spaces = 0;
  let correctspaces = 0;
  for (let i = 0; i < inputHistory.length; i++) {
    if (inputHistory[i] === "") {
      //last word that was not started
      continue;
    }
    if (inputHistory[i] == wordsList[i]) {
      //the word is correct
      correctWordChars += wordsList[i].length;
      correctChars += wordsList[i].length;
      if (i < inputHistory.length - 1) {
        correctspaces++;
      }
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
      let toAdd = {
        correct: 0,
        incorrect: 0,
        missed: 0,
      };
      for (let c = 0; c < wordsList[i].length; c++) {
        if (c < inputHistory[i].length) {
          //on char that still has a word list pair
          if (inputHistory[i][c] == wordsList[i][c]) {
            toAdd.correct++;
          } else {
            toAdd.incorrect++;
          }
        } else {
          //on char that is extra
          toAdd.missed++;
        }
      }
      correctChars += toAdd.correct;
      incorrectChars += toAdd.incorrect;
      if (i === inputHistory.length - 1 && config.mode == "time") {
        //last word - check if it was all correct - add to correct word chars
        if (toAdd.incorrect === 0) correctWordChars += toAdd.correct;
      } else {
        missedChars += toAdd.missed;
      }
    }
    if (i < inputHistory.length - 1) {
      spaces++;
    }
  }
  if (activeFunBox === "nospace") {
    spaces = 0;
    correctspaces = 0;
  }
  return {
    spaces: spaces,
    correctWordChars: correctWordChars,
    allCorrectChars: correctChars,
    incorrectChars: incorrectChars,
    extraChars: extraChars,
    missedChars: missedChars,
    correctSpaces: correctspaces,
  };
}

function calculateStats() {
  let testSeconds = (testEnd - testStart) / 1000;
  let chars = countChars();
  let wpm = Misc.roundTo2(
    ((chars.correctWordChars + chars.correctSpaces) * (60 / testSeconds)) / 5
  );
  let wpmraw = Misc.roundTo2(
    ((chars.allCorrectChars +
      chars.spaces +
      chars.incorrectChars +
      chars.extraChars) *
      (60 / testSeconds)) /
      5
  );
  let acc = Misc.roundTo2(
    (accuracyStats.correct /
      (accuracyStats.correct + accuracyStats.incorrect)) *
      100
  );
  return {
    wpm: isNaN(wpm) ? 0 : wpm,
    wpmRaw: isNaN(wpmraw) ? 0 : wpmraw,
    acc: acc,
    correctChars: chars.correctWordChars,
    incorrectChars: chars.incorrectChars,
    missedChars: chars.missedChars,
    extraChars: chars.extraChars,
    allChars:
      chars.allCorrectChars +
      chars.spaces +
      chars.incorrectChars +
      chars.extraChars,
    time: testSeconds,
    spaces: chars.spaces,
    correctSpaces: chars.correctSpaces,
  };
}

function hideCrown() {
  $("#result .stats .wpm .crown").css("opacity", 0).addClass("hidden");
}

function showCrown() {
  $("#result .stats .wpm .crown")
    .removeClass("hidden")
    .css("opacity", "0")
    .animate(
      {
        opacity: 1,
      },
      250,
      "easeOutCubic"
    );
}

function failTest() {
  inputHistory.push(currentInput);
  correctedHistory.push(currentCorrected);
  lastSecondNotRound = true;
  showResult(true);
  let testNow = performance.now();
  let testSeconds = Misc.roundTo2((testNow - testStart) / 1000);
  let afkseconds = keypressPerSecond.filter((x) => x.count == 0 && x.mod == 0)
    .length;
  incompleteTestSeconds += testSeconds - afkseconds;
  restartCount++;
}

let resultCalculating = false;
function showResult(difficultyFailed = false) {
  resultCalculating = true;
  resultVisible = true;
  testEnd = performance.now();
  testActive = false;
  setFocus(false);
  hideCaret();
  hideLiveWpm();
  hideLiveAcc();
  hideTimer();
  hideKeymap();
  testInvalid = false;
  let stats = calculateStats();
  if (stats === undefined) {
    stats = {
      wpm: 0,
      wpmRaw: 0,
      acc: 0,
      correctChars: 0,
      incorrectChars: 0,
      missedChars: 0,
      extraChars: 0,
      time: 0,
      spaces: 0,
      correctSpaces: 0,
    };
  }
  let inf = false;
  if (stats.wpm >= 1000) {
    inf = true;
  }
  clearTimeout(timer);
  let testtime = stats.time;
  let afkseconds = keypressPerSecond.filter((x) => x.count == 0 && x.mod == 0)
    .length;
  let afkSecondsPercent = Misc.roundTo2((afkseconds / testtime) * 100);

  wpmOverTimeChart.options.annotation.annotations = [];

  $("#result #resultWordsHistory").addClass("hidden");

  if (config.alwaysShowDecimalPlaces) {
    if (config.alwaysShowCPM == false) {
      $("#result .stats .wpm .top .text").text("wpm");
      if (inf) {
        $("#result .stats .wpm .bottom").text("Infinite");
      } else {
        $("#result .stats .wpm .bottom").text(Misc.roundTo2(stats.wpm));
      }
      $("#result .stats .raw .bottom").text(Misc.roundTo2(stats.wpmRaw));
      $("#result .stats .wpm .bottom").attr(
        "aria-label",
        Misc.roundTo2(stats.wpm * 5) + " cpm"
      );
    } else {
      $("#result .stats .wpm .top .text").text("cpm");
      if (inf) {
        $("#result .stats .wpm .bottom").text("Infinite");
      } else {
        $("#result .stats .wpm .bottom").text(Misc.roundTo2(stats.wpm * 5));
      }
      $("#result .stats .raw .bottom").text(Misc.roundTo2(stats.wpmRaw * 5));
      $("#result .stats .wpm .bottom").attr(
        "aria-label",
        Misc.roundTo2(stats.wpm) + " wpm"
      );
    }

    $("#result .stats .acc .bottom").text(Misc.roundTo2(stats.acc) + "%");
    let time = Misc.roundTo2(testtime) + "s";
    if (testtime > 61) {
      time = Misc.secondsToString(Misc.roundTo2(testtime));
    }
    $("#result .stats .time .bottom .text").text(time);
    $("#result .stats .raw .bottom").removeAttr("aria-label");
    $("#result .stats .acc .bottom").removeAttr("aria-label");
    $("#result .stats .time .bottom").attr(
      "aria-label",
      `${afkseconds}s afk ${afkSecondsPercent}%`
    );
  } else {
    //not showing decimal places
    if (config.alwaysShowCPM == false) {
      $("#result .stats .wpm .top .text").text("wpm");
      $("#result .stats .wpm .bottom").attr(
        "aria-label",
        stats.wpm + ` (${Misc.roundTo2(stats.wpm * 5)} cpm)`
      );
      if (inf) {
        $("#result .stats .wpm .bottom").text("Infinite");
      } else {
        $("#result .stats .wpm .bottom").text(Math.round(stats.wpm));
      }
      $("#result .stats .raw .bottom").text(Math.round(stats.wpmRaw));
      $("#result .stats .raw .bottom").attr("aria-label", stats.wpmRaw);
    } else {
      $("#result .stats .wpm .top .text").text("cpm");
      $("#result .stats .wpm .bottom").attr(
        "aria-label",
        Misc.roundTo2(stats.wpm * 5) + ` (${Misc.roundTo2(stats.wpm)} wpm)`
      );
      if (inf) {
        $("#result .stats .wpm .bottom").text("Infinite");
      } else {
        $("#result .stats .wpm .bottom").text(Math.round(stats.wpm * 5));
      }
      $("#result .stats .raw .bottom").text(Math.round(stats.wpmRaw * 5));
      $("#result .stats .raw .bottom").attr("aria-label", stats.wpmRaw * 5);
    }

    $("#result .stats .acc .bottom").text(Math.floor(stats.acc) + "%");
    $("#result .stats .acc .bottom").attr("aria-label", stats.acc + "%");
    let time = Math.round(testtime) + "s";
    if (testtime > 61) {
      time = Misc.secondsToString(Math.round(testtime));
    }
    $("#result .stats .time .bottom .text").text(time);
    $("#result .stats .time .bottom").attr(
      "aria-label",
      `${Misc.roundTo2(testtime)}s (${afkseconds}s afk ${afkSecondsPercent}%)`
    );
  }
  $("#result .stats .time .bottom .afk").text("");
  if (afkSecondsPercent > 0) {
    $("#result .stats .time .bottom .afk").text(afkSecondsPercent + "% afk");
  }
  $("#result .stats .key .bottom").text(testtime + "s");
  $("#words").removeClass("blurred");
  $(".outOfFocusWarning").addClass("hidden");
  $("#result .stats .key .bottom").text(
    stats.correctChars +
      stats.correctSpaces +
      "/" +
      stats.incorrectChars +
      "/" +
      stats.extraChars +
      "/" +
      stats.missedChars
  );

  setTimeout(function () {
    $("#resultExtraButtons").removeClass("hidden").css("opacity", 0).animate(
      {
        opacity: 1,
      },
      125
    );
  }, 125);

  $("#testModesNotice").addClass("hidden");

  $("#result .stats .leaderboards .bottom").text("");
  $("#result .stats .leaderboards").addClass("hidden");

  let mode2 = "";
  if (config.mode === "time") {
    mode2 = config.time;
  } else if (config.mode === "words") {
    mode2 = config.words;
  } else if (config.mode === "custom") {
    mode2 = "custom";
  } else if (config.mode === "quote") {
    mode2 = randomQuote.id;
  }

  if (lastSecondNotRound) {
    let wpmAndRaw = liveWpmAndRaw();
    wpmHistory.push(wpmAndRaw.wpm);
    rawHistory.push(wpmAndRaw.raw);
    keypressPerSecond.push(currentKeypress);
    currentKeypress = {
      mod: 0,
      count: 0,
      words: [],
    };
    errorsPerSecond.push(currentError);
    currentError = {
      count: 0,
      words: [],
    };
  }

  let labels = [];
  for (let i = 1; i <= wpmHistory.length; i++) {
    if (lastSecondNotRound && i === wpmHistory.length) {
      labels.push(Misc.roundTo2(testtime).toString());
    } else {
      labels.push(i.toString());
    }
  }

  if (themeColors.main == "") {
    refreshThemeColorObject();
  }

  wpmOverTimeChart.options.scales.xAxes[0].ticks.minor.fontColor =
    themeColors.sub;
  wpmOverTimeChart.options.scales.xAxes[0].scaleLabel.fontColor =
    themeColors.sub;
  wpmOverTimeChart.options.scales.yAxes[0].ticks.minor.fontColor =
    themeColors.sub;
  wpmOverTimeChart.options.scales.yAxes[2].ticks.minor.fontColor =
    themeColors.sub;
  wpmOverTimeChart.options.scales.yAxes[0].scaleLabel.fontColor =
    themeColors.sub;
  wpmOverTimeChart.options.scales.yAxes[2].scaleLabel.fontColor =
    themeColors.sub;

  wpmOverTimeChart.data.labels = labels;

  let rawWpmPerSecondRaw = keypressPerSecond.map((f) =>
    Math.round((f.count / 5) * 60)
  );

  let rawWpmPerSecond = Misc.smooth(rawWpmPerSecondRaw, 1);

  let stddev = Misc.stdDev(rawWpmPerSecondRaw);
  let avg = Misc.mean(rawWpmPerSecondRaw);

  let consistency = Misc.roundTo2(Misc.kogasa(stddev / avg));
  let keyConsistency = Misc.roundTo2(
    Misc.kogasa(
      Misc.stdDev(keypressStats.spacing.array) /
        Misc.mean(keypressStats.spacing.array)
    )
  );

  if (isNaN(consistency)) {
    consistency = 0;
  }

  if (config.alwaysShowDecimalPlaces) {
    $("#result .stats .consistency .bottom").text(
      Misc.roundTo2(consistency) + "%"
    );
    $("#result .stats .consistency .bottom").attr(
      "aria-label",
      `${keyConsistency}% key`
    );
  } else {
    $("#result .stats .consistency .bottom").text(
      Math.round(consistency) + "%"
    );
    $("#result .stats .consistency .bottom").attr(
      "aria-label",
      `${consistency}% (${keyConsistency}% key)`
    );
  }

  wpmOverTimeChart.data.datasets[0].borderColor = themeColors.main;
  wpmOverTimeChart.data.datasets[0].pointBackgroundColor = themeColors.main;
  wpmOverTimeChart.data.datasets[0].data = wpmHistory;
  wpmOverTimeChart.data.datasets[1].borderColor = themeColors.sub;
  wpmOverTimeChart.data.datasets[1].pointBackgroundColor = themeColors.sub;
  wpmOverTimeChart.data.datasets[1].data = rawWpmPerSecond;

  let maxChartVal = Math.max(
    ...[Math.max(...rawWpmPerSecond), Math.max(...wpmHistory)]
  );

  let minChartVal = Math.min(
    ...[Math.min(...rawWpmPerSecond), Math.min(...wpmHistory)]
  );

  if (!config.startGraphsAtZero) {
    wpmOverTimeChart.options.scales.yAxes[0].ticks.min = Math.min(
      ...wpmHistory
    );
    wpmOverTimeChart.options.scales.yAxes[1].ticks.min = Math.min(
      ...wpmHistory
    );
  } else {
    wpmOverTimeChart.options.scales.yAxes[0].ticks.min = 0;
    wpmOverTimeChart.options.scales.yAxes[1].ticks.min = 0;
  }

  // let errorsNoZero = [];

  // for (let i = 0; i < errorsPerSecond.length; i++) {
  //   errorsNoZero.push({
  //     x: i + 1,
  //     y: errorsPerSecond[i].count,
  //   });
  // }

  let errorsArray = [];
  for (let i = 0; i < errorsPerSecond.length; i++) {
    errorsArray.push(errorsPerSecond[i].count);
  }

  wpmOverTimeChart.data.datasets[2].data = errorsArray;

  let kps = keypressPerSecond.slice(Math.max(keypressPerSecond.length - 5, 0));

  kps = kps.map((a) => a.count);

  kps = kps.reduce((a, b) => a + b, 0);

  let afkDetected = kps === 0 ? true : false;

  if (bailout) afkDetected = false;

  if (difficultyFailed) {
    Misc.showNotification("Test failed", 2000);
  } else if (afkDetected) {
    Misc.showNotification("Test invalid - AFK detected", 2000);
  } else if (sameWordset) {
    Misc.showNotification("Test invalid - repeated", 2000);
  } else {
    let activeTags = [];
    let activeTagsIds = [];
    try {
      db_getSnapshot().tags.forEach((tag) => {
        if (tag.active === true) {
          activeTags.push(tag);
          activeTagsIds.push(tag.id);
        }
      });
    } catch (e) {}

    let chartData = {
      wpm: wpmHistory,
      raw: rawWpmPerSecond,
      err: errorsArray,
    };

    if (testtime > 122) {
      chartData = "toolong";
      keypressStats.spacing.array = "toolong";
      keypressStats.duration.array = "toolong";
    }

    // REMOVE THIS WHEN MULTI LANGUAGE QUOTES ARE ADDED
    let lang = config.language;
    if (config.mode === "quote") {
      lang = "english";
    }

    let quoteLength = -1;
    if (config.mode === "quote") {
      quoteLength = randomQuote.group;
    }

    let completedEvent = {
      wpm: stats.wpm,
      rawWpm: stats.wpmRaw,
      correctChars: stats.correctChars + stats.correctSpaces,
      incorrectChars: stats.incorrectChars,
      allChars: stats.allChars,
      acc: stats.acc,
      mode: config.mode,
      mode2: mode2,
      quoteLength: quoteLength,
      punctuation: config.punctuation,
      numbers: config.numbers,
      timestamp: Date.now(),
      language: lang,
      restartCount: restartCount,
      incompleteTestSeconds: incompleteTestSeconds,
      difficulty: config.difficulty,
      testDuration: testtime,
      afkDuration: afkseconds,
      blindMode: config.blindMode,
      theme: config.theme,
      tags: activeTagsIds,
      keySpacing: keypressStats.spacing.array,
      keyDuration: keypressStats.duration.array,
      consistency: consistency,
      keyConsistency: keyConsistency,
      funbox: activeFunBox,
      bailedOut: bailout,
      chartData: chartData,
    };
    if (
      config.difficulty == "normal" ||
      ((config.difficulty == "master" || config.difficulty == "expert") &&
        !difficultyFailed)
    ) {
      restartCount = 0;
      incompleteTestSeconds = 0;
    }
    if (
      stats.wpm > 0 &&
      stats.wpm < 350 &&
      stats.acc > 50 &&
      stats.acc <= 100
    ) {
      if (firebase.auth().currentUser != null) {
        completedEvent.uid = firebase.auth().currentUser.uid;

        //check local pb
        accountIconLoading(true);
        let localPb = false;
        let dontShowCrown = false;
        let pbDiff = 0;
        db_getLocalPB(
          config.mode,
          mode2,
          config.punctuation,
          config.language,
          config.difficulty
        ).then((lpb) => {
          db_getUserHighestWpm(
            config.mode,
            mode2,
            config.punctuation,
            config.language,
            config.difficulty
          ).then((highestwpm) => {
            hideCrown();
            $("#result .stats .wpm .crown").attr("aria-label", "");
            if (lpb < stats.wpm && stats.wpm < highestwpm) {
              dontShowCrown = true;
            }
            if (lpb < stats.wpm) {
              //new pb based on local
              pbDiff = Math.abs(stats.wpm - lpb);
              if (!dontShowCrown) {
                hideCrown();
                showCrown();
                $("#result .stats .wpm .crown").attr(
                  "aria-label",
                  "+" + Misc.roundTo2(pbDiff)
                );
              }
              localPb = true;
            }
            if (lpb > 0) {
              wpmOverTimeChart.options.annotation.annotations.push({
                enabled: false,
                type: "line",
                mode: "horizontal",
                scaleID: "wpm",
                value: lpb,
                borderColor: themeColors.sub,
                borderWidth: 1,
                borderDash: [2, 2],
                label: {
                  backgroundColor: themeColors.sub,
                  fontFamily: "Roboto Mono",
                  fontSize: 11,
                  fontStyle: "normal",
                  fontColor: themeColors.bg,
                  xPadding: 6,
                  yPadding: 6,
                  cornerRadius: 3,
                  position: "center",
                  enabled: true,
                  content: `PB: ${lpb}`,
                },
              });
              if (maxChartVal >= lpb - 15 && maxChartVal <= lpb + 15) {
                maxChartVal = lpb + 15;
              }
              wpmOverTimeChart.options.scales.yAxes[0].ticks.max = Math.round(
                maxChartVal
              );
              wpmOverTimeChart.options.scales.yAxes[1].ticks.max = Math.round(
                maxChartVal
              );
              wpmOverTimeChart.update({ duration: 0 });
            }
            $("#result .stats .leaderboards").removeClass("hidden");
            $("#result .stats .leaderboards .bottom").html("checking...");

            if (activeTags.length == 0) {
              $("#result .stats .tags").addClass("hidden");
            } else {
              $("#result .stats .tags").removeClass("hidden");
            }
            $("#result .stats .tags .bottom").text("");
            activeTags.forEach(async (tag) => {
              let tpb = await db_getLocalTagPB(tag.id);
              $("#result .stats .tags .bottom").append(`
                <div tagid="${tag.id}" aria-label="PB: ${tpb}" data-balloon-pos="up">${tag.name}<i class="fas fa-crown hidden"></i></div>
              `);
              if (tpb < stats.wpm) {
                //new pb for that tag
                db_saveLocalTagPB(tag.id, stats.wpm);
                $(
                  `#result .stats .tags .bottom div[tagid="${tag.id}"] .fas`
                ).removeClass("hidden");
                $(`#result .stats .tags .bottom div[tagid="${tag.id}"]`).attr(
                  "aria-label",
                  "+" + Misc.roundTo2(stats.wpm - tpb)
                );
                console.log("new pb for tag " + tag.name);
              } else {
                wpmOverTimeChart.options.annotation.annotations.push({
                  enabled: false,
                  type: "line",
                  mode: "horizontal",
                  scaleID: "wpm",
                  value: tpb,
                  borderColor: themeColors.sub,
                  borderWidth: 1,
                  borderDash: [2, 2],
                  label: {
                    backgroundColor: themeColors.sub,
                    fontFamily: "Roboto Mono",
                    fontSize: 11,
                    fontStyle: "normal",
                    fontColor: themeColors.bg,
                    xPadding: 6,
                    yPadding: 6,
                    cornerRadius: 3,
                    position: "center",
                    enabled: true,
                    content: `${tag.name} PB: ${tpb}`,
                  },
                });
              }
            });

            CloudFunctions.testCompleted({
              uid: firebase.auth().currentUser.uid,
              obj: completedEvent,
            })
              .then((e) => {
                accountIconLoading(false);
                if (e.data == null) {
                  Misc.showNotification(
                    "Unexpected response from the server.",
                    4000
                  );
                  return;
                }
                if (e.data.resultCode === -1) {
                  Misc.showNotification("Could not save result", 3000);
                } else if (e.data.resultCode === -2) {
                  Misc.showNotification(
                    "Possible bot detected. Result not saved.",
                    4000
                  );
                } else if (e.data.resultCode === -3) {
                  Misc.showNotification(
                    "Could not verify keypress stats. Result not saved.",
                    4000
                  );
                } else if (e.data.resultCode === -4) {
                  Misc.showNotification(
                    "Result data does not make sense. Result not saved.",
                    4000
                  );
                } else if (e.data.resultCode === -999) {
                  console.error("internal error: " + e.data.message);
                  Misc.showNotification(
                    "Internal error. Result might not be saved. " +
                      e.data.message,
                    6000
                  );
                } else if (e.data.resultCode === 1 || e.data.resultCode === 2) {
                  completedEvent.id = e.data.createdId;
                  if (e.data.resultCode === 2) {
                    completedEvent.isPb = true;
                  }
                  if (
                    db_getSnapshot() !== null &&
                    db_getSnapshot().results !== undefined
                  ) {
                    db_getSnapshot().results.unshift(completedEvent);
                    if (db_getSnapshot().globalStats.time == undefined) {
                      db_getSnapshot().globalStats.time =
                        testtime +
                        completedEvent.incompleteTestSeconds -
                        afkseconds;
                    } else {
                      db_getSnapshot().globalStats.time +=
                        testtime +
                        completedEvent.incompleteTestSeconds -
                        afkseconds;
                    }
                    if (db_getSnapshot().globalStats.started == undefined) {
                      db_getSnapshot().globalStats.started = restartCount + 1;
                    } else {
                      db_getSnapshot().globalStats.started += restartCount + 1;
                    }
                    if (db_getSnapshot().globalStats.completed == undefined) {
                      db_getSnapshot().globalStats.completed = 1;
                    } else {
                      db_getSnapshot().globalStats.completed += 1;
                    }
                  }
                  try {
                    firebase
                      .analytics()
                      .logEvent("testCompleted", completedEvent);
                  } catch (e) {
                    console.log("Analytics unavailable");
                  }

                  if (
                    config.mode === "time" &&
                    (mode2 == "15" || mode2 == "60") &&
                    db_getSnapshot() !== null
                  ) {
                    const lbUpIcon = `<i class="fas fa-angle-up"></i>`;
                    const lbDownIcon = `<i class="fas fa-angle-down"></i>`;
                    const lbRightIcon = `<i class="fas fa-angle-right"></i>`;

                    //global
                    let globalLbString = "";
                    const glb = e.data.globalLeaderboard;
                    const glbMemory = db_getSnapshot().lbMemory[
                      config.mode + mode2
                    ].global;
                    let dontShowGlobalDiff =
                      glbMemory == null || glbMemory === -1 ? true : false;
                    let globalLbDiff = null;
                    if (glb === null) {
                      globalLbString = "global: not found";
                    } else if (glb.insertedAt === -1) {
                      dontShowGlobalDiff = true;
                      globalLbDiff = glbMemory - glb.insertedAt;
                      updateLbMemory(
                        config.mode,
                        mode2,
                        "global",
                        glb.insertedAt
                      );

                      globalLbString = "global: not qualified";
                    } else if (glb.insertedAt >= 0) {
                      if (glb.newBest) {
                        globalLbDiff = glbMemory - glb.insertedAt;
                        updateLbMemory(
                          config.mode,
                          mode2,
                          "global",
                          glb.insertedAt
                        );
                        let str = Misc.getPositionString(glb.insertedAt + 1);
                        globalLbString = `global: ${str}`;
                      } else {
                        globalLbDiff = glbMemory - glb.foundAt;
                        updateLbMemory(
                          config.mode,
                          mode2,
                          "global",
                          glb.foundAt
                        );
                        let str = Misc.getPositionString(glb.foundAt + 1);
                        globalLbString = `global: ${str}`;
                      }
                    }
                    if (!dontShowGlobalDiff) {
                      let sString =
                        globalLbDiff === 1 || globalLbDiff === -1 ? "" : "s";
                      if (globalLbDiff > 0) {
                        globalLbString += ` <span class="lbChange" aria-label="You've gained ${globalLbDiff} position${sString}" data-balloon-pos="up">(${lbUpIcon}${globalLbDiff})</span>`;
                      } else if (globalLbDiff === 0) {
                        globalLbString += ` <span class="lbChange" aria-label="Your position remained the same" data-balloon-pos="up">(${lbRightIcon}${globalLbDiff})</span>`;
                      } else if (globalLbDiff < 0) {
                        globalLbString += ` <span class="lbChange" aria-label="You've lost ${globalLbDiff} position${sString}" data-balloon-pos="up">(${lbDownIcon}${globalLbDiff})</span>`;
                      }
                    }

                    //daily
                    let dailyLbString = "";
                    const dlb = e.data.dailyLeaderboard;
                    const dlbMemory = db_getSnapshot().lbMemory[
                      config.mode + mode2
                    ].daily;
                    let dontShowDailyDiff =
                      dlbMemory == null || dlbMemory === -1 ? true : false;
                    let dailyLbDiff = null;
                    if (dlb === null) {
                      dailyLbString = "daily: not found";
                    } else if (dlb.insertedAt === -1) {
                      dontShowDailyDiff = true;
                      dailyLbDiff = dlbMemory - dlb.insertedAt;
                      updateLbMemory(
                        config.mode,
                        mode2,
                        "daily",
                        dlb.insertedAt
                      );
                      dailyLbString = "daily: not qualified";
                    } else if (dlb.insertedAt >= 0) {
                      if (dlb.newBest) {
                        dailyLbDiff = dlbMemory - dlb.insertedAt;
                        updateLbMemory(
                          config.mode,
                          mode2,
                          "daily",
                          dlb.insertedAt
                        );
                        let str = Misc.getPositionString(dlb.insertedAt + 1);
                        dailyLbString = `daily: ${str}`;
                      } else {
                        dailyLbDiff = dlbMemory - dlb.foundAt;
                        updateLbMemory(
                          config.mode,
                          mode2,
                          "daily",
                          dlb.foundAt
                        );
                        let str = Misc.getPositionString(dlb.foundAt + 1);
                        dailyLbString = `daily: ${str}`;
                      }
                    }
                    if (!dontShowDailyDiff) {
                      let sString =
                        dailyLbDiff === 1 || dailyLbDiff === -1 ? "" : "s";
                      if (dailyLbDiff > 0) {
                        dailyLbString += ` <span class="lbChange" aria-label="You've gained ${dailyLbDiff} position${sString}" data-balloon-pos="up">(${lbUpIcon}${dailyLbDiff})</span>`;
                      } else if (dailyLbDiff === 0) {
                        dailyLbString += ` <span class="lbChange" aria-label="Your position remained the same" data-balloon-pos="up">(${lbRightIcon}${dailyLbDiff})</span>`;
                      } else if (dailyLbDiff < 0) {
                        dailyLbString += ` <span class="lbChange" aria-label="You've lost ${dailyLbDiff} position${sString}" data-balloon-pos="up">(${lbDownIcon}${dailyLbDiff})</span>`;
                      }
                    }
                    $("#result .stats .leaderboards .bottom").html(
                      globalLbString + "<br>" + dailyLbString
                    );

                    // CloudFunctions.saveLbMemory({
                    //   uid: firebase.auth().currentUser.uid,
                    //   obj: db_getSnapshot().lbMemory,
                    // }).then((d) => {
                    //   if (d.data.returnCode === 1) {
                    //   } else {
                    //     Misc.showNotification(
                    //       `Error saving lb memory ${d.data.message}`,
                    //       4000
                    //     );
                    //   }
                    // });
                  }
                  if (
                    e.data.dailyLeaderboard === null &&
                    e.data.globalLeaderboard === null
                  ) {
                    $("#result .stats .leaderboards").addClass("hidden");
                  }
                  if (e.data.needsToVerifyEmail === true) {
                    $("#result .stats .leaderboards").removeClass("hidden");
                    $("#result .stats .leaderboards .bottom").html(
                      `please verify your email<br>to access leaderboards - <a onClick="sendVerificationEmail()">resend email</a>`
                    );
                  } else if (e.data.lbBanned) {
                    $("#result .stats .leaderboards").removeClass("hidden");
                    $("#result .stats .leaderboards .bottom").html("banned");
                  } else if (e.data.name === false) {
                    $("#result .stats .leaderboards").removeClass("hidden");
                    $("#result .stats .leaderboards .bottom").html(
                      "update your name to access leaderboards"
                    );
                  } else if (e.data.needsToVerify === true) {
                    $("#result .stats .leaderboards").removeClass("hidden");
                    $("#result .stats .leaderboards .bottom").html(
                      "verification needed to access leaderboards"
                    );
                  }

                  if (e.data.resultCode === 2) {
                    //new pb
                    showCrown();
                    if (!localPb) {
                    }
                    db_saveLocalPB(
                      config.mode,
                      mode2,
                      config.punctuation,
                      config.language,
                      config.difficulty,
                      stats.wpm,
                      stats.acc,
                      stats.wpmRaw,
                      consistency
                    );
                  } else if (e.data.resultCode === 1) {
                    hideCrown();
                    // if (localPb) {
                    //   Misc.showNotification(
                    //     "Local PB data is out of sync! Refresh the page to resync it or contact Miodec on Discord.",
                    //     15000
                    //   );
                    // }
                  }
                }
              })
              .catch((e) => {
                console.error(e);
                Misc.showNotification("Could not save result. " + e, 5000);
              });
          });
        });
      } else {
        try {
          firebase.analytics().logEvent("testCompletedNoLogin", completedEvent);
        } catch (e) {
          console.log("Analytics unavailable");
        }
        notSignedInLastResult = completedEvent;
      }
    } else {
      Misc.showNotification("Test invalid", 3000);
      testInvalid = true;
      try {
        firebase.analytics().logEvent("testCompletedInvalid", completedEvent);
      } catch (e) {
        console.log("Analytics unavailable");
      }
    }
  }

  if (firebase.auth().currentUser != null) {
    $("#result .loginTip").addClass("hidden");
  } else {
    $("#result .stats .leaderboards").addClass("hidden");
    $("#result .loginTip").removeClass("hidden");
  }

  let testType = "";

  if (config.mode === "quote") {
    let qlen = "";
    if (config.quoteLength === 0) {
      qlen = "short ";
    } else if (config.quoteLength === 1) {
      qlen = "medium ";
    } else if (config.quoteLength === 2) {
      qlen = "long ";
    } else if (config.quoteLength === 3) {
      qlen = "thicc ";
    }
    testType += qlen + config.mode;
  } else {
    testType += config.mode;
  }
  if (config.mode == "time") {
    testType += " " + config.time;
  } else if (config.mode == "words") {
    testType += " " + config.words;
  }
  if (
    config.mode != "custom" &&
    activeFunBox !== "gibberish" &&
    activeFunBox !== "58008"
  ) {
    testType += "<br>" + config.language.replace(/_/g, " ");
  }
  if (config.punctuation) {
    testType += "<br>punctuation";
  }
  if (config.numbers) {
    testType += "<br>numbers";
  }
  if (config.blindMode) {
    testType += "<br>blind";
  }
  if (activeFunBox !== "none") {
    testType += "<br>" + activeFunBox.replace(/_/g, " ");
  }
  if (config.difficulty == "expert") {
    testType += "<br>expert";
  } else if (config.difficulty == "master") {
    testType += "<br>master";
  }

  $("#result .stats .testType .bottom").html(testType);

  let otherText = "";
  if (config.layout !== "default") {
    otherText += "<br>" + config.layout;
  }
  if (difficultyFailed) {
    otherText += "<br>failed";
  }
  if (afkDetected) {
    otherText += "<br>afk detected";
  }
  if (testInvalid) {
    otherText += "<br>invalid";
  }
  if (sameWordset) {
    otherText += "<br>repeated";
  }
  if (bailout) {
    otherText += "<br>bailed out";
  }

  if (otherText == "") {
    $("#result .stats .info").addClass("hidden");
  } else {
    $("#result .stats .info").removeClass("hidden");
    otherText = otherText.substring(4);
    $("#result .stats .info .bottom").html(otherText);
  }

  if (
    $("#result .stats .tags").hasClass("hidden") &&
    $("#result .stats .info").hasClass("hidden")
  ) {
    $("#result .stats .infoAndTags").addClass("hidden");
  } else {
    $("#result .stats .infoAndTags").removeClass("hidden");
  }

  if (config.mode === "quote") {
    $("#result .stats .source").removeClass("hidden");
    $("#result .stats .source .bottom").html(randomQuote.source);
  } else {
    $("#result .stats .source").addClass("hidden");
  }

  wpmOverTimeChart.options.scales.yAxes[0].ticks.max = maxChartVal;
  wpmOverTimeChart.options.scales.yAxes[1].ticks.max = maxChartVal;

  wpmOverTimeChart.update({ duration: 0 });
  wpmOverTimeChart.resize();
  swapElements($("#typingTest"), $("#result"), 250, () => {
    resultCalculating = false;
    $("#words").empty();
    wpmOverTimeChart.resize();
    if (config.alwaysShowWordsHistory) {
      toggleResultWordsDisplay();
    }
  });
}

function startTest() {
  if (pageTransition) {
    return;
  }
  if (!dbConfigLoaded) {
    configChangedBeforeDb = true;
  }
  try {
    if (firebase.auth().currentUser != null) {
      firebase.analytics().logEvent("testStarted");
    } else {
      firebase.analytics().logEvent("testStartedNoLogin");
    }
  } catch (e) {
    console.log("Analytics unavailable");
  }
  testActive = true;
  testStart = performance.now();
  restartTimer();
  showTimer();
  $("#liveWpm").text("0");
  showLiveWpm();
  showLiveAcc();
  updateTimer();
  clearTimeout(timer);
  keypressStats = {
    spacing: {
      current: -1,
      array: [],
    },
    duration: {
      current: -1,
      array: [],
    },
  };

  if (activeFunBox === "memory") {
    memoryFunboxInterval = clearInterval(memoryFunboxInterval);
    memoryFunboxTimer = null;
    $("#wordsWrapper").addClass("hidden");
  }

  try {
    if (config.paceCaret !== "off")
      movePaceCaret(performance.now() + paceCaret.spc * 1000);
  } catch (e) {}
  //use a recursive self-adjusting timer to avoid time drift
  const stepIntervalMS = 1000;
  (function loop(expectedStepEnd) {
    const delay = expectedStepEnd - performance.now();
    timer = setTimeout(function () {
      time++;
      if (config.mode === "time") {
        updateTimer();
      }
      let wpmAndRaw = liveWpmAndRaw();
      updateLiveWpm(wpmAndRaw.wpm, wpmAndRaw.raw);
      wpmHistory.push(wpmAndRaw.wpm);
      rawHistory.push(wpmAndRaw.raw);

      let acc = Misc.roundTo2(
        (accuracyStats.correct /
          (accuracyStats.correct + accuracyStats.incorrect)) *
          100
      );

      updateLiveAcc(acc);

      if (activeFunBox === "layoutfluid" && config.mode === "time") {
        const layouts = ["qwerty", "dvorak", "colemak"];
        let index = 0;
        index = Math.floor(time / (config.time / 3));

        if (
          time == Math.floor(config.time / 3) - 3 ||
          time == (config.time / 3) * 2 - 3
        ) {
          Misc.showNotification("3", 1000);
        }
        if (
          time == Math.floor(config.time / 3) - 2 ||
          time == Math.floor(config.time / 3) * 2 - 2
        ) {
          Misc.showNotification("2", 1000);
        }
        if (
          time == Math.floor(config.time / 3) - 1 ||
          time == Math.floor(config.time / 3) * 2 - 1
        ) {
          Misc.showNotification("1", 1000);
        }

        if (config.layout !== layouts[index] && layouts[index] !== undefined) {
          Misc.showNotification(`--- !!! ${layouts[index]} !!! ---`, 3000);
        }
        setLayout(layouts[index]);
        setKeymapLayout(layouts[index]);
        updateHighlightedKeymapKey();
        settingsGroups.layout.updateButton();
      }

      keypressPerSecond.push(currentKeypress);
      currentKeypress = {
        mod: 0,
        count: 0,
        words: [],
      };
      errorsPerSecond.push(currentError);
      currentError = {
        count: 0,
        words: [],
      };
      if (
        (config.minWpm === "custom" &&
          wpmAndRaw.wpm < parseInt(config.minWpmCustomSpeed) &&
          currentWordIndex > 3) ||
        (config.minAcc === "custom" && acc < parseInt(config.minAccCustom))
      ) {
        clearTimeout(timer);
        failTest();
        return;
      }
      if (config.mode == "time") {
        if (time >= config.time && config.time !== 0) {
          //times up
          clearTimeout(timer);
          hideCaret();
          testActive = false;
          inputHistory.push(currentInput);
          correctedHistory.push(currentCorrected);
          showResult();
          return;
        }
      }
      loop(expectedStepEnd + stepIntervalMS);
    }, delay);
  })(testStart + stepIntervalMS);
}

function restartTest(withSameWordset = false, nosave = false) {
  if (!manualRestart) {
    if (
      (config.mode === "words" && config.words < 1000 && config.words > 0) ||
      (config.mode === "time" && config.time < 3600 && config.time > 0) ||
      config.mode === "quote" ||
      (config.mode === "custom" &&
        customTextIsRandom &&
        customTextWordCount < 1000) ||
      (config.mode === "custom" &&
        !customTextIsRandom &&
        customText.length < 1000)
    ) {
    } else {
      if (testActive) {
        Misc.showNotification(
          "Restart disabled for long tests. Use your mouse to confirm.",
          4000
        );
        return;
      }
    }
  }

  if (modeBeforePractise !== null && !withSameWordset) {
    Misc.showNotification("Reverting to previous settings.", 1500);
    setMode(modeBeforePractise);
    modeBeforePractise = null;
  }

  manualRestart = false;
  clearTimeout(timer);
  time = 0;
  wpmHistory = [];
  rawHistory = [];
  missedWords = {};
  correctedHistory = [];
  currentCorrected = "";
  setFocus(false);
  hideCaret();
  testActive = false;
  hideLiveWpm();
  hideLiveAcc();
  hideTimer();
  bailout = false;
  paceCaret = null;
  if (paceCaret !== null) clearTimeout(paceCaret.timeout);
  $("#showWordHistoryButton").removeClass("loaded");
  focusWords();
  keypressPerSecond = [];
  lastSecondNotRound = false;
  currentKeypress = {
    mod: 0,
    count: 0,
    words: [],
  };
  errorsPerSecond = [];
  currentError = {
    count: 0,
    words: [],
  };
  currentTestLine = 0;
  activeWordJumped = false;
  keypressStats = {
    spacing: {
      current: -1,
      array: [],
    },
    duration: {
      current: -1,
      array: [],
    },
  };
  $("#timerNumber").css("opacity", 0);
  let el = null;
  if (resultVisible) {
    //results are being displayed
    el = $("#result");
  } else {
    //words are being displayed
    el = $("#typingTest");
  }
  if (resultVisible) {
    if (
      config.randomTheme !== "off" &&
      !pageTransition &&
      !config.customTheme
    ) {
      randomiseTheme();
    }
  }
  resultVisible = false;

  el.stop(true, true).animate(
    {
      opacity: 0,
    },
    125,
    async () => {
      $("#typingTest").css("opacity", 0).removeClass("hidden");
      if (!withSameWordset) {
        sameWordset = false;
        await initWords();
        initPaceCaret(nosave);
      } else {
        sameWordset = true;
        testActive = false;
        currentWordIndex = 0;
        currentWordElementIndex = 0;
        accuracyStats = {
          correct: 0,
          incorrect: 0,
        };
        inputHistory = [];
        currentInput = "";
        initPaceCaret();
        showWords();
      }
      if (config.keymapMode !== "off") {
        showKeymap();
      } else {
        hideKeymap();
      }
      document.querySelector("#miniTimerAndLiveWpm .wpm").innerHTML = "0";
      document.querySelector("#miniTimerAndLiveWpm .acc").innerHTML = "100%";
      document.querySelector("#liveWpm").innerHTML = "0";
      document.querySelector("#liveAcc").innerHTML = "100%";

      if (activeFunBox === "layoutfluid") {
        setLayout("qwerty");
        settingsGroups.layout.updateButton();
        setKeymapLayout("qwerty");
        settingsGroups.keymapLayout.updateButton();
        updateHighlightedKeymapKey();
      }

      $("#result").addClass("hidden");
      $("#testModesNotice").removeClass("hidden").css({
        opacity: 1,
      });
      resetPaceCaret();
      $("#typingTest")
        .css("opacity", 0)
        .removeClass("hidden")
        .stop(true, true)
        .animate(
          {
            opacity: 1,
          },
          125,
          () => {
            resetPaceCaret();
            hideCrown();
            clearTimeout(timer);
            if ($("#commandLineWrapper").hasClass("hidden")) focusWords();
            wpmOverTimeChart.update();
            updateTestModesNotice();
          }
        );
    }
  );
}

function focusWords() {
  if (!$("#wordsWrapper").hasClass("hidden")) {
    $("#wordsInput").focus();
  }
}

function setCustomText() {
  customText = prompt("Custom text").trim();
  customText = customText.replace(/[\n\r\t ]/gm, " ");
  customText = customText.replace(/ +/gm, " ");
  customText = customText.split(" ");
  if (customText.length >= 10000) {
    Misc.showNotification(
      "Custom text cannot be longer than 10000 words.",
      4000
    );
    setMode("time");
    customText = "The quick brown fox jumped over the lazy dog".split(" ");
  }
}

function changePage(page) {
  if (pageTransition) {
    return;
  }
  let activePage = $(".page.active");
  $(".page").removeClass("active");
  $("#wordsInput").focusout();
  if (page == "test" || page == "") {
    pageTransition = true;
    swapElements(activePage, $(".page.pageTest"), 250, () => {
      pageTransition = false;
      focusWords();
      $(".page.pageTest").addClass("active");
      history.pushState("/", null, "/");
    });
    showTestConfig();
    hideSignOutButton();
    restartCount = 0;
    incompleteTestSeconds = 0;
    manualRestart = true;
    restartTest();
  } else if (page == "about") {
    pageTransition = true;
    restartTest();
    swapElements(activePage, $(".page.pageAbout"), 250, () => {
      pageTransition = false;
      history.pushState("about", null, "about");
      $(".page.pageAbout").addClass("active");
    });
    hideTestConfig();
    hideSignOutButton();
  } else if (page == "settings") {
    pageTransition = true;
    restartTest();
    swapElements(activePage, $(".page.pageSettings"), 250, () => {
      pageTransition = false;
      history.pushState("settings", null, "settings");
      $(".page.pageSettings").addClass("active");
    });
    updateSettingsPage();
    hideTestConfig();
    hideSignOutButton();
  } else if (page == "account") {
    if (!firebase.auth().currentUser) {
      changePage("login");
    } else {
      pageTransition = true;
      restartTest();
      swapElements(activePage, $(".page.pageAccount"), 250, () => {
        pageTransition = false;
        history.pushState("account", null, "account");
        $(".page.pageAccount").addClass("active");
      });
      refreshAccountPage();
      hideTestConfig();
      showSignOutButton();
    }
  } else if (page == "login") {
    if (firebase.auth().currentUser != null) {
      changePage("account");
    } else {
      pageTransition = true;
      restartTest();
      swapElements(activePage, $(".page.pageLogin"), 250, () => {
        pageTransition = false;
        history.pushState("login", null, "login");
        $(".page.pageLogin").addClass("active");
      });
      hideTestConfig();
      hideSignOutButton();
    }
  }
}

function setMode(mode, nosave) {
  if (mode !== "words" && activeFunBox === "memory") {
    Misc.showNotification("Memory funbox can only be used with words mode.");
    return;
  }

  config.mode = mode;
  $("#top .config .mode .text-button").removeClass("active");
  $("#top .config .mode .text-button[mode='" + mode + "']").addClass("active");
  if (config.mode == "time") {
    $("#top .config .wordCount").addClass("hidden");
    $("#top .config .time").removeClass("hidden");
    $("#top .config .customText").addClass("hidden");
    $("#top .config .punctuationMode").removeClass("hidden");
    $("#top .config .numbersMode").removeClass("hidden");
    $("#top .config .quoteLength").addClass("hidden");
  } else if (config.mode == "words") {
    $("#top .config .wordCount").removeClass("hidden");
    $("#top .config .time").addClass("hidden");
    $("#top .config .customText").addClass("hidden");
    $("#top .config .punctuationMode").removeClass("hidden");
    $("#top .config .numbersMode").removeClass("hidden");
    $("#top .config .quoteLength").addClass("hidden");
  } else if (config.mode == "custom") {
    if (
      activeFunBox === "58008" ||
      activeFunBox === "gibberish" ||
      activeFunBox === "ascii"
    ) {
      activeFunBox = "none";
      updateTestModesNotice();
    }
    $("#top .config .wordCount").addClass("hidden");
    $("#top .config .time").addClass("hidden");
    $("#top .config .customText").removeClass("hidden");
    $("#top .config .punctuationMode").addClass("hidden");
    $("#top .config .numbersMode").addClass("hidden");
    $("#top .config .quoteLength").addClass("hidden");
    setPunctuation(false, true);
    setNumbers(false, true);
  } else if (config.mode == "quote") {
    setToggleSettings(false, nosave);
    $("#top .config .wordCount").addClass("hidden");
    $("#top .config .time").addClass("hidden");
    $("#top .config .customText").addClass("hidden");
    $("#top .config .punctuationMode").addClass("hidden");
    $("#top .config .numbersMode").addClass("hidden");
    $("#result .stats .source").removeClass("hidden");
    $("#top .config .quoteLength").removeClass("hidden");
  }
  if (!nosave) saveConfigToCookie();
}

function liveWpmAndRaw() {
  let chars = 0;
  let correctWordChars = 0;
  let spaces = 0;
  for (let i = 0; i < inputHistory.length; i++) {
    if (inputHistory[i] == wordsList[i]) {
      //the word is correct
      //+1 for space
      correctWordChars += wordsList[i].length;
      if (i < inputHistory.length) {
        spaces++;
      }
    }
    chars += inputHistory[i].length;
  }
  if (wordsList[currentWordIndex] == currentInput) {
    correctWordChars += currentInput.length;
  }
  if (activeFunBox === "nospace") {
    spaces = 0;
  }
  chars += currentInput.length;
  let testNow = performance.now();
  let testSeconds = (testNow - testStart) / 1000;
  let wpm = Math.round(((correctWordChars + spaces) * (60 / testSeconds)) / 5);
  let raw = Math.round(((chars + spaces) * (60 / testSeconds)) / 5);
  return {
    wpm: wpm,
    raw: raw,
  };
}

function updateLiveWpm(wpm, raw) {
  if (!testActive || !config.showLiveWpm) {
    hideLiveWpm();
  } else {
    showLiveWpm();
  }
  let number = wpm;
  if (config.blindMode) {
    number = raw;
  }
  if (config.alwaysShowCPM) {
    number = Math.round(number * 5);
  }
  document.querySelector("#miniTimerAndLiveWpm .wpm").innerHTML = number;
  document.querySelector("#liveWpm").innerHTML = number;
}

function updateLiveAcc(acc) {
  if (!testActive || !config.showLiveAcc) {
    hideLiveAcc();
  } else {
    showLiveAcc();
  }
  let number = Math.floor(acc);
  if (config.blindMode) {
    number = 100;
  }
  document.querySelector("#miniTimerAndLiveWpm .acc").innerHTML = number + "%";
  document.querySelector("#liveAcc").innerHTML = number + "%";
}

function showLiveWpm() {
  if (!config.showLiveWpm) return;
  if (!testActive) return;
  if (config.timerStyle === "mini") {
    // $("#miniTimerAndLiveWpm .wpm").css("opacity", config.timerOpacity);
    if (!$("#miniTimerAndLiveWpm .wpm").hasClass("hidden")) return;
    $("#miniTimerAndLiveWpm .wpm")
      .removeClass("hidden")
      .css("opacity", 0)
      .animate(
        {
          opacity: config.timerOpacity,
        },
        125
      );
  } else {
    // $("#liveWpm").css("opacity", config.timerOpacity);
    if (!$("#liveWpm").hasClass("hidden")) return;
    $("#liveWpm").removeClass("hidden").css("opacity", 0).animate(
      {
        opacity: config.timerOpacity,
      },
      125
    );
  }
}

function hideLiveWpm() {
  // $("#liveWpm").css("opacity", 0);
  // $("#miniTimerAndLiveWpm .wpm").css("opacity", 0);
  $("#liveWpm").animate(
    {
      opacity: config.timerOpacity,
    },
    125,
    () => {
      $("#liveWpm").addClass("hidden");
    }
  );
  $("#miniTimerAndLiveWpm .wpm").animate(
    {
      opacity: config.timerOpacity,
    },
    125,
    () => {
      $("#miniTimerAndLiveWpm .wpm").addClass("hidden");
    }
  );
}

function showLiveAcc() {
  if (!config.showLiveAcc) return;
  if (!testActive) return;
  if (config.timerStyle === "mini") {
    // $("#miniTimerAndLiveWpm .wpm").css("opacity", config.timerOpacity);
    if (!$("#miniTimerAndLiveWpm .acc").hasClass("hidden")) return;
    $("#miniTimerAndLiveWpm .acc")
      .removeClass("hidden")
      .css("opacity", 0)
      .animate(
        {
          opacity: config.timerOpacity,
        },
        125
      );
  } else {
    // $("#liveWpm").css("opacity", config.timerOpacity);
    if (!$("#liveAcc").hasClass("hidden")) return;
    $("#liveAcc").removeClass("hidden").css("opacity", 0).animate(
      {
        opacity: config.timerOpacity,
      },
      125
    );
  }
}

function hideLiveAcc() {
  // $("#liveWpm").css("opacity", 0);
  // $("#miniTimerAndLiveWpm .wpm").css("opacity", 0);
  $("#liveAcc").animate(
    {
      opacity: config.timerOpacity,
    },
    125,
    () => {
      $("#liveAcc").addClass("hidden");
    }
  );
  $("#miniTimerAndLiveWpm .acc").animate(
    {
      opacity: config.timerOpacity,
    },
    125,
    () => {
      $("#miniTimerAndLiveWpm .acc").addClass("hidden");
    }
  );
}

function swapElements(
  el1,
  el2,
  totalDuration,
  callback = function () {
    return;
  }
) {
  if (
    (el1.hasClass("hidden") && !el2.hasClass("hidden")) ||
    (!el1.hasClass("hidden") && el2.hasClass("hidden"))
  ) {
    //one of them is hidden and the other is visible
    if (el1.hasClass("hidden")) {
      callback();
      return false;
    }
    $(el1)
      .removeClass("hidden")
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        totalDuration / 2,
        () => {
          $(el1).addClass("hidden");
          $(el2)
            .removeClass("hidden")
            .css("opacity", 0)
            .animate(
              {
                opacity: 1,
              },
              totalDuration / 2,
              () => {
                callback();
              }
            );
        }
      );
  } else if (el1.hasClass("hidden") && el2.hasClass("hidden")) {
    //both are hidden, only fade in the second
    $(el2)
      .removeClass("hidden")
      .css("opacity", 0)
      .animate(
        {
          opacity: 1,
        },
        totalDuration,
        () => {
          callback();
        }
      );
  } else {
    callback();
  }
}

function updateAccountLoginButton() {
  if (firebase.auth().currentUser != null) {
    swapElements(
      $("#menu .icon-button.login"),
      $("#menu .icon-button.account"),
      250
    );
  } else {
    swapElements(
      $("#menu .icon-button.account"),
      $("#menu .icon-button.login"),
      250
    );
  }
}

function accountIconLoading(truefalse) {
  if (truefalse) {
    $("#top #menu .account .icon").html(
      '<i class="fas fa-fw fa-spin fa-circle-notch"></i>'
    );
    $("#top #menu .account").css("opacity", 1);
  } else {
    $("#top #menu .account .icon").html('<i class="fas fa-fw fa-user"></i>');
    $("#top #menu .account").css("opacity", 1);
  }
}

function toggleResultWordsDisplay() {
  if (resultVisible) {
    if ($("#resultWordsHistory").stop(true, true).hasClass("hidden")) {
      //show

      if (!$("#showWordHistoryButton").hasClass("loaded")) {
        $("#words").html(
          `<div class="preloader"><i class="fas fa-fw fa-spin fa-circle-notch"></i></div>`
        );
        loadWordsHistory().then(() => {
          $("#resultWordsHistory")
            .removeClass("hidden")
            .css("display", "none")
            .slideDown(250);
        });
      } else {
        $("#resultWordsHistory")
          .removeClass("hidden")
          .css("display", "none")
          .slideDown(250);
      }
    } else {
      //hide

      $("#resultWordsHistory").slideUp(250, () => {
        $("#resultWordsHistory").addClass("hidden");
      });
    }
  }
}

async function loadWordsHistory() {
  $("#resultWordsHistory .words").empty();
  let wordsHTML = "";
  for (let i = 0; i < inputHistory.length + 2; i++) {
    let input = inputHistory[i];
    let wordEl = "";
    try {
      if (input === "") throw new Error("empty input word");
      if (correctedHistory[i] !== undefined && correctedHistory[i] !== "") {
        wordEl = `<div class='word' input="${correctedHistory[i]
          .replace(/"/g, "&quot;")
          .replace(/ /g, "_")}">`;
      } else {
        wordEl = `<div class='word' input="${input
          .replace(/"/g, "&quot;")
          .replace(/ /g, "_")}">`;
      }
      if (i === inputHistory.length - 1) {
        //last word
        let word = {
          correct: 0,
          incorrect: 0,
          missed: 0,
        };
        for (let c = 0; c < wordsList[i].length; c++) {
          if (c < inputHistory[i].length) {
            //on char that still has a word list pair
            if (inputHistory[i][c] == wordsList[i][c]) {
              word.correct++;
            } else {
              word.incorrect++;
            }
          } else {
            //on char that is extra
            word.missed++;
          }
        }
        if (word.incorrect !== 0 || config.mode !== "time") {
          if (input !== wordsList[i]) {
            wordEl = `<div class='word error' input="${input
              .replace(/"/g, "&quot;")
              .replace(/ /g, "_")}">`;
          }
        }
      } else {
        if (input !== wordsList[i]) {
          wordEl = `<div class='word error' input="${input
            .replace(/"/g, "&quot;")
            .replace(/ /g, "_")}">`;
        }
      }

      let loop;
      if (input.length > wordsList[i].length) {
        //input is longer - extra characters possible (loop over input)
        loop = input.length;
      } else {
        //input is shorter or equal (loop over word list)
        loop = wordsList[i].length;
      }

      for (let c = 0; c < loop; c++) {
        let correctedChar;
        try {
          correctedChar = correctedHistory[i][c];
        } catch (e) {
          correctedChar = undefined;
        }
        let extraCorrected = "";
        if (
          c + 1 === loop &&
          correctedHistory[i] !== undefined &&
          correctedHistory[i].length > input.length
        ) {
          extraCorrected = "extraCorrected";
        }
        if (wordsList[i][c] !== undefined) {
          if (input[c] === wordsList[i][c]) {
            if (correctedChar === input[c] || correctedChar === undefined) {
              wordEl += `<letter class="correct ${extraCorrected}">${wordsList[i][c]}</letter>`;
            } else {
              wordEl +=
                `<letter class="corrected ${extraCorrected}">` +
                wordsList[i][c] +
                "</letter>";
            }
          } else {
            if (input[c] === currentInput) {
              wordEl +=
                "<letter class='correct'>" + wordsList[i][c] + "</letter>";
            } else if (input[c] === undefined) {
              wordEl += "<letter>" + wordsList[i][c] + "</letter>";
            } else {
              wordEl +=
                `<letter class="incorrect ${extraCorrected}">` +
                wordsList[i][c] +
                "</letter>";
            }
          }
        } else {
          wordEl += '<letter class="incorrect extra">' + input[c] + "</letter>";
        }
      }
      wordEl += "</div>";
    } catch (e) {
      try {
        wordEl = "<div class='word'>";
        for (let c = 0; c < wordsList[i].length; c++) {
          wordEl += "<letter>" + wordsList[i][c] + "</letter>";
        }
        wordEl += "</div>";
      } catch {}
    }
    wordsHTML += wordEl;
  }
  $("#resultWordsHistory .words").html(wordsHTML);
  $("#showWordHistoryButton").addClass("loaded");
  return true;
}

function flipTestColors(tf) {
  if (tf) {
    $("#words").addClass("flipped");
  } else {
    $("#words").removeClass("flipped");
  }
}

function applyColorfulMode(tc) {
  if (tc) {
    $("#words").addClass("colorfulMode");
  } else {
    $("#words").removeClass("colorfulMode");
  }
}

function showEditTags(action, id, name) {
  if (action === "add") {
    $("#tagsWrapper #tagsEdit").attr("action", "add");
    $("#tagsWrapper #tagsEdit .title").html("Add new tag");
    $("#tagsWrapper #tagsEdit .button").html(`<i class="fas fa-plus"></i>`);
    $("#tagsWrapper #tagsEdit input").val("");
    $("#tagsWrapper #tagsEdit input").removeClass("hidden");
  } else if (action === "edit") {
    $("#tagsWrapper #tagsEdit").attr("action", "edit");
    $("#tagsWrapper #tagsEdit").attr("tagid", id);
    $("#tagsWrapper #tagsEdit .title").html("Edit tag name");
    $("#tagsWrapper #tagsEdit .button").html(`<i class="fas fa-pen"></i>`);
    $("#tagsWrapper #tagsEdit input").val(name);
    $("#tagsWrapper #tagsEdit input").removeClass("hidden");
  } else if (action === "remove") {
    $("#tagsWrapper #tagsEdit").attr("action", "remove");
    $("#tagsWrapper #tagsEdit").attr("tagid", id);
    $("#tagsWrapper #tagsEdit .title").html("Remove tag " + name);
    $("#tagsWrapper #tagsEdit .button").html(`<i class="fas fa-check"></i>`);
    $("#tagsWrapper #tagsEdit input").addClass("hidden");
  }

  if ($("#tagsWrapper").hasClass("hidden")) {
    $("#tagsWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100, () => {
        $("#tagsWrapper #tagsEdit input").focus();
      });
  }
}

function hideEditTags() {
  if (!$("#tagsWrapper").hasClass("hidden")) {
    $("#tagsWrapper #tagsEdit").attr("action", "");
    $("#tagsWrapper #tagsEdit").attr("tagid", "");
    $("#tagsWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          $("#tagsWrapper").addClass("hidden");
        }
      );
  }
}

function updateTestModesNotice() {
  let anim = false;
  if ($(".pageTest #testModesNotice").text() === "") anim = true;

  $(".pageTest #testModesNotice").empty();

  if (sameWordset) {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" onClick="restartTest()" style="color:var(--error-color);"><i class="fas fa-sync-alt"></i>repeated</div>`
    );
  }

  if (config.language === "english_1k" || config.language === "english_10k") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsLanguages"><i class="fas fa-globe-americas"></i>${config.language.replace(
        "_",
        " "
      )}</div>`
    );
  }

  if (config.difficulty === "expert") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsDifficulty"><i class="fas fa-star-half-alt"></i>expert</div>`
    );
  } else if (config.difficulty === "master") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsDifficulty"><i class="fas fa-star"></i>master</div>`
    );
  }

  if (config.blindMode) {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" onClick="toggleBlindMode()"><i class="fas fa-eye-slash"></i>blind</div>`
    );
  }

  if (config.paceCaret !== "off") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsPaceCaret"><i class="fas fa-tachometer-alt"></i>${
        config.paceCaret === "pb" ? "pb" : config.paceCaretCustomSpeed + " wpm"
      } pace</div>`
    );
  }

  if (config.minWpm !== "off") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsMinWpm"><i class="fas fa-bomb"></i>min ${config.minWpmCustomSpeed} wpm</div>`
    );
  }

  if (config.minAcc !== "off") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsMinAcc"><i class="fas fa-bomb"></i>min ${config.minAccCustom}% acc</div>`
    );
  }

  if (activeFunBox !== "none") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsFunbox"><i class="fas fa-gamepad"></i>${activeFunBox.replace(
        /_/g,
        " "
      )}</div>`
    );
  }

  if (config.confidenceMode === "on") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsConfidenceMode"><i class="fas fa-backspace"></i>confidence</div>`
    );
  }
  if (config.confidenceMode === "max") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsConfidenceMode"><i class="fas fa-backspace"></i>max confidence</div>`
    );
  }

  if (config.stopOnError != "off") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsStopOnError"><i class="fas fa-hand-paper"></i>stop on ${config.stopOnError}</div>`
    );
  }

  if (config.layout !== "default") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsLayouts"><i class="fas fa-keyboard"></i>${config.layout}</div>`
    );
  }

  let tagsString = "";
  try {
    db_getSnapshot().tags.forEach((tag) => {
      if (tag.active === true) {
        tagsString += tag.name + ", ";
      }
    });

    if (tagsString !== "") {
      $(".pageTest #testModesNotice").append(
        `<div class="text-button" commands="commandsTags"><i class="fas fa-tag"></i>${tagsString.substring(
          0,
          tagsString.length - 2
        )}</div>`
      );
    }
  } catch {}

  if (anim) {
    $(".pageTest #testModesNotice")
      .css("transition", "none")
      .css("opacity", 0)
      .animate(
        {
          opacity: 1,
        },
        125,
        () => {
          $(".pageTest #testModesNotice").css("transition", ".125s");
        }
      );
  }
}

$("#tagsWrapper").click((e) => {
  if ($(e.target).attr("id") === "tagsWrapper") {
    hideEditTags();
  }
});

$("#tagsWrapper #tagsEdit .button").click(() => {
  tagsEdit();
});

$("#tagsWrapper #tagsEdit input").keypress((e) => {
  if (e.keyCode == 13) {
    tagsEdit();
  }
});

function tagsEdit() {
  let action = $("#tagsWrapper #tagsEdit").attr("action");
  let inputVal = $("#tagsWrapper #tagsEdit input").val();
  let tagid = $("#tagsWrapper #tagsEdit").attr("tagid");
  hideEditTags();
  if (action === "add") {
    showBackgroundLoader();
    CloudFunctions.addTag({
      uid: firebase.auth().currentUser.uid,
      name: inputVal,
    }).then((e) => {
      hideBackgroundLoader();
      let status = e.data.resultCode;
      if (status === 1) {
        Misc.showNotification("Tag added", 2000);
        db_getSnapshot().tags.push({
          name: inputVal,
          id: e.data.id,
        });
        updateResultEditTagsPanelButtons();
        updateSettingsPage();
        updateFilterTags();
      } else if (status === -1) {
        Misc.showNotification("Invalid tag name", 3000);
      } else if (status < -1) {
        Misc.showNotification("Unknown error", 3000);
      }
    });
  } else if (action === "edit") {
    showBackgroundLoader();
    CloudFunctions.editTag({
      uid: firebase.auth().currentUser.uid,
      name: inputVal,
      tagid: tagid,
    }).then((e) => {
      hideBackgroundLoader();
      let status = e.data.resultCode;
      if (status === 1) {
        Misc.showNotification("Tag updated", 2000);
        db_getSnapshot().tags.forEach((tag) => {
          if (tag.id === tagid) {
            tag.name = inputVal;
          }
        });
        updateResultEditTagsPanelButtons();
        updateSettingsPage();
        updateFilterTags();
      } else if (status === -1) {
        Misc.showNotification("Invalid tag name", 3000);
      } else if (status < -1) {
        Misc.showNotification("Unknown error", 3000);
      }
    });
  } else if (action === "remove") {
    showBackgroundLoader();
    CloudFunctions.removeTag({
      uid: firebase.auth().currentUser.uid,
      tagid: tagid,
    }).then((e) => {
      hideBackgroundLoader();
      let status = e.data.resultCode;
      if (status === 1) {
        Misc.showNotification("Tag removed", 2000);
        db_getSnapshot().tags.forEach((tag, index) => {
          if (tag.id === tagid) {
            db_getSnapshot().tags.splice(index, 1);
          }
        });
        updateResultEditTagsPanelButtons();
        updateSettingsPage();
        updateFilterTags();
      } else if (status < -1) {
        Misc.showNotification("Unknown error", 3000);
      }
    });
  }
}

function showCapsWarning() {
  if ($("#capsWarning").hasClass("hidden")) {
    $("#capsWarning").removeClass("hidden");
  }
}

function hideCapsWarning() {
  if (!$("#capsWarning").hasClass("hidden")) {
    $("#capsWarning").addClass("hidden");
  }
}

function showCustomTextPopup() {
  if ($("#customTextPopupWrapper").hasClass("hidden")) {
    if ($("#customTextPopup .check input").prop("checked")) {
      $("#customTextPopup .inputs .wordcount").removeClass("hidden");
    } else {
      $("#customTextPopup .inputs .wordcount").addClass("hidden");
    }
    $("#customTextPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100, () => {
        $("#customTextPopup textarea").val(customText.join(" "));
        $("#customTextPopup .wordcount input").val(customTextWordCount);
        $("#customTextPopup textarea").focus();
      });
  }
}

function hideCustomTextPopup() {
  if (!$("#customTextPopupWrapper").hasClass("hidden")) {
    $("#customTextPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        (e) => {
          $("#customTextPopupWrapper").addClass("hidden");
        }
      );
  }
}

$("#customTextPopupWrapper").mousedown((e) => {
  if ($(e.target).attr("id") === "customTextPopupWrapper") {
    hideCustomTextPopup();
  }
});

$("#customTextPopup .inputs .check input").change(() => {
  if ($("#customTextPopup .check input").prop("checked")) {
    $("#customTextPopup .inputs .wordcount").removeClass("hidden");
  } else {
    $("#customTextPopup .inputs .wordcount").addClass("hidden");
  }
});

$("#customTextPopup textarea").keypress((e) => {
  if (e.code === "Enter" && e.ctrlKey) {
    $("#customTextPopup .button").click();
  }
});

$("#customTextPopup .button").click(() => {
  let text = $("#customTextPopup textarea").val();
  text = text.trim();
  text = text.replace(/[\n\r\t ]/gm, " ");
  text = text.replace(/ +/gm, " ");
  if ($("#customTextPopup .typographyCheck input").prop("checked")) {
    text = Misc.cleanTypographySymbols(text);
  }
  // text = Misc.remove_non_ascii(text);
  text = text.replace(/[\u2060]/g, "");
  text = text.split(" ");
  customText = text;
  customTextIsRandom = $("#customTextPopup .check input").prop("checked");
  customTextWordCount = $("#customTextPopup .wordcount input").val();
  manualRestart = true;
  restartTest();
  hideCustomTextPopup();
});

function showCustomMode2Popup(mode) {
  if ($("#customMode2PopupWrapper").hasClass("hidden")) {
    $("#customMode2PopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100, (e) => {
        if (mode == "time") {
          $("#customMode2Popup .text").text("Test length");
          $("#customMode2Popup").attr("mode", "time");
        } else if (mode == "words") {
          $("#customMode2Popup .text").text("Word amount");
          $("#customMode2Popup").attr("mode", "words");
        }
        $("#customMode2Popup input").focus().select();
      });
  }
}

function hideCustomMode2Popup() {
  if (!$("#customMode2PopupWrapper").hasClass("hidden")) {
    $("#customMode2PopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        (e) => {
          $("#customMode2PopupWrapper").addClass("hidden");
        }
      );
  }
}

function playClickSound() {
  if (config.playSoundOnClick === "off") return;
  if (clickSounds === null) initClickSounds();

  let rand = Math.floor(
    Math.random() * clickSounds[config.playSoundOnClick].length
  );
  let randomSound = clickSounds[config.playSoundOnClick][rand];
  randomSound.counter++;
  if (randomSound.counter === 2) randomSound.counter = 0;
  randomSound.sounds[randomSound.counter].currentTime = 0;
  randomSound.sounds[randomSound.counter].play();
}

function playErrorSound() {
  if (!config.playSoundOnError) return;
  errorSound.currentTime = 0;
  errorSound.play();
}

async function initPaceCaret() {
  let mode2 = "";
  if (config.mode === "time") {
    mode2 = config.time;
  } else if (config.mode === "words") {
    mode2 = config.words;
  } else if (config.mode === "custom") {
    mode2 = "custom";
  } else if (config.mode === "quote") {
    mode2 = randomQuote.id;
  }
  let wpm;
  if (config.paceCaret === "pb") {
    wpm = await db_getLocalPB(
      config.mode,
      mode2,
      config.punctuation,
      config.language,
      config.difficulty
    );
  } else if (config.paceCaret === "custom") {
    wpm = config.paceCaretCustomSpeed;
  }

  if (wpm < 1 || wpm == false || wpm == undefined || Number.isNaN(wpm)) {
    paceCaret = null;
    return;
  }

  let characters = wpm * 5;
  let cps = characters / 60; //characters per step
  let spc = 60 / characters; //seconds per character

  updateTestModesNotice();

  paceCaret = {
    cps: cps,
    spc: spc,
    correction: 0,
    currentWordIndex: 0,
    currentLetterIndex: -1,
    wordsStatus: {},
    timeout: null,
  };
}

function movePaceCaret(expectedStepEnd) {
  if (paceCaret === null || !testActive || resultVisible) {
    return;
  }
  if ($("#paceCaret").hasClass("hidden")) {
    $("#paceCaret").removeClass("hidden");
  }
  if ($("#paceCaret").hasClass("off")) {
    return;
  }
  try {
    paceCaret.currentLetterIndex++;
    if (
      paceCaret.currentLetterIndex >=
      wordsList[paceCaret.currentWordIndex].length
    ) {
      //go to the next word
      paceCaret.currentLetterIndex = -1;
      paceCaret.currentWordIndex++;
    }
    if (!config.blindMode) {
      if (paceCaret.correction < 0) {
        while (paceCaret.correction < 0) {
          paceCaret.currentLetterIndex--;
          if (paceCaret.currentLetterIndex <= -2) {
            //go to the previous word
            paceCaret.currentLetterIndex =
              wordsList[paceCaret.currentWordIndex - 1].length - 1;
            paceCaret.currentWordIndex--;
          }
          paceCaret.correction++;
        }
      } else if (paceCaret.correction > 0) {
        while (paceCaret.correction > 0) {
          paceCaret.currentLetterIndex++;
          if (
            paceCaret.currentLetterIndex >=
            wordsList[paceCaret.currentWordIndex].length
          ) {
            //go to the next word
            paceCaret.currentLetterIndex = -1;
            paceCaret.currentWordIndex++;
          }
          paceCaret.correction--;
        }
      }
    }
  } catch (e) {
    //out of words
    paceCaret = null;
    $("#paceCaret").addClass("hidden");
    return;
  }

  try {
    let caret = $("#paceCaret");
    let currentLetter;
    let newTop;
    let newLeft;
    try {
      if (paceCaret.currentLetterIndex === -1) {
        currentLetter = document
          .querySelectorAll("#words .word")
          [
            paceCaret.currentWordIndex -
              (currentWordIndex - currentWordElementIndex)
          ].querySelectorAll("letter")[0];
      } else {
        currentLetter = document
          .querySelectorAll("#words .word")
          [
            paceCaret.currentWordIndex -
              (currentWordIndex - currentWordElementIndex)
          ].querySelectorAll("letter")[paceCaret.currentLetterIndex];
      }
      newTop = currentLetter.offsetTop - $(currentLetter).height() / 20;
      newLeft;
      if (paceCaret.currentLetterIndex === -1) {
        newLeft = currentLetter.offsetLeft;
      } else {
        newLeft =
          currentLetter.offsetLeft +
          $(currentLetter).width() -
          caret.width() / 2;
      }
      caret.removeClass("hidden");
    } catch (e) {
      caret.addClass("hidden");
    }

    let smoothlinescroll = $("#words .smoothScroller").height();
    if (smoothlinescroll === undefined) smoothlinescroll = 0;

    $("#paceCaret").css({
      top: newTop - smoothlinescroll,
    });

    let duration = expectedStepEnd - performance.now();

    if (config.smoothCaret) {
      caret.stop(true, true).animate(
        {
          left: newLeft,
        },
        duration,
        "linear"
      );
    } else {
      caret.stop(true, true).animate(
        {
          left: newLeft,
        },
        0,
        "linear"
      );
    }
    paceCaret.timeout = setTimeout(() => {
      try {
        movePaceCaret(expectedStepEnd + paceCaret.spc * 1000);
      } catch (e) {
        paceCaret = null;
      }
    }, duration);
  } catch (e) {
    console.error(e);
    $("#paceCaret").addClass("hidden");
  }
}

function resetPaceCaret() {
  if (config.paceCaret === "off") return;
  if (!$("#paceCaret").hasClass("hidden")) {
    $("#paceCaret").addClass("hidden");
  }

  let caret = $("#paceCaret");
  let firstLetter = document
    .querySelector("#words .word")
    .querySelector("letter");

  caret.stop(true, true).animate(
    {
      top: firstLetter.offsetTop - $(firstLetter).height() / 4,
      left: firstLetter.offsetLeft,
    },
    0,
    "linear"
  );
}

$("#customMode2PopupWrapper").click((e) => {
  if ($(e.target).attr("id") === "customMode2PopupWrapper") {
    hideCustomMode2Popup();
  }
});

$("#customMode2Popup input").keypress((e) => {
  if (e.keyCode == 13) {
    applyMode2Popup();
  }
});

$("#customMode2Popup .button").click(() => {
  applyMode2Popup();
});

function updateKeytips() {
  if (config.swapEscAndTab) {
    $(".pageSettings .tip").html(`
    tip: You can also change all these settings quickly using the
    command line (
    <key>tab</key>
    )`);
    $("#bottom .keyTips").html(`
    <key>esc</key> - restart test<br>
      <key>tab</key> - command line`);
  } else {
    $(".pageSettings .tip").html(`
    tip: You can also change all these settings quickly using the
    command line (
    <key>esc</key>
    )`);
    $("#bottom .keyTips").html(`
    <key>tab</key> - restart test<br>
      <key>esc</key> - command line`);
  }
}

function applyMode2Popup() {
  let mode = $("#customMode2Popup").attr("mode");
  let val = parseInt($("#customMode2Popup input").val());

  if (mode == "time") {
    if (val !== null && !isNaN(val) && val >= 0) {
      setTimeConfig(val);
      manualRestart = true;
      restartTest();
      if (val >= 1800) {
        Misc.showNotification("Stay safe and take breaks!", 3000);
      } else if (val == 0) {
        Misc.showNotification(
          "Infinite time! Make sure to use Bail Out from the command line to save your result.",
          5000
        );
      }
    } else {
      Misc.showNotification("Custom time must be at least 1", 3000);
    }
  } else if (mode == "words") {
    if (val !== null && !isNaN(val) && val >= 0) {
      setWordCount(val);
      manualRestart = true;
      restartTest();
      if (val > 2000) {
        Misc.showNotification("Stay safe and take breaks!", 3000);
      } else if (val == 0) {
        Misc.showNotification(
          "Infinite words! Make sure to use Bail Out from the command line to save your result.",
          5000
        );
      }
    } else {
      Misc.showNotification("Custom word amount must be at least 1", 3000);
    }
  }

  hideCustomMode2Popup();
}

$(document).on("click", "#top .logo", (e) => {
  changePage("test");
});

$(document).on("click", "#top .config .wordCount .text-button", (e) => {
  const wrd = $(e.currentTarget).attr("wordCount");
  if (wrd == "custom") {
    showCustomMode2Popup("words");
  } else {
    setWordCount(wrd);
    manualRestart = true;
    restartTest();
  }
});

$(document).on("click", "#top .config .time .text-button", (e) => {
  let mode = $(e.currentTarget).attr("timeConfig");
  if (mode == "custom") {
    showCustomMode2Popup("time");
  } else {
    setTimeConfig(mode);
    manualRestart = true;

    restartTest();
  }
});

$(document).on("click", "#top .config .quoteLength .text-button", (e) => {
  let len = $(e.currentTarget).attr("quoteLength");
  setQuoteLength(len);
  manualRestart = true;
  restartTest();
});

$(document).on("click", "#top .config .customText .text-button", () => {
  showCustomTextPopup();
});

$(document).on("click", "#top .config .punctuationMode .text-button", () => {
  togglePunctuation();
  manualRestart = true;

  restartTest();
});

$(document).on("click", "#top .config .numbersMode .text-button", () => {
  toggleNumbers();
  manualRestart = true;

  restartTest();
});

$("#wordsWrapper").on("click", () => {
  focusWords();
});

$(document).on("click", "#top .config .mode .text-button", (e) => {
  if ($(e.currentTarget).hasClass("active")) return;
  const mode = $(e.currentTarget).attr("mode");
  setMode(mode);
  manualRestart = true;
  restartTest();
});

$(document).on("click", "#top #menu .icon-button", (e) => {
  if ($(e.currentTarget).hasClass("discord")) return;
  if ($(e.currentTarget).hasClass("leaderboards")) {
    showLeaderboards();
  } else {
    const href = $(e.currentTarget).attr("href");
    manualRestart = true;
    changePage(href.replace("/", ""));
  }
});

$(window).on("popstate", (e) => {
  let state = e.originalEvent.state;
  if (state == "" || state == "/") {
    // show test
    changePage("test");
  } else if (state == "about") {
    // show about
    changePage("about");
  } else if (state == "account" || state == "login") {
    if (firebase.auth().currentUser) {
      changePage("account");
    } else {
      changePage("login");
    }
  }
});

$(document).on("keypress", "#restartTestButton", (event) => {
  if (event.keyCode == 13) {
    if (
      (config.mode === "words" && config.words < 1000) ||
      (config.mode === "time" && config.time < 3600) ||
      config.mode === "quote" ||
      (config.mode === "custom" &&
        customTextIsRandom &&
        customTextWordCount < 1000) ||
      (config.mode === "custom" &&
        !customTextIsRandom &&
        customText.length < 1000)
    ) {
      if (testActive) {
        let testNow = performance.now();
        let testSeconds = Misc.roundTo2((testNow - testStart) / 1000);
        let afkseconds = keypressPerSecond.filter(
          (x) => x.count == 0 && x.mod == 0
        ).length;
        incompleteTestSeconds += testSeconds - afkseconds;
        restartCount++;
      }
      if (resultCalculating) return;
      restartTest();
    } else {
      Misc.showNotification("Quick restart disabled for long tests", 2000);
    }
  }
});

$(document.body).on("click", "#restartTestButton", () => {
  manualRestart = true;
  if (resultCalculating) return;
  restartTest();
});

function initPractiseMissedWords() {
  let currentMode = config.mode;
  setMode("custom");
  let newCustomText = [];
  Object.keys(missedWords).forEach((missedWord) => {
    for (let i = 0; i < missedWords[missedWord]; i++) {
      newCustomText.push(missedWord);
    }
  });
  customText = newCustomText;
  customTextIsRandom = true;
  customTextWordCount = 50;
  let mode = modeBeforePractise === null ? currentMode : modeBeforePractise;
  modeBeforePractise = null;
  restartTest();
  modeBeforePractise = mode;
}

$(document).on("keypress", "#practiseMissedWordsButton", (event) => {
  if (event.keyCode == 13) {
    if (Object.keys(missedWords).length > 0) {
      initPractiseMissedWords();
    } else {
      Misc.showNotification("You haven't missed any words.", 2000);
    }
  }
});

$(document.body).on("click", "#practiseMissedWordsButton", () => {
  if (Object.keys(missedWords).length > 0) {
    initPractiseMissedWords();
  } else {
    Misc.showNotification("You haven't missed any words.", 2000);
  }
});

$(document).on("keypress", "#nextTestButton", (event) => {
  if (event.keyCode == 13) {
    restartTest();
  }
});

$(document.body).on("click", "#nextTestButton", () => {
  manualRestart = true;
  restartTest();
});

$(document).on("keypress", "#showWordHistoryButton", (event) => {
  if (event.keyCode == 13) {
    toggleResultWordsDisplay();
  }
});

$(document.body).on("click", "#showWordHistoryButton", () => {
  toggleResultWordsDisplay();
});

$(document.body).on("click", "#restartTestButtonWithSameWordset", () => {
  manualRestart = true;

  restartTest(true);
});

$(document).on("keypress", "#restartTestButtonWithSameWordset", (event) => {
  if (event.keyCode == 13) {
    restartTest(true);
  }
});

$(document.body).on("click", "#copyResultToClipboardButton", () => {
  copyResultToClipboard();
});

$(document.body).on("click", ".version", () => {
  $("#versionHistoryWrapper")
    .css("opacity", 0)
    .removeClass("hidden")
    .animate({ opacity: 1 }, 125);
});

$(document.body).on("click", "#versionHistoryWrapper", () => {
  $("#versionHistoryWrapper")
    .css("opacity", 1)
    .animate({ opacity: 0 }, 125, () => {
      $("#versionHistoryWrapper").addClass("hidden");
    });
});

$(document.body).on("click", "#supportMeButton", () => {
  $("#supportMeWrapper")
    .css("opacity", 0)
    .removeClass("hidden")
    .animate({ opacity: 1 }, 125);
});

$(document.body).on("click", "#supportMeWrapper", () => {
  $("#supportMeWrapper")
    .css("opacity", 1)
    .animate({ opacity: 0 }, 125, () => {
      $("#supportMeWrapper").addClass("hidden");
    });
});

$(document.body).on("click", "#supportMeWrapper .button.ads", () => {
  currentCommands.push(commandsEnableAds);
  showCommandLine();
  $("#supportMeWrapper")
    .css("opacity", 1)
    .animate({ opacity: 0 }, 125, () => {
      $("#supportMeWrapper").addClass("hidden");
    });
});

$(document.body).on("click", "#supportMeWrapper a.button", () => {
  $("#supportMeWrapper")
    .css("opacity", 1)
    .animate({ opacity: 0 }, 125, () => {
      $("#supportMeWrapper").addClass("hidden");
    });
});

$(document.body).on("click", ".pageAbout .aboutEnableAds", () => {
  currentCommands.push(commandsEnableAds);
  showCommandLine();
});

$("#wordsInput").keypress((event) => {
  event.preventDefault();
});

let outOfFocusTimeouts = [];

function clearTimeouts(timeouts) {
  timeouts.forEach((to) => {
    clearTimeout(to);
    to = null;
  });
}

$("#wordsInput").on("focus", () => {
  if (!resultVisible && config.showOutOfFocusWarning) {
    $("#words").css("transition", "none").removeClass("blurred");
    $(".outOfFocusWarning").addClass("hidden");
    clearTimeouts(outOfFocusTimeouts);
  }
  showCaret();
});

$("#wordsInput").on("focusout", () => {
  if (!resultVisible && config.showOutOfFocusWarning) {
    outOfFocusTimeouts.push(
      setTimeout(() => {
        $("#words").css("transition", "0.25s").addClass("blurred");
        $(".outOfFocusWarning").removeClass("hidden");
      }, 1000)
    );
  }
  hideCaret();
});

$(window).resize(() => {
  updateCaretPosition();
});

$(document).mousemove(function (event) {
  if (
    $("#top").hasClass("focus") &&
    (event.originalEvent.movementX > 0 || event.originalEvent.movementY > 0)
  ) {
    setFocus(false);
  }
});

$(document).on("click", "#testModesNotice .text-button", (event) => {
  let commands = eval($(event.currentTarget).attr("commands"));
  if (commands !== undefined) {
    if ($(event.currentTarget).attr("commands") === "commandsTags") {
      updateCommandsTagsList();
    }
    currentCommands.push(commands);
    showCommandLine();
  }
});

$(document).on("click", "#commandLineMobileButton", () => {
  showCommandLine();
});

let dontInsertSpace = false;

$(document).keyup(() => {
  if (resultVisible) return;
  let now = performance.now();
  let diff = Math.abs(keypressStats.duration.current - now);
  if (keypressStats.duration.current !== -1) {
    keypressStats.duration.array.push(diff);
  }
  keypressStats.duration.current = now;
  Monkey.stop();
});

$(document).keydown(function (event) {
  if (!resultVisible) {
    let now = performance.now();
    let diff = Math.abs(keypressStats.spacing.current - now);
    if (keypressStats.spacing.current !== -1) {
      keypressStats.spacing.array.push(diff);
    }
    keypressStats.spacing.current = now;
  }

  Monkey.type();

  //tab
  if (
    (event.key == "Tab" && !config.swapEscAndTab) ||
    (event.key == "Escape" && config.swapEscAndTab)
  ) {
    handleTab(event);
  }

  //blocking firefox from going back in history with backspace
  if (event.key === "Backspace") {
    let t = /INPUT|SELECT|TEXTAREA/i;
    if (
      !t.test(event.target.tagName) ||
      event.target.disabled ||
      event.target.readOnly
    ) {
      event.preventDefault();
    }
  }

  keypressStats.duration.current = performance.now();
  try {
    if (
      !config.capsLockBackspace &&
      event.originalEvent.getModifierState("CapsLock")
    ) {
      showCapsWarning();
    } else {
      hideCapsWarning();
    }
  } catch {}

  //autofocus
  let pageTestActive = !$(".pageTest").hasClass("hidden");
  let commandLineVisible = !$("#commandLineWrapper").hasClass("hidden");
  let wordsFocused = $("#wordsInput").is(":focus");
  let modePopupVisible =
    !$("#customTextPopupWrapper").hasClass("hidden") ||
    !$("#customMode2PopupWrapper").hasClass("hidden");
  if (pageTestActive && !commandLineVisible && !modePopupVisible) {
    if (!wordsFocused && event.key !== "Enter") {
      focusWords();
      if (config.showOutOfFocusWarning) return;
    }
  } else {
    return;
  }

  //backspace
  const isBackspace =
    event.key === "Backspace" ||
    (config.capsLockBackspace && event.key === "CapsLock");
  if (isBackspace) {
    handleBackspace(event);
  }

  //space
  if (event.key === " " || (activeFunBox == "58008" && event.key === "Enter")) {
    handleSpace(event);
  }

  handleAlpha(event);
});

function handleTab(event) {
  if (resultCalculating) {
    event.preventDefault();
  }
  if (
    !event.ctrlKey &&
    config.quickTab &&
    !$(".pageLogin").hasClass("active") &&
    !resultCalculating &&
    $("#commandLineWrapper").hasClass("hidden") &&
    $("#simplePopupWrapper").hasClass("hidden") &&
    $("#leaderboardsWrapper").hasClass("hidden")
  ) {
    event.preventDefault();
    if ($(".pageTest").hasClass("active")) {
      if (
        (config.mode === "words" && config.words < 1000) ||
        (config.mode === "time" && config.time < 3600) ||
        config.mode === "quote" ||
        (config.mode === "custom" &&
          customTextIsRandom &&
          customTextWordCount < 1000) ||
        (config.mode === "custom" &&
          !customTextIsRandom &&
          customText.length < 1000)
      ) {
        if (testActive) {
          let testNow = performance.now();
          let testSeconds = Misc.roundTo2((testNow - testStart) / 1000);
          let afkseconds = keypressPerSecond.filter(
            (x) => x.count == 0 && x.mod == 0
          ).length;
          incompleteTestSeconds += testSeconds - afkseconds;
          restartCount++;
        }
        restartTest();
      } else {
        Misc.showNotification("Quick restart disabled for long tests", 2000);
      }
    } else {
      changePage("test");
    }
  }
}

function handleBackspace(event) {
  event.preventDefault();
  if (!testActive) return;
  if (
    currentInput == "" &&
    inputHistory.length > 0 &&
    currentWordElementIndex > 0
  ) {
    if (
      (inputHistory[currentWordIndex - 1] == wordsList[currentWordIndex - 1] &&
        !config.freedomMode) ||
      $($(".word")[currentWordIndex - 1]).hasClass("hidden")
    ) {
      return;
    } else {
      if (config.confidenceMode === "on" || config.confidenceMode === "max")
        return;
      if (event["ctrlKey"] || event["altKey"]) {
        currentInput = "";
        inputHistory.pop();
        correctedHistory.pop();
      } else {
        currentInput = inputHistory.pop();
        currentCorrected = correctedHistory.pop();
        if (activeFunBox === "nospace") {
          currentInput = currentInput.substring(0, currentInput.length - 1);
        }
      }
      currentWordIndex--;
      currentWordElementIndex--;
      updateActiveElement();
      updateWordElement(!config.blindMode);
    }
  } else {
    if (config.confidenceMode === "max") return;
    if (event["ctrlKey"] || event["altKey"]) {
      let split = currentInput.replace(/ +/g, " ").split(" ");
      if (split[split.length - 1] == "") {
        split.pop();
      }
      let addspace = false;
      if (split.length > 1) {
        addspace = true;
      }
      split.pop();
      currentInput = split.join(" ");

      if (addspace) {
        currentInput += " ";
      }
    } else if (event.metaKey) {
      currentInput = "";
    } else {
      currentInput = currentInput.substring(0, currentInput.length - 1);
    }
    updateWordElement(!config.blindMode);
  }
  playClickSound();
  if (config.keymapMode === "react") {
    flashPressedKeymapKey(event.code, true);
  } else if (config.keymapMode === "next") {
    updateHighlightedKeymapKey();
  }
  updateCaretPosition();
}

function handleSpace(event) {
  if (!testActive) return;
  if (currentInput === "") return;
  event.preventDefault();
  let currentWord = wordsList[currentWordIndex];
  if (activeFunBox === "layoutfluid" && config.mode !== "time") {
    const layouts = ["qwerty", "dvorak", "colemak"];
    let index = 0;
    let outof = wordsList.length;
    index = Math.floor((inputHistory.length + 1) / (outof / 3));
    if (config.layout !== layouts[index] && layouts[index] !== undefined) {
      Misc.showNotification(`--- !!! ${layouts[index]} !!! ---`, 3000);
    }
    setLayout(layouts[index]);
    setKeymapLayout(layouts[index]);
    updateHighlightedKeymapKey();
    settingsGroups.layout.updateButton();
  }
  if (config.blindMode) $("#words .word.active letter").addClass("correct");
  dontInsertSpace = true;
  if (currentWord == currentInput) {
    //correct word
    if (
      paceCaret !== null &&
      paceCaret.wordsStatus[currentWordIndex] === true &&
      !config.blindMode
    ) {
      paceCaret.wordsStatus[currentWordIndex] = undefined;
      paceCaret.correction -= currentWord.length + 1;
    }
    accuracyStats.correct++;
    inputHistory.push(currentInput);
    currentInput = "";
    currentWordIndex++;
    currentWordElementIndex++;
    updateActiveElement();
    updateCaretPosition();
    currentKeypress.count++;
    currentKeypress.words.push(currentWordIndex);
    if (activeFunBox !== "nospace") {
      playClickSound();
    }
  } else {
    //incorrect word
    if (
      paceCaret !== null &&
      paceCaret.wordsStatus[currentWordIndex] === undefined &&
      !config.blindMode
    ) {
      paceCaret.wordsStatus[currentWordIndex] = true;
      paceCaret.correction += currentWord.length + 1;
    }
    if (activeFunBox !== "nospace") {
      if (!config.playSoundOnError || config.blindMode) {
        playClickSound();
      } else {
        playErrorSound();
      }
    }
    accuracyStats.incorrect++;
    let cil = currentInput.length;
    if (cil < wordsList[currentWordIndex].length) {
      if (cil >= currentCorrected.length) {
        currentCorrected += "_";
      } else {
        currentCorrected =
          currentCorrected.substring(0, cil) +
          "_" +
          currentCorrected.substring(cil + 1);
      }
    }
    if (config.stopOnError != "off") {
      if (config.difficulty == "expert" || config.difficulty == "master") {
        //failed due to diff when pressing space
        failTest();
        return;
      }
      if (config.stopOnError == "word") {
        currentInput += " ";
        updateWordElement(true);
        updateCaretPosition();
      }
      return;
    }
    inputHistory.push(currentInput);
    highlightBadWord(currentWordElementIndex, !config.blindMode);
    currentInput = "";
    currentWordIndex++;
    currentWordElementIndex++;
    updateActiveElement();
    updateCaretPosition();
    currentKeypress.count++;
    currentKeypress.words.push(currentWordIndex);
    if (config.difficulty == "expert" || config.difficulty == "master") {
      failTest();
      return;
    } else if (currentWordIndex == wordsList.length) {
      //submitted last word that is incorrect
      lastSecondNotRound = true;
      showResult();
      return;
    }
  }

  correctedHistory.push(currentCorrected);
  currentCorrected = "";

  if (!config.showAllLines || config.mode == "time") {
    let currentTop = Math.floor(
      document.querySelectorAll("#words .word")[currentWordElementIndex - 1]
        .offsetTop
    );
    let nextTop;
    try {
      nextTop = Math.floor(
        document.querySelectorAll("#words .word")[currentWordElementIndex]
          .offsetTop
      );
    } catch (e) {
      nextTop = 0;
    }

    if ((nextTop > currentTop || activeWordJumped) && !lineTransition) {
      //last word of the line
      if (currentTestLine > 0) {
        let hideBound = currentTop;
        if (activeWordJumped) {
          hideBound = activeWordTopBeforeJump;
        }
        activeWordJumped = false;

        let toHide = [];
        let wordElements = $("#words .word");
        for (let i = 0; i < currentWordElementIndex; i++) {
          if ($(wordElements[i]).hasClass("hidden")) continue;
          let forWordTop = Math.floor(wordElements[i].offsetTop);
          if (forWordTop < hideBound - 10) {
            toHide.push($($("#words .word")[i]));
          }
        }
        const wordHeight = $(document.querySelector(".word")).outerHeight(true);
        if (config.smoothLineScroll && toHide.length > 0) {
          lineTransition = true;
          $("#words").prepend(
            `<div class="smoothScroller" style="position: fixed;height:${wordHeight}px;width:100%"></div>`
          );
          $("#words .smoothScroller").animate(
            {
              height: 0,
            },
            125,
            () => {
              $("#words .smoothScroller").remove();
            }
          );
          $("#paceCaret").animate(
            {
              top: document.querySelector("#paceCaret").offsetTop - wordHeight,
            },
            125
          );
          $("#words").animate(
            {
              marginTop: `-${wordHeight}px`,
            },
            125,
            () => {
              activeWordTop = document.querySelector("#words .active")
                .offsetTop;

              currentWordElementIndex -= toHide.length;
              lineTransition = false;
              toHide.forEach((el) => el.remove());
              $("#words").css("marginTop", "0");
            }
          );
        } else {
          toHide.forEach((el) => el.remove());
          currentWordElementIndex -= toHide.length;
          $("#paceCaret").css({
            top: document.querySelector("#paceCaret").offsetTop - wordHeight,
          });
        }
      }
      currentTestLine++;
    }
  } //end of line wrap

  updateCaretPosition();

  if (config.keymapMode === "react") {
    flashPressedKeymapKey(event.code, true);
  } else if (config.keymapMode === "next") {
    updateHighlightedKeymapKey();
  }
  if (
    config.mode === "words" ||
    config.mode === "custom" ||
    config.mode === "quote"
  ) {
    updateTimer();
  }
  if (
    config.mode == "time" ||
    config.mode == "words" ||
    config.mode == "custom"
  ) {
    addWord();
  }
}

function handleAlpha(event) {
  if (
    [
      "Tab",
      "ContextMenu",
      "Escape",
      "Shift",
      "Control",
      "Meta",
      "Alt",
      "AltGraph",
      "CapsLock",
      "Backspace",
      "Enter",
      "PageUp",
      "PageDown",
      "Home",
      "ArrowUp",
      "ArrowLeft",
      "ArrowRight",
      "ArrowDown",
      "OS",
      "Insert",
      "Home",
      "Undefined",
      "Control",
      "Fn",
      "FnLock",
      "Hyper",
      "NumLock",
      "ScrollLock",
      "Symbol",
      "SymbolLock",
      "Super",
      "Unidentified",
      undefined,
    ].includes(event.key)
  ) {
    currentKeypress.mod++;
    return;
  }

  //insert space for expert and master or strict space,
  //otherwise dont do anything
  if (event.key === " ") {
    if (config.difficulty !== "normal" || config.strictSpace) {
      if (dontInsertSpace) {
        dontInsertSpace = false;
        return;
      }
    } else {
      return;
    }
  }

  if (event.key.length > 1) return;
  if (/F\d+/.test(event.key)) return;
  if (/Numpad/.test(event.key)) return;
  if (/Volume/.test(event.key)) return;
  if (event.ctrlKey && !event.altKey) return;
  if (event.metaKey) return;
  event = emulateLayout(event);

  //start the test
  if (currentInput == "" && inputHistory.length == 0 && !testActive) {
    startTest();
  } else {
    if (!testActive) return;
  }

  setFocus(true);
  stopCaretAnimation();

  //show dead keys
  if (event.key === "Dead") {
    playClickSound();
    $(
      document.querySelector("#words .word.active").querySelectorAll("letter")[
        currentInput.length
      ]
    ).toggleClass("dead");
    return;
  }

  //check if the char typed was correct
  let thisCharCorrect;
  let nextCharInWord = wordsList[currentWordIndex].substring(
    currentInput.length,
    currentInput.length + 1
  );
  if (
    config.language === "russian" &&
    (event["key"].toLowerCase() == "e" || event["key"].toLowerCase() == "ё")
  ) {
    if (
      nextCharInWord.toLowerCase() == "e" ||
      nextCharInWord.toLowerCase() == "ё"
    ) {
      thisCharCorrect = true;
    } else {
      thisCharCorrect = false;
    }
  } else {
    if (nextCharInWord == event["key"]) {
      thisCharCorrect = true;
    } else {
      thisCharCorrect = false;
    }
  }

  if (!thisCharCorrect) {
    accuracyStats.incorrect++;
    currentError.count++;
    currentError.words.push(currentWordIndex);
    thisCharCorrect = false;
    if (!Object.keys(missedWords).includes(wordsList[currentWordIndex])) {
      missedWords[wordsList[currentWordIndex]] = 1;
    } else {
      missedWords[wordsList[currentWordIndex]]++;
    }
  } else {
    accuracyStats.correct++;
    thisCharCorrect = true;
  }

  if (thisCharCorrect) {
    playClickSound();
  } else {
    if (!config.playSoundOnError || config.blindMode) {
      playClickSound();
    } else {
      playErrorSound();
    }
  }

  //update current corrected verison. if its empty then add the current key. if its not then replace the last character with the currently pressed one / add it
  if (currentCorrected === "") {
    currentCorrected = currentInput + event["key"];
  } else {
    let cil = currentInput.length;
    if (cil >= currentCorrected.length) {
      currentCorrected += event["key"];
    } else if (!thisCharCorrect) {
      currentCorrected =
        currentCorrected.substring(0, cil) +
        event["key"] +
        currentCorrected.substring(cil + 1);
    }
  }

  currentKeypress.count++;
  currentKeypress.words.push(currentWordIndex);

  if (config.stopOnError == "letter" && !thisCharCorrect) {
    return;
  }

  //update the active word top, but only once
  if (currentInput.length === 1 && currentWordIndex === 0) {
    activeWordTop = document.querySelector("#words .active").offsetTop;
  }

  //max length of the input is 20
  if (currentInput.length < wordsList[currentWordIndex].length + 20) {
    currentInput += event["key"];
  }

  if (!thisCharCorrect && config.difficulty == "master") {
    failTest();
    return;
  }

  //keymap
  if (config.keymapMode === "react") {
    flashPressedKeymapKey(event.key, thisCharCorrect);
  } else if (config.keymapMode === "next") {
    updateHighlightedKeymapKey();
  }

  activeWordTopBeforeJump = activeWordTop;
  updateWordElement(!config.blindMode);

  //auto stop the test if the last word is correct
  let currentWord = wordsList[currentWordIndex];
  let lastindex = currentWordIndex;
  if (
    (currentWord == currentInput ||
      (config.quickEnd &&
        currentWord.length == currentInput.length &&
        config.stopOnError == "off")) &&
    lastindex == wordsList.length - 1
  ) {
    inputHistory.push(currentInput);
    currentInput = "";
    correctedHistory.push(currentCorrected);
    currentCorrected = "";
    lastSecondNotRound = true;
    showResult();
  }

  //simulate space press in nospace funbox
  if (
    activeFunBox === "nospace" &&
    currentInput.length === wordsList[currentWordIndex].length
  ) {
    $.event.trigger({
      type: "keydown",
      which: " ".charCodeAt(0),
      key: " ",
    });
  }

  //check if the word jumped
  let newActiveTop = document.querySelector("#words .word.active").offsetTop;
  if (activeWordTopBeforeJump < newActiveTop && !lineTransition) {
    activeWordJumped = true;
  } else {
    activeWordJumped = false;
  }

  //stop the word jump by slicing off the last character, update word again
  if (activeWordJumped && currentInput.length > 1) {
    currentInput = currentInput.slice(0, -1);
    updateWordElement(!config.blindMode);
    activeWordJumped = false;
  }

  updateCaretPosition();
}

window.addEventListener("beforeunload", (event) => {
  // Cancel the event as stated by the standard.
  if (
    (config.mode === "words" && config.words < 1000) ||
    (config.mode === "time" && config.time < 3600) ||
    config.mode === "quote" ||
    (config.mode === "custom" &&
      customTextIsRandom &&
      customTextWordCount < 1000) ||
    (config.mode === "custom" &&
      !customTextIsRandom &&
      customText.length < 1000)
  ) {
  } else {
    if (testActive) {
      event.preventDefault();
      // Chrome requires returnValue to be set.
      event.returnValue = "";
    }
  }
});

if (firebase.app().options.projectId === "monkey-type-dev-67af4") {
  $("#top .logo .bottom").text("monkey-dev");
  $("head title").text("Monkey Dev");
  $("body").append(
    `<div class="devIndicator tr">DEV</div><div class="devIndicator bl">DEV</div>`
  );
}

if (window.location.hostname === "localhost") {
  window.onerror = function (error) {
    Misc.showNotification(error, 3000);
  };
  $("#top .logo .top").text("localhost");
  $("head title").text($("head title").text() + " (localhost)");
  firebase.functions().useFunctionsEmulator("http://localhost:5001");
  $("body").append(
    `<div class="devIndicator tl">local</div><div class="devIndicator br">local</div>`
  );
}

manualRestart = true;
loadConfigFromCookie();
Misc.getReleasesFromGitHub();
// getPatreonNames();

$(document).on("mouseenter", "#resultWordsHistory .words .word", (e) => {
  if (resultVisible) {
    let input = $(e.currentTarget).attr("input");
    if (input != undefined)
      $(e.currentTarget).append(`<div class="wordInputAfter">${input}</div>`);
  }
});

$(document).on("click", "#bottom .leftright .right .current-theme", (e) => {
  if (e.shiftKey) {
    togglePresetCustomTheme();
  } else {
    // if (config.customTheme) {
    //   togglePresetCustomTheme();
    // }
    currentCommands.push(commandsThemes);
    showCommandLine();
  }
});

$(document).on("click", ".keymap .r5 #KeySpace", (e) => {
  currentCommands.push(commandsKeymapLayouts);
  showCommandLine();
});

$(document).on("mouseleave", "#resultWordsHistory .words .word", (e) => {
  $(".wordInputAfter").remove();
});

$("#wpmChart").on("mouseleave", (e) => {
  $(".wordInputAfter").remove();
});

$(document).ready(() => {
  updateFavicon(32, 14);
  $("body").css("transition", ".25s");
  if (config.quickTab) {
    $("#restartTestButton").addClass("hidden");
  }
  if (!Misc.getCookie("merchbannerclosed")) {
    $(".merchBanner").removeClass("hidden");
  } else {
    $(".merchBanner").remove();
  }
  $("#centerContent")
    .css("opacity", "0")
    .removeClass("hidden")
    .stop(true, true)
    .animate({ opacity: 1 }, 250, () => {
      if (window.location.pathname === "/verify") {
        const fragment = new URLSearchParams(window.location.hash.slice(1));
        if (fragment.has("access_token")) {
          const accessToken = fragment.get("access_token");
          const tokenType = fragment.get("token_type");
          verifyUserWhenLoggedIn = {
            accessToken: accessToken,
            tokenType: tokenType,
          };
          history.replaceState("/", null, "/");
        }
      } else if (window.location.pathname === "/account") {
        history.replaceState("/", null, "/");
      } else if (/challenge_.+/g.test(window.location.pathname)) {
        //do nothing
      } else if (window.location.pathname !== "/") {
        let page = window.location.pathname.replace("/", "");
        changePage(page);
      }
    });
});

$(".scrollToTopButton").click((event) => {
  window.scrollTo(0, 0);
});

$(".merchBanner a").click((event) => {
  $(".merchBanner").remove();
  Misc.setCookie("merchbannerclosed", true, 365);
});

$(".merchBanner .fas").click((event) => {
  $(".merchBanner").remove();
  Misc.setCookie("merchbannerclosed", true, 365);
  Misc.showNotification(
    "Won't remind you anymore :) Thanks for continued support <3",
    2500
  );
});

$(".pageTest #copyWordsListButton").click(async (event) => {
  try {
    await navigator.clipboard.writeText(
      wordsList.slice(0, inputHistory.length).join(" ")
    );
    Misc.showNotification("Copied to clipboard", 1000);
  } catch (e) {
    Misc.showNotification("Could not copy to clipboard: " + e, 5000);
  }
});

//stop space scrolling
window.addEventListener("keydown", function (e) {
  if (e.keyCode == 32 && e.target == document.body) {
    e.preventDefault();
  }
});

async function setupChallenge(challengeName) {
  let list = await Misc.getChallengeList();
  let challenge = list.filter((c) => c.name === challengeName)[0];
  let notitext;
  try {
    if (challenge === undefined) {
      throw "Challenge not found";
    }
    if (challenge.type === "customTime") {
      setTimeConfig(challenge.parameters[0], true);
      setMode("time", true);
      setDifficulty("normal", true);
      if (challenge.name === "englishMaster") {
        setLanguage("english_10k", true);
        setNumbers(true, true);
        setPunctuation(true, true);
      }
    }
    if (challenge.type === "customWords") {
      setWordCount(challenge.parameters[0], true);
      setMode("words", true);
      setDifficulty("normal", true);
    } else if (challenge.type === "customText") {
      customText = challenge.parameters[0].split(" ");
      customTextIsRandom = challenge.parameters[1];
      customTextWordCount = challenge.parameters[2];
      setMode("custom", true);
      setDifficulty("normal", true);
    } else if (challenge.type === "script") {
      let scriptdata = await fetch("/challenges/" + challenge.parameters[0]);
      scriptdata = await scriptdata.text();
      let text = scriptdata.trim();
      text = text.replace(/[\n\r\t ]/gm, " ");
      text = text.replace(/ +/gm, " ");
      customText = text.split(" ");
      customTextIsRandom = false;
      setMode("custom", true);
      setDifficulty("normal", true);
      if (challenge.parameters[1] != null) {
        setTheme(challenge.parameters[1]);
      }
      if (challenge.parameters[2] != null) {
        activateFunbox(challenge.parameters[2]);
      }
    } else if (challenge.type === "accuracy") {
      setTimeConfig(0, true);
      setMode("time", true);
      setDifficulty("master", true);
    } else if (challenge.type === "funbox") {
      activateFunbox(challenge.parameters[0]);
      setDifficulty("normal", true);
      if (challenge.parameters[1] === "words") {
        setWordCount(challenge.parameters[2], true);
      } else if (challenge.parameters[1] === "time") {
        setTimeConfig(challenge.parameters[2], true);
      }
      setMode(challenge.parameters[1], true);
      if (challenge.parameters[3] !== undefined) {
        setDifficulty(challenge.parameters[3], true);
      }
    }
    manualRestart = true;
    restartTest(false, true);
    notitext = challenge.message;
    if (notitext === undefined) {
      Misc.showNotification(`Challenge '${challengeName}' loaded.`, 3000);
    } else {
      Misc.showNotification("Challenge loaded. " + notitext, 5000);
    }
  } catch (e) {
    Misc.showNotification("Something went wrong: " + e, 5000);
    console.log(e);
  }
  // Misc.showNotification("Challenge loaded", 2000);
}

let ctx = $("#wpmChart");
let wpmOverTimeChart = new Chart(ctx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "wpm",
        data: [],
        borderColor: "rgba(125, 125, 125, 1)",
        borderWidth: 2,
        yAxisID: "wpm",
        order: 2,
        radius: 2,
      },
      {
        label: "raw",
        data: [],
        borderColor: "rgba(125, 125, 125, 1)",
        borderWidth: 2,
        yAxisID: "raw",
        order: 3,
        radius: 2,
      },
      {
        label: "errors",
        data: [],
        borderColor: "rgba(255, 125, 125, 1)",
        pointBackgroundColor: "rgba(255, 125, 125, 1)",
        borderWidth: 2,
        order: 1,
        yAxisID: "error",
        maxBarThickness: 10,
        type: "scatter",
        pointStyle: "crossRot",
        radius: function (context) {
          var index = context.dataIndex;
          var value = context.dataset.data[index];
          return value <= 0 ? 0 : 3;
        },
        pointHoverRadius: function (context) {
          var index = context.dataIndex;
          var value = context.dataset.data[index];
          return value <= 0 ? 0 : 5;
        },
      },
    ],
  },
  options: {
    tooltips: {
      titleFontFamily: "Roboto Mono",
      bodyFontFamily: "Roboto Mono",
      mode: "index",
      intersect: false,
      callbacks: {
        afterLabel: function (ti, data) {
          try {
            $(".wordInputAfter").remove();

            let wordsToHighlight =
              keypressPerSecond[parseInt(ti.xLabel) - 1].words;

            let unique = [...new Set(wordsToHighlight)];
            unique.forEach((wordIndex) => {
              let wordEl = $($("#resultWordsHistory .words .word")[wordIndex]);
              let input = wordEl.attr("input");
              if (input != undefined)
                wordEl.append(`<div class="wordInputAfter">${input}</div>`);
            });
          } catch (e) {}
        },
      },
    },
    legend: {
      display: false,
      labels: {
        defaultFontFamily: "Roboto Mono",
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      xAxes: [
        {
          ticks: {
            fontFamily: "Roboto Mono",
            autoSkip: true,
            autoSkipPadding: 40,
          },
          display: true,
          scaleLabel: {
            display: false,
            labelString: "Seconds",
            fontFamily: "Roboto Mono",
          },
        },
      ],
      yAxes: [
        {
          id: "wpm",
          display: true,
          scaleLabel: {
            display: true,
            labelString: "Words per Minute",
            fontFamily: "Roboto Mono",
          },
          ticks: {
            fontFamily: "Roboto Mono",
            beginAtZero: true,
            min: 0,
            autoSkip: true,
            autoSkipPadding: 40,
          },
          gridLines: {
            display: true,
          },
        },
        {
          id: "raw",
          display: false,
          scaleLabel: {
            display: true,
            labelString: "Raw Words per Minute",
            fontFamily: "Roboto Mono",
          },
          ticks: {
            fontFamily: "Roboto Mono",
            beginAtZero: true,
            min: 0,
            autoSkip: true,
            autoSkipPadding: 40,
          },
          gridLines: {
            display: false,
          },
        },
        {
          id: "error",
          display: true,
          position: "right",
          scaleLabel: {
            display: true,
            labelString: "Errors",
            fontFamily: "Roboto Mono",
          },
          ticks: {
            precision: 0,
            fontFamily: "Roboto Mono",
            beginAtZero: true,
            autoSkip: true,
            autoSkipPadding: 40,
          },
          gridLines: {
            display: false,
          },
        },
      ],
    },
    annotation: {
      annotations: [],
    },
  },
});
