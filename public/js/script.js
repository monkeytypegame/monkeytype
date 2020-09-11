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
let quotes = [];
let focusState = false;
let activeFunBox = "none";
let manualRestart = false;
let bailout = false;
let notSignedInLastResult = null;
let caretAnimating = true;

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

let clickSounds = {
  "1": [
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
  "2": [
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
  "3": [
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
  "4": [
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

let customText = "The quick brown fox jumps over the lazy dog".split(" ");
let customTextIsRandom = false;
let customTextWordCount = 1;
let randomQuote = null;

const testCompleted = firebase.functions().httpsCallable("testCompleted");
const addTag = firebase.functions().httpsCallable("addTag");
const editTag = firebase.functions().httpsCallable("editTag");
const removeTag = firebase.functions().httpsCallable("removeTag");
const updateResultTags = firebase.functions().httpsCallable("updateResultTags");
const saveConfig = firebase.functions().httpsCallable("saveConfig");
const generatePairingCode = firebase
  .functions()
  .httpsCallable("generatePairingCode");

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
}

function copyResultToClipboard() {
  if (navigator.userAgent.toLowerCase().indexOf("firefox") > -1) {
    showNotification("Sorry, this feature is not supported in Firefox", 4000);
  } else {
    $(".pageTest .ssWatermark").removeClass("hidden");
    $(".pageTest .buttons").addClass("hidden");
    let src = $("#middle");
    var sourceX = src.position().left; /*X position from div#target*/
    var sourceY = src.position().top; /*Y position from div#target*/
    var sourceWidth = src.width(); /*clientWidth/offsetWidth from div#target*/
    var sourceHeight = src.height(); /*clientHeight/offsetHeight from div#target*/
    $(".notification").addClass("hidden");
    try {
      html2canvas(document.body, {
        backgroundColor: themeColors.bg,
        height: sourceHeight + 50,
        width: sourceWidth + 50,
        x: sourceX - 25,
        y: sourceY - 25,
      }).then(function (canvas) {
        // document.body.appendChild(canvas);
        canvas.toBlob(function (blob) {
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
              showNotification("Copied to clipboard", 1000);
              $(".pageTest .ssWatermark").addClass("hidden");
              $(".pageTest .buttons").removeClass("hidden");
            })
            .catch((f) => {
              $(".notification").removeClass("hidden");
              showNotification("Error saving image to clipboard", 2000);
              $(".pageTest .ssWatermark").addClass("hidden");
              $(".pageTest .buttons").removeClass("hidden");
            });
        });
      });
    } catch (e) {
      $(".notification").removeClass("hidden");
      showNotification("Error creating image", 2000);
      $(".pageTest .ssWatermark").addClass("hidden");
      $(".pageTest .buttons").removeClass("hidden");
    }
  }
}

function activateFunbox(funbox, mode) {
  if (testActive || resultVisible) {
    showNotification(
      "You can only change the funbox before starting a test.",
      4000
    );
    return false;
  }
  $("#funBoxTheme").attr("href", ``);
  if (funbox === "none") {
    activeFunBox = "none";
  }
  if (mode === "style") {
    if (funbox != undefined) {
      $("#funBoxTheme").attr("href", `funbox/${funbox}.css`);
      activeFunBox = funbox;
    }

    if (funbox === "simon_says") {
      changeKeymapMode("next");
      settingsGroups.keymapMode.updateButton();
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
      changeKeymapMode("next");
      settingsGroups.keymapMode.updateButton();
      changeLayout("qwerty");
      settingsGroups.layout.updateButton();
      changeKeymapLayout("qwerty");
      settingsGroups.keymapLayout.updateButton();
      restartTest();
    }
    activeFunBox = funbox;
  }
  updateTestModesNotice();
  return true;
}

function toggleScriptFunbox(...params) {
  if (activeFunBox === "tts") {
    var msg = new SpeechSynthesisUtterance();
    // var voices = window.speechSynthesis.getVoices();
    // msg.voice = voices[0];
    // msg.volume = 1; // From 0 to 1
    // msg.rate = 1; // From 0.1 to 10
    msg.text = params[0];
    msg.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(msg);
  }
}

function verifyUsername() {
  //   test = firebase.functions().httpsCallable('moveResults')
  // test2 = firebase.functions().httpsCallable('getNames')
  // test3 = firebase.functions().httpsCallable('checkNameAvailability')
  const check = firebase.functions().httpsCallable("checkIfNeedsToChangeName");
  check({ uid: firebase.auth().currentUser.uid }).then((data) => {
    if (data.data === 1) {
      $(".nameChangeMessage").slideDown();
    } else if (data.data === 2) {
      $(".nameChangeMessage").slideDown();
    }
  });

  $(".nameChangeMessage").click((e) => {
    alert(`Im currently preparing the system to be ready for leaderboards and other awesome features - it looks like you need to change your display name.
        
        It either contains special characters, or your display name is the same as someone elses and your account was made later.
        
        Sorry for this inconvenience.
        `);
    let newName = prompt(
      "Please provide a new username - you can use lowercase and uppercase characters, numbers and one of these special characters ( . _ - ). The new name cannot be longer than 12 characters.",
      firebase.auth().currentUser.displayName
    );
    if (newName) {
      cn = firebase.functions().httpsCallable("changeName");
      cn({ uid: firebase.auth().currentUser.uid, name: newName }).then((d) => {
        if (d.data === 1) {
          //all good
          alert("Thanks! All good.");
          location.reload();
          $(".nameChangeMessage").slideUp();
        } else if (d.data === 0) {
          //invalid or unavailable
          alert("Name invalid or taken. Try again.");
        } else if (d.data === -1) {
          //error
          alert("Unknown error. Contact Miodec on Discord.");
        }
      });
    }
  });
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

function initWords() {
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

  let language = words[config.language];

  if (language === undefined && config.language === "english_10k") {
    showBackgroundLoader();
    $.ajax({
      url: "js/english_10k.json",
      async: false,
      success: function (data) {
        hideBackgroundLoader();
        words["english_10k"] = {
          leftToRight: true,
          words: data
        };
        language = words[config.language];
      },
    });
  }

  if (config.mode === "quote" && quotes.length == 0) {
    showBackgroundLoader();
    $.ajax({
      url: "js/english_quotes.json",
      async: false,
      success: function (data) {
        hideBackgroundLoader();
        quotes = data;
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
    // let wordsBound = config.mode == "time" ? 60 : config.words;
    let wordsBound = 60;
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
    if (activeFunBox === "plus_one") {
      wordsBound = 2;
    }
    let wordset = language.words;
    if (config.mode == "custom") {
      wordset = customText;
    }
    for (let i = 0; i < wordsBound; i++) {
      randomWord = wordset[Math.floor(Math.random() * wordset.length)];
      previousWord = wordsList[i - 1];
      previousWord2 = wordsList[i - 2];
      if (config.mode == "custom" && wordset.length < 3 && customTextIsRandom) {
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
        randomWord = getGibberish();
      } else if (activeFunBox === "58008") {
        setToggleSettings(false);
        randomWord = getNumbers(7);
      } else if (activeFunBox === "specials") {
        setToggleSettings(false);
        randomWord = getSpecials();
      } else if (activeFunBox === "ascii") {
        setToggleSettings(false);
        randomWord = getASCII();
      }

      if (config.punctuation && config.mode != "custom") {
        randomWord = punctuateWord(previousWord, randomWord, i, wordsBound);
      }
      if (config.numbers && config.mode != "custom") {
        if (Math.random() < 0.1) {
          randomWord = getNumbers(4);
        }
      }

      wordsList.push(randomWord);
    }
  } else if (config.mode == "quote") {
    randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    let w = randomQuote.text.trim().split(" ");
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
  showWords();
}

function arrangeCharactersRightToLeft() {
  $("#words").addClass("rightToLeftTest");
}

function arrangeCharactersLeftToRight() {
  $("#words").removeClass("rightToLeftTest");
}

function setToggleSettings(state) {
  setPunctuation(state);
  setNumbers(state);
}

function emulateLayout(event) {
  function emulatedLayoutShouldShiftKey(event, newKeyPreview) {
    if (config.capsLockBackspace) return event.shiftKey;
    const isCapsLockHeld = event.originalEvent.getModifierState("CapsLock");
    if (isCapsLockHeld) return isASCIILetter(newKeyPreview) !== event.shiftKey;
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
  if (event.key === " " || event.key === "Enter")
    return event;
  if (config.layout === "default") {
    //override the caps lock modifier for the default layout if needed
    if (config.capsLockBackspace && isASCIILetter(event.key)) {
      replaceEventKey(
        event,
        event.shiftKey
          ? event.key.toUpperCase().charCodeAt(0)
          : event.key.toLowerCase().charCodeAt(0)
      );
    }
    return event;
  }
  const qwertyMasterLayout = {
    Backquote: "`~",
    Digit1: "1!",
    Digit2: "2@",
    Digit3: "3#",
    Digit4: "4$",
    Digit5: "5%",
    Digit6: "6^",
    Digit7: "7&",
    Digit8: "8*",
    Digit9: "9(",
    Digit0: "0)",
    Minus: "-_",
    Equal: "=+",
    KeyQ: "qQ",
    KeyW: "wW",
    KeyE: "eE",
    KeyR: "rR",
    KeyT: "tT",
    KeyY: "yY",
    KeyU: "uU",
    KeyI: "iI",
    KeyO: "oO",
    KeyP: "pP",
    BracketLeft: "[{",
    BracketRight: "]}",
    KeyA: "aA",
    KeyS: "sS",
    KeyD: "dD",
    KeyF: "fF",
    KeyG: "gG",
    KeyH: "hH",
    KeyJ: "jJ",
    KeyK: "kK",
    KeyL: "lL",
    Semicolon: ";:",
    Quote: "'\"",
    Backslash: "\\|",
    KeyZ: "zZ",
    KeyX: "xX",
    KeyC: "cC",
    KeyV: "vV",
    KeyB: "bB",
    KeyN: "nN",
    KeyM: "mM",
    Comma: ",<",
    Period: ".>",
    Slash: "/?",
    Space: "  ",
  };
  const layoutMap = layouts[config.layout];
  const qwertyMap = layouts["qwerty"];

  const qwertyKey = qwertyMasterLayout[event.code];
  let mapIndex;
  for (let i = 0; i < qwertyMap.length; i++) {
    const key = qwertyMap[i];
    const keyIndex = key.indexOf(qwertyKey);
    if (keyIndex != -1) {
      mapIndex = i;
    }
  }
  const newKeyPreview = layoutMap[mapIndex][0];
  const shift = emulatedLayoutShouldShiftKey(event, newKeyPreview) ? 1 : 0;
  const newKey = layoutMap[mapIndex][shift];
  replaceEventKey(event, newKey.charCodeAt(0));
  return event;
}

function punctuateWord(previousWord, currentWord, index, maxindex) {
  let word = currentWord;

  if (
    index == 0 ||
    getLastChar(previousWord) == "." ||
    getLastChar(previousWord) == "?" ||
    getLastChar(previousWord) == "!"
  ) {
    //always capitalise the first word or if there was a dot
    word = capitalizeFirstLetter(word);
  } else if (
    //10% chance to end a sentence
    (Math.random() < 0.1 &&
      getLastChar(previousWord) != "." &&
      index != maxindex - 2) ||
    index == maxindex - 1
  ) {
    let rand = Math.random();
    if (rand <= 0.8) {
      word += ".";
    } else if (rand > 0.8 && rand < 0.9) {
      word += "?";
    } else {
      word += "!";
    }
  } else if (
    Math.random() < 0.01 &&
    getLastChar(previousWord) != "," &&
    getLastChar(previousWord) != "."
  ) {
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
  } else if (Math.random() < 0.2 && getLastChar(previousWord) != ",") {
    //2% chance to add a comma
    word += ",";
  }
  return word;
}

function addWord() {
  let bound = 60;
  if (activeFunBox === "plus_one") bound = 1;
  if (
    !config.showAllLines &&
    (wordsList.length - inputHistory.length > bound ||
      (config.mode === "words" && wordsList.length >= config.words) ||
      (config.mode === "custom" &&
        customTextIsRandom &&
        wordsList.length >= customTextWordCount) ||
      (config.mode === "custom" &&
        !customTextIsRandom &&
        wordsList.length >= customText.length))
  )
    return;
  const language = config.mode !== "custom"
    ? words[config.language]
    : {
      //borrow the direction of the current language
      leftToRight: words[config.language].leftToRight,
      words: customText
    };
  const wordset = language.words;
  let randomWord = wordset[Math.floor(Math.random() * wordset.length)];
  previousWord = wordsList[wordsList.length - 1];
  previousWordStripped = previousWord.replace(/[.?!":\-,]/g, "").toLowerCase();
  previousWord2Stripped = wordsList[wordsList.length - 2]
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
    randomWord = getGibberish();
  } else if (activeFunBox === "58008") {
    randomWord = getNumbers(7);
  } else if (activeFunBox === "specials") {
    randomWord = getSpecials();
  } else if (activeFunBox === "ascii") {
    randomWord = getASCII();
  }

  if (config.punctuation && config.mode != "custom") {
    randomWord = punctuateWord(previousWord, randomWord, wordsList.length, 0);
  }
  if (config.numbers && config.mode != "custom") {
    if (Math.random() < 0.1) {
      randomWord = getNumbers(4);
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

  for (let i = 0; i < wordsList.length; i++) {
    let w = "<div class='word'>";
    for (let c = 0; c < wordsList[i].length; c++) {
      w += "<letter>" + wordsList[i].charAt(c) + "</letter>";
    }
    w += "</div>";
    $("#words").append(w);
  }

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
    $(".outOfFocusWarning").css("line-height", nh+"px");
  } else {
    $("#words")
      .css("height", wordHeight * 4 + "px")
      .css("overflow", "hidden");
    $("#wordsWrapper")
      .css("height", wordHeight * 3 + "px")
      .css("overflow", "hidden");
    $(".outOfFocusWarning").css("line-height", wordHeight * 3 + "px");
  }

  var currentKey = wordsList[currentWordIndex]
    .substring(currentInput.length, currentInput.length + 1)
    .toString()
    .toUpperCase();

  if (config.keymapMode === "next") {
    updateHighlightedKeymapKey();
  }

  updateActiveElement();
  updateCaretPosition();
}

function updateActiveElement() {
  let active = document.querySelector("#words .active");
  if (active !== null) {
    active.classList.remove("active");
  }
  // $("#words .word").removeClass("active");
  // $($("#words .word")[currentWordIndex]).addClass("active").removeClass("error");

  // document.querySelectorAll("#words .word")[currentWordIndex].classList.add("active");
  try {
    let activeWord = document.querySelectorAll("#words .word")[
      currentWordElementIndex
    ];
    activeWord.classList.add("active");
    activeWord.classList.remove("error");

    // activeWordTop = $("#words .word.active").position().top;
    activeWordTop = document.querySelector("#words .active").offsetTop;
    // updateHighlightedKeymapKey();
  } catch (e) {}
  toggleScriptFunbox(wordsList[currentWordIndex]);
}

function compareInput(showError) {
  // let wrdAtIndex = $("#words .word")[wrdIndex];
  let input = currentInput;
  let wordAtIndex;
  let currentWord;
  wordAtIndex = document.querySelector("#words .word.active");
  currentWord = wordsList[currentWordIndex];
  // while (wordAtIndex.firstChild) {
  //   wordAtIndex.removeChild(wordAtIndex.firstChild);
  // }
  let ret = "";

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
      // $(letterElems[i]).removeClass('incorrect').addClass('correct');
    } else {
      if (config.difficulty == "master") {
        if (!resultVisible) {
          inputHistory.push(currentInput);
          correctedHistory.push(currentCorrected);
          document
            .querySelector("#words .word.active")
            .setAttribute("input", currentInput);
          showResult(true);
        }
        let testNow = Date.now();
        let testSeconds = roundTo2((testNow - testStart) / 1000);
        incompleteTestSeconds += testSeconds;
        restartCount++;
      }
      if (!showError) {
        if (currentWord[i] == undefined) {
          // ret += '<letter class="correct">' + input[i] + "</letter>";
        } else {
          ret += '<letter class="correct">' + currentWord[i] + "</letter>";
        }
      } else {
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

  wordAtIndex.innerHTML = ret;

  let lastindex = currentWordIndex;

  if (
    (currentWord == input ||
      (config.quickEnd && currentWord.length == input.length)) &&
    lastindex == wordsList.length - 1
  ) {
    inputHistory.push(input);
    currentInput = "";
    correctedHistory.push(currentCorrected);
    currentCorrected = "";
    //last character typed, show result
    if (!resultVisible) {
      if (keypressPerSecond.length === 0) {
        keypressPerSecond.push(currentKeypress);
      }
      showResult();
    }
  }
  // liveWPM()
}

function highlightBadWord(index, showError) {
  if (!showError) return;
  $($("#words .word")[index]).addClass("error");
}

function showTimer() {
  let op = config.showTimerProgress ? config.timerOpacity : 0;
  if (config.timerStyle === "bar") {
    // let op = 0.25;
    // if (
    //   $("#timerNumber").hasClass("timerSub") ||
    //   $("#timerNumber").hasClass("timerText") ||
    //   $("#timerNumber").hasClass("timerMain")
    // ) {
    //   op = 1;
    // }
    $("#timerWrapper").stop(true, true).removeClass("hidden").animate(
      {
        opacity: op,
      },
      250
    );
  } else if (config.timerStyle === "text") {
    // let op = 0.25;
    // if (
    //   $("#timerNumber").hasClass("timerSub") ||
    //   $("#timerNumber").hasClass("timerText") ||
    //   $("#timerNumber").hasClass("timerMain")
    // ) {
    //   op = 1;
    // }
    $("#timerNumber").stop(true, true).removeClass("hidden").animate(
      {
        opacity: op,
      },
      250
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
          250
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

function changeTimerColor(color) {
  $("#timer").removeClass("timerSub");
  $("#timer").removeClass("timerText");
  $("#timer").removeClass("timerMain");

  $("#timerNumber").removeClass("timerSub");
  $("#timerNumber").removeClass("timerText");
  $("#timerNumber").removeClass("timerMain");

  $("#liveWpm").removeClass("timerSub");
  $("#liveWpm").removeClass("timerText");
  $("#liveWpm").removeClass("timerMain");

  $("#miniTimerAndLiveWpm").removeClass("timerSub");
  $("#miniTimerAndLiveWpm").removeClass("timerText");
  $("#miniTimerAndLiveWpm").removeClass("timerMain");

  if (color === "main") {
    $("#timer").addClass("timerMain");
    $("#timerNumber").addClass("timerMain");
    $("#liveWpm").addClass("timerMain");
    $("#miniTimerAndLiveWpm").addClass("timerMain");
  } else if (color === "sub") {
    $("#timer").addClass("timerSub");
    $("#timerNumber").addClass("timerSub");
    $("#liveWpm").addClass("timerSub");
    $("#miniTimerAndLiveWpm").addClass("timerSub");
  } else if (color === "text") {
    $("#timer").addClass("timerText");
    $("#timerNumber").addClass("timerText");
    $("#liveWpm").addClass("timerText");
    $("#miniTimerAndLiveWpm").addClass("timerText");
  }
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
      // var displayTime = new Date(null);
      // displayTime.setSeconds(config.time - time);
      // displayTime = displayTime.toISOString().substr(11, 8);
      // while (
      //   displayTime.substr(0, 2) == "00" ||
      //   displayTime[0] == ":" ||
      //   (displayTime.length == 2 && displayTime[0] == "0")
      // ) {
      //   if (displayTime.substr(0, 2) == "00") {
      //     displayTime = displayTime.substr(3);
      //   } else {
      //     displayTime = displayTime.substr(1);
      //   }
      // }
      let displayTime = secondsToString(config.time - time);
      $("#timerNumber").html("<div>"+displayTime+"</div>");
      // $("#timerNumber").html(config.time - time);
    } else if (config.timerStyle === "mini") {
      let displayTime = secondsToString(config.time - time);
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
      $("#timerNumber").html("<div>"+`${inputHistory.length}/${outof}`+"</div>");
      // $("#timerNumber").html(config.time - time);
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
      $("#miniTimerAndLiveWpm .time").html(`${inputHistory.length}/${outof}`);
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
    $("#caret").css("animation-name", "caretFlash");
    caretAnimating = true;
  }
}

function hideKeymap() {
  $(".keymap").addClass("hidden");
  $("#liveWpm").removeClass("lower");
}

function showKeymap() {
  $(".keymap").removeClass("hidden");
  $("#liveWpm").addClass("lower");
}

function flashPressedKeymapKey(key, correct) {
  // return;
  // $(`#${key}`).css("animation", "none").removeClass("flash").addClass("flash");
  // setTimeout((f) => {
  //   $(`#${key}`).removeClass("flash");
  // }, 1000);

  //  from {
  //   color: var(--bg-color);
  //   background-color: var(--main-color);
  //   border-color: var(--main-color);
  // }

  // to {
  //   color: var(--sub-color);
  //   background-color: var(--bg-color);
  //   border-color: var(--sub-color);
  // }

  let errorColor;
  if (config.colorfulMode) {
    errorColor = themeColors.colorfulError;
  } else {
    errorColor = themeColors.error;
  }

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
    if (correct) {
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
            backgroundColor: themeColors.bg,
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
            backgroundColor: themeColors.bg,
            borderColor: themeColors.sub,
          },
          500,
          "easeOutExpo"
        );
    }
  } catch (e) {}
}

function updateHighlightedKeymapKey() {
  // return;
  if ($(".active-key") != undefined) {
    $(".active-key").removeClass("active-key");
  }

  var currentKey = wordsList[currentWordIndex]
    .substring(currentInput.length, currentInput.length + 1)
    .toString()
    .toUpperCase();

  switch (currentKey) {
    case "\\":
    case "|":
      var highlightKey = "#KeyBackslash";
      break;
    case "}":
    case "]":
      var highlightKey = "#KeyRightBracket";
      break;
    case "{":
    case "[":
      var highlightKey = "#KeyLeftBracket";
      break;
    case '"':
    case "'":
      var highlightKey = "#KeyQuote";
      break;
    case ":":
    case ";":
      var highlightKey = "#KeySemicolon";
      break;
    case "<":
    case ",":
      var highlightKey = "#KeyComma";
      break;
    case ">":
    case ".":
      var highlightKey = "#KeyPeriod";
      break;
    case "?":
    case "/":
      var highlightKey = "#KeySlash";
      break;
    case "":
      var highlightKey = "#KeySpace";
      break;
    default:
      var highlightKey = `#Key${currentKey}`;
  }

  $(highlightKey).addClass("active-key");
  if (highlightKey === "#KeySpace") {
    $("#KeySpace2").addClass("active-key");
  }
}

function updateCaretPosition() {
  // return;
  if ($("#wordsWrapper").hasClass("hidden")) return;

  let caret = $("#caret");
  // let activeWord = $("#words .word.active");

  let inputLen = currentInput.length;
  let currentLetterIndex = inputLen - 1;
  if (currentLetterIndex == -1) {
    currentLetterIndex = 0;
  }
  // let currentLetter = $("#words .word.active letter")[currentLetterIndex];
  try {
    let currentLetter = document
      .querySelector("#words .active")
      .querySelectorAll("letter")[currentLetterIndex];

    if ($(currentLetter).length == 0) return;
    const isLanguageLeftToRight = words[config.language].leftToRight;
    let currentLetterPosLeft = isLanguageLeftToRight
      ? currentLetter.offsetLeft
      : currentLetter.offsetLeft + $(currentLetter).width();
    let currentLetterPosTop = currentLetter.offsetTop;
    let letterHeight = $(currentLetter).height();
    let newTop = 0;
    let newLeft = 0;

    newTop = currentLetterPosTop - letterHeight / 4;
    if (inputLen == 0) {
      newLeft = isLanguageLeftToRight
        ? currentLetterPosLeft - caret.width() / 2
        : currentLetterPosLeft + caret.width() / 2;
    } else {
      newLeft = isLanguageLeftToRight
        ? currentLetterPosLeft + $(currentLetter).width() - caret.width() / 2
        : currentLetterPosLeft - $(currentLetter).width() + caret.width() / 2;
    }

    let duration = 0;

    if (config.smoothCaret) {
      duration = 100;
      // if (Math.round(caret[0].offsetTop) != Math.round(newTop)) {
      //   caret.css("top", newTop);
      //   duration = 10;
      // }
    }

    let smoothlinescroll = $("#words .smoothScroller").height();
    if (smoothlinescroll === undefined) smoothlinescroll = 0;

    caret.stop(true, true).animate(
      {
        top: newTop - smoothlinescroll,
        left: newLeft,
      },
      duration
    );

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
  } catch (e) {}
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
    if (i < inputHistory.length - 1) {
      spaces++;
    }
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
  let testSeconds = roundTo2((testEnd - testStart) / 1000);

  // if (config.mode == "words" && config.difficulty == "normal") {
  //   if (inputHistory.length != wordsList.length) return;
  // }
  let chars = countChars();
  // let testNow = Date.now();
  let wpm = roundTo2(
    ((chars.correctWordChars + chars.correctSpaces) * (60 / testSeconds)) / 5
  );
  console.log(
    `pre-spacegate ${roundTo2(
      ((chars.correctWordChars + chars.spaces) * (60 / testSeconds)) / 5
    )} (current ${wpm})`
  );
  let wpmraw = roundTo2(
    ((chars.allCorrectChars +
      chars.spaces +
      chars.incorrectChars +
      chars.extraChars) *
      (60 / testSeconds)) /
      5
  );
  let acc = roundTo2(
    (accuracyStats.correct /
      (accuracyStats.correct + accuracyStats.incorrect)) *
      100
  );
  return {
    wpm: isNaN(wpm) ? 0 : wpm,
    wpmRaw: isNaN(wpmraw) ? 0 : wpmraw,
    acc: acc,
    correctChars: chars.correctWordChars,
    incorrectChars: chars.incorrectChars + chars.extraChars + chars.missedChars,
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
  $("#result .stats .wpm .crownWrapper").css("opacity", 0);
}

function showCrown() {
  $("#result .stats .wpm .crownWrapper").animate(
    {
      opacity: 1,
    },
    250,
    "easeOutCubic"
  );
}

function showResult(difficultyFailed = false) {
  resultVisible = true;
  testEnd = Date.now();
  testActive = false;
  setFocus(false);
  hideCaret();
  hideLiveWpm();
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
      time: 0,
      spaces: 0,
      correctSpaces: 0,
    };
  }
  clearTimeout(timer);
  let testtime = stats.time;
  let afkseconds = keypressPerSecond.filter((x) => x.count == 0).length;
  let afkSecondsPercent = roundTo2((afkseconds / testtime) * 100);

  if (config.alwaysShowDecimalPlaces) {
    $("#result .stats .wpm .bottom").text(roundTo2(stats.wpm));
    $("#result .stats .raw .bottom").text(roundTo2(stats.wpmRaw));
    $("#result .stats .acc .bottom").text(roundTo2(stats.acc) + "%");
    $("#result .stats .time .bottom").text(roundTo2(testtime) + "s");
    $("#result .stats .wpm .bottom").removeAttr("aria-label");
    $("#result .stats .raw .bottom").removeAttr("aria-label");
    $("#result .stats .acc .bottom").removeAttr("aria-label");
    $("#result .stats .time .bottom").attr(
      "aria-label",
      `${afkseconds}s afk ${afkSecondsPercent}%`
    );
  } else {
    $("#result .stats .wpm .bottom").text(Math.round(stats.wpm));
    $("#result .stats .wpm .bottom").attr("aria-label", stats.wpm);
    $("#result .stats .raw .bottom").text(Math.round(stats.wpmRaw));
    $("#result .stats .raw .bottom").attr("aria-label", stats.wpmRaw);
    $("#result .stats .acc .bottom").text(Math.floor(stats.acc) + "%");
    $("#result .stats .acc .bottom").attr("aria-label", stats.acc + "%");
    $("#result .stats .time .bottom").text(Math.round(testtime) + "s");
    $("#result .stats .time .bottom").attr(
      "aria-label",
      `${roundTo2(testtime)}s (${afkseconds}s afk ${afkSecondsPercent}%)`
    );
  }

  let correctcharpercent = roundTo2(
    ((stats.correctChars + stats.correctSpaces) /
      (stats.correctChars + stats.correctSpaces + stats.incorrectChars)) *
      100
  );
  $("#result .stats .key .bottom").text(testtime + "s");
  $("#result .stats .key .bottom").attr("aria-label", `${correctcharpercent}%`);
  $("#words").removeClass("blurred");
  $(".outOfFocusWarning").addClass('hidden');
  $("#result .stats .key .bottom").text(
    stats.correctChars + stats.correctSpaces + "/" + stats.incorrectChars
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

  let labels = [];
  for (let i = 1; i <= wpmHistory.length; i++) {
    labels.push(i.toString());
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

  let rawWpmPerSecond = smooth(rawWpmPerSecondRaw, 1);

  let stddev = stdDev(rawWpmPerSecondRaw);
  let avg = mean(rawWpmPerSecondRaw);

  let consistency = roundTo2(kogasa(stddev / avg));
  let keyConsistency = roundTo2(
    kogasa(
      stdDev(keypressStats.spacing.array) / mean(keypressStats.spacing.array)
    )
  );

  if (isNaN(consistency)) {
    consistency = 0;
  }

  if (config.alwaysShowDecimalPlaces) {
    $("#result .stats .consistency .bottom").text(roundTo2(consistency) + "%");
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

  wpmOverTimeChart.options.annotation.annotations[0].borderColor =
    themeColors.sub;
  wpmOverTimeChart.options.annotation.annotations[0].label.backgroundColor =
    themeColors.sub;
  wpmOverTimeChart.options.annotation.annotations[0].label.fontColor =
    themeColors.bg;

  let maxChartVal = Math.max(
    ...[Math.max(...rawWpmPerSecond), Math.max(...wpmHistory)]
  );

  let minChartVal = Math.min(
    ...[Math.min(...rawWpmPerSecond), Math.min(...wpmHistory)]
  );

  if (!config.startGraphsAtZero) {
    wpmOverTimeChart.options.scales.yAxes[0].ticks.min = minChartVal;
    wpmOverTimeChart.options.scales.yAxes[1].ticks.min = minChartVal;
  }

  // wpmOverTimeChart.options.scales.yAxes[0].ticks.min = Math.round(minChartVal);
  // wpmOverTimeChart.options.scales.yAxes[1].ticks.min = Math.round(minChartVal);

  let errorsNoZero = [];

  for (let i = 0; i < errorsPerSecond.length; i++) {
    errorsNoZero.push({
      x: i + 1,
      y: errorsPerSecond[i].count,
    });
  }

  wpmOverTimeChart.data.datasets[2].data = errorsNoZero;

  let kps = keypressPerSecond.slice(Math.max(keypressPerSecond.length - 5, 0));

  kps = kps.map((a) => a.count);

  kps = kps.reduce((a, b) => a + b, 0);

  let afkDetected = kps === 0 ? true : false;

  if (bailout) afkDetected = false;

  if (difficultyFailed) {
    showNotification("Test failed", 2000);
  } else if (afkDetected) {
    showNotification("Test invalid - AFK detected", 2000);
  } else if (sameWordset) {
    showNotification("Test invalid - repeated", 2000);
  } else {
    let activeTags = [];
    try {
      dbSnapshot.tags.forEach((tag) => {
        if (tag.active === true) {
          activeTags.push(tag.id);
        }
      });
    } catch (e) {}

    let chartData = {
      wpm: wpmHistory,
      raw: rawWpmPerSecond,
      err: errorsNoZero,
    };

    if (testtime > 122) {
      chartData = "toolong";
      keypressStats.spacing.array = "toolong";
      keypressStats.duration.array = "toolong";
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
      punctuation: config.punctuation,
      numbers: config.numbers,
      timestamp: Date.now(),
      language: config.language,
      restartCount: restartCount,
      incompleteTestSeconds: incompleteTestSeconds,
      difficulty: config.difficulty,
      testDuration: testtime,
      blindMode: config.blindMode,
      // readAheadMode: config.readAheadMode,
      theme: config.theme,
      tags: activeTags,
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
      // console.log(incompleteTestSeconds);
      // console.log(restartCount);
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
            if (lpb < stats.wpm && stats.wpm < highestwpm) {
              dontShowCrown = true;
            }
            if (lpb < stats.wpm) {
              //new pb based on local
              if (!dontShowCrown) {
                hideCrown();
                showCrown();
              }
              localPb = true;
            }
            if (lpb > 0) {
              wpmOverTimeChart.options.annotation.annotations[0].value = lpb;
              wpmOverTimeChart.options.annotation.annotations[0].label.content =
                "PB: " + lpb;
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
            testCompleted({
              uid: firebase.auth().currentUser.uid,
              obj: completedEvent,
            })
              .then((e) => {
                // console.log(e.data);
                accountIconLoading(false);
                // console.log(JSON.stringify(e.data));
                if (e.data == null) {
                  showNotification(
                    "Unexpected response from the server.",
                    4000
                  );
                  return;
                }
                if (e.data.resultCode === -1) {
                  showNotification("Could not save result", 3000);
                } else if (e.data.resultCode === -2) {
                  showNotification(
                    "Possible bot detected. Result not saved.",
                    4000
                  );
                } else if (e.data.resultCode === -3) {
                  showNotification(
                    "Could not verify keypress stats. Result not saved.",
                    4000
                  );
                } else if (e.data.resultCode === -4) {
                  showNotification(
                    "Result data does not make sense. Result not saved.",
                    4000
                  );
                } else if (e.data.resultCode === -999) {
                  console.error("internal error: " + e.data.message);
                  showNotification(
                    "Internal error. Result might not be saved. " +
                      e.data.message,
                    6000
                  );
                } else if (e.data.resultCode === 1 || e.data.resultCode === 2) {
                  completedEvent.id = e.data.createdId;
                  if (dbSnapshot !== null && dbSnapshot.results !== undefined) {
                    dbSnapshot.results.unshift(completedEvent);
                    if (dbSnapshot.globalStats.time == undefined) {
                      dbSnapshot.globalStats.time = testtime;
                    } else {
                      dbSnapshot.globalStats.time += testtime;
                    }
                    if (dbSnapshot.globalStats.started == undefined) {
                      dbSnapshot.globalStats.started = restartCount + 1;
                    } else {
                      dbSnapshot.globalStats.started += restartCount + 1;
                    }
                    if (dbSnapshot.globalStats.completed == undefined) {
                      dbSnapshot.globalStats.completed = 1;
                    } else {
                      dbSnapshot.globalStats.completed += 1;
                    }
                  }
                  try {
                    firebase
                      .analytics()
                      .logEvent("testCompleted", completedEvent);
                  } catch (e) {
                    console.log("Analytics unavailable");
                  }

                  //global
                  let globalLbString = "";
                  if (e.data.globalLeaderboard === null) {
                    globalLbString = "global: not found";
                  } else if (e.data.globalLeaderboard.insertedAt === -1) {
                    globalLbString = "global: not qualified";
                  } else if (e.data.globalLeaderboard.insertedAt >= 0) {
                    if (e.data.globalLeaderboard.newBest) {
                      let pos = e.data.globalLeaderboard.insertedAt + 1;
                      let numend = "th";
                      let t = pos % 10;
                      let h = pos % 100;
                      if (t == 1 && h != 11) {
                        numend = "st";
                      }
                      if (t == 2 && h != 12) {
                        numend = "nd";
                      }
                      if (t == 3 && h != 13) {
                        numend = "rd";
                      }
                      globalLbString = `global: ${pos}${numend} place`;
                    } else {
                      let pos = e.data.globalLeaderboard.foundAt + 1;
                      let numend = "th";
                      let t = pos % 10;
                      let h = pos % 100;
                      if (t == 1 && h != 11) {
                        numend = "st";
                      }
                      if (t == 2 && h != 12) {
                        numend = "nd";
                      }
                      if (t == 3 && h != 13) {
                        numend = "rd";
                      }
                      globalLbString = `global: already ${pos}${numend}`;
                    }
                  }

                  //daily
                  let dailyLbString = "";
                  if (e.data.dailyLeaderboard === null) {
                    dailyLbString = "daily: not found";
                  } else if (e.data.dailyLeaderboard.insertedAt === -1) {
                    dailyLbString = "daily: not qualified";
                  } else if (e.data.dailyLeaderboard.insertedAt >= 0) {
                    if (e.data.dailyLeaderboard.newBest) {
                      let pos = e.data.dailyLeaderboard.insertedAt + 1;
                      let numend = "th";
                      if (pos === 1) {
                        numend = "st";
                      } else if (pos === 2) {
                        numend = "nd";
                      } else if (pos === 3) {
                        numend = "rd";
                      }
                      dailyLbString = `daily: ${pos}${numend} place`;
                    } else {
                      let pos = e.data.dailyLeaderboard.foundAt + 1;
                      let numend = "th";
                      if (pos === 1) {
                        numend = "st";
                      } else if (pos === 2) {
                        numend = "nd";
                      } else if (pos === 3) {
                        numend = "rd";
                      }
                      dailyLbString = `daily: already ${pos}${numend}`;
                    }
                  }

                  $("#result .stats .leaderboards .bottom").html(
                    globalLbString + "<br>" + dailyLbString
                  );

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
                    if (!localPb) {
                      // showNotification(
                      //   "Local PB data is out of sync! Resyncing.",
                      //   5000
                      // );
                    }
                    db_saveLocalPB(
                      config.mode,
                      mode2,
                      config.punctuation,
                      config.language,
                      config.difficulty,
                      stats.wpm,
                      stats.acc,
                      stats.wpmRaw
                    );
                  } else if (e.data.resultCode === 1) {
                    if (localPb) {
                      showNotification(
                        "Local PB data is out of sync! Refresh the page to resync it or contact Miodec on Discord.",
                        15000
                      );
                    }
                  }
                }
              })
              .catch((e) => {
                console.error(e);
                showNotification("Could not save result. " + e, 5000);
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

        // showNotification("Sign in to save your result",3000);
      }
    } else {
      showNotification("Test invalid", 3000);
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

  testType += config.mode;
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
  // if (config.readAheadMode) {
  //   testType += "<br>read_ahead";
  // }
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

  let tagsText = "";
  try {
    dbSnapshot.tags.forEach((tag) => {
      if (tag.active === true) {
        tagsText += "<br>" + tag.name;
      }
    });
  } catch (e) {}

  if (tagsText == "") {
    $("#result .stats .tags").addClass("hidden");
  } else {
    $("#result .stats .tags").removeClass("hidden");
    tagsText = tagsText.substring(4);
    $("#result .stats .tags .bottom").html(tagsText);
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
  swapElements($("#wordsWrapper"), $("#result"), 250, () => {
    $("#words").empty();
    wpmOverTimeChart.resize();
    if (config.alwaysShowWordsHistory) {
      toggleResultWordsDisplay();
    }
    // if (config.blindMode) {
    //   $.each($("#words .word"), (i, word) => {
    //     let input = inputHistory[i];
    //     if (input == undefined) input = currentInput;
    //     compareInput(i, input, true);
    //     if (inputHistory[i] != wordsList[i]) {
    //       highlightBadWord(i, true);
    //     }
    //   });
    // }
    // let remove = false;
    // $.each($("#words .word"), (i, obj) => {
    //   if (remove) {
    //     $(obj).remove();
    //   } else {
    //     $(obj).removeClass("hidden");
    //     if ($(obj).hasClass("active")) remove = true;
    //   }
    // });
  });
}

function startTest() {
  if (!dbConfigLoaded) {
    // console.log("config changed before db loaded!");
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
  testStart = Date.now();
  // if (config.mode == "time") {
  restartTimer();
  showTimer();
  $("#liveWpm").text("0");
  showLiveWpm();
  // }
  // updateActiveElement();
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
  //use a recursive self-adjusting timer to avoid time drift
  const stepIntervalMS = 1000;
  (function loop(expectedStepEnd) {
    const delay = expectedStepEnd - Date.now();
    timer = setTimeout(function () {
      time++;
      if (config.mode === "time") {
        updateTimer();
      }
      // console.time("livewpm");
      // let wpm = liveWPM();
      // updateLiveWpm(wpm);
      // showLiveWpm();
      // wpmHistory.push(wpm);
      // rawHistory.push(liveRaw());
      let wpmAndRaw = liveWpmAndRaw();
      updateLiveWpm(wpmAndRaw.wpm);
      wpmHistory.push(wpmAndRaw.wpm);
      rawHistory.push(wpmAndRaw.raw);

      if (activeFunBox === "layoutfluid" && config.mode === "time") {
        const layouts = ["qwerty", "dvorak", "colemak"];
        let index = 0;
        index = Math.floor(time / (config.time / 3));

        if (
          time == Math.floor(config.time / 3) - 3 ||
          time == (config.time / 3) * 2 - 3
        ) {
          showNotification("3", 1000);
        }
        if (
          time == Math.floor(config.time / 3) - 2 ||
          time == Math.floor(config.time / 3) * 2 - 2
        ) {
          showNotification("2", 1000);
        }
        if (
          time == Math.floor(config.time / 3) - 1 ||
          time == Math.floor(config.time / 3) * 2 - 1
        ) {
          showNotification("1", 1000);
        }

        if (config.layout !== layouts[index] && layouts[index] !== undefined) {
          showNotification(`--- !!! ${layouts[index]} !!! ---`, 3000);
        }
        changeLayout(layouts[index]);
        changeKeymapLayout(layouts[index]);
        updateHighlightedKeymapKey();
        settingsGroups.layout.updateButton();
      }

      // console.timeEnd("livewpm");
      keypressPerSecond.push(currentKeypress);
      currentKeypress = {
        count: 0,
        words: [],
      };
      errorsPerSecond.push(currentError);
      currentError = {
        count: 0,
        words: [],
      };
      // if (
      //   keypressPerSecond[time - 1] == 0 &&
      //   keypressPerSecond[time - 2] == 0 &&
      //   keypressPerSecond[time - 3] == 0 &&
      //   keypressPerSecond[time - 4] == 0 &&
      //   keypressPerSecond[time - 5] == 0 &&
      //   keypressPerSecond[time - 6] == 0 &&
      //   keypressPerSecond[time - 7] == 0 &&
      //   keypressPerSecond[time - 8] == 0 &&
      //   keypressPerSecond[time - 9] == 0 &&
      //   !afkDetected
      // ) {
      //   showNotification("AFK detected", 3000);
      //   afkDetected = true;
      // }
      if (config.mode == "time") {
        if (time >= config.time) {
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

function restartTest(withSameWordset = false) {
  if (!manualRestart) {
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
      showNotification(
        "Restart disabled for long tests. Use your mouse to confirm.",
        4000
      );
      return;
    }
  }

  manualRestart = false;
  clearTimeout(timer);
  time = 0;
  // afkDetected = false;
  wpmHistory = [];
  rawHistory = [];
  setFocus(false);
  hideCaret();
  testActive = false;
  hideLiveWpm();
  hideTimer();
  bailout = false;
  $("#showWordHistoryButton").removeClass("loaded");
  keypressPerSecond = [];
  currentKeypress = {
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
  // restartTimer();
  let el = null;
  if (resultVisible) {
    //results are being displayed
    el = $("#result");
  } else {
    //words are being displayed
    el = $("#wordsWrapper");
  }
  if (resultVisible) {
    if (
      config.randomTheme !== "off" &&
      !pageTransition &&
      !config.customTheme
    ) {
      randomiseTheme();
      showNotification(config.theme.replace(/_/g, " "), 1500);
    }
    $("#wordsWrapper").stop(true, true).animate(
      {
        opacity: 0,
      },
      125
    );
    $("#wordsTitle")
      .stop(true, true)
      .animate(
        {
          opacity: 0,
        },
        125,
        () => {
          $("#wordsTitle").slideUp(0);
        }
      );
    $("#resultExtraButtons")
      .stop(true, true)
      .animate(
        {
          opacity: 0,
        },
        125,
        () => {
          $("#resultExtraButtons").addClass("hidden");
        }
      );
  }
  resultVisible = false;

  // .css("transition", "1s linear");

  el.stop(true, true).animate(
    {
      opacity: 0,
    },
    125,
    () => {
      if (!withSameWordset) {
        sameWordset = false;
        initWords();
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
        showWords();
      }
      if (config.keymapMode !== "off") {
        showKeymap();
      } else {
        hideKeymap();
      }
      document.querySelector("#miniTimerAndLiveWpm .wpm").innerHTML = "0";
      document.querySelector("#liveWpm").innerHTML = "0";

      if (activeFunBox === "layoutfluid") {
        changeLayout("qwerty");
        settingsGroups.layout.updateButton();
        changeKeymapLayout("qwerty");
        settingsGroups.keymapLayout.updateButton();
        updateHighlightedKeymapKey();
      }

      $("#result").addClass("hidden");
      $("#testModesNotice").removeClass("hidden").css({
        opacity: 1,
        // 'height': 'auto',
        // 'margin-bottom': '1.25rem'
      });
      $("#wordsWrapper")
        .css("opacity", 0)
        .removeClass("hidden")
        .stop(true, true)
        .animate(
          {
            opacity: 1,
          },
          125,
          () => {
            hideCrown();
            clearTimeout(timer);
            $("#restartTestButton").css("opacity", 1);
            if ($("#commandLineWrapper").hasClass("hidden")) focusWords();
            wpmOverTimeChart.options.annotation.annotations[0].value = "-30";
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
          }
        );
    }
  );
  // $(".active-key").classList.remove("active-key");
}

function focusWords() {
  if (!$("#wordsWrapper").hasClass("hidden")) {
    $("#wordsInput").focus();
  }
}

function changeCustomText() {
  customText = prompt("Custom text").trim();
  customText = customText.replace(/[\n\r\t ]/gm, " ");
  customText = customText.replace(/ +/gm, " ");
  customText = customText.split(" ");
  if (customText.length >= 10000) {
    showNotification("Custom text cannot be longer than 10000 words.", 4000);
    changeMode("time");
    customText = "The quick brown fox jumped over the lazy dog".split(" ");
  }
  // initWords();
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

function changeMode(mode, nosave) {
  config.mode = mode;
  $("#top .config .mode .text-button").removeClass("active");
  $("#top .config .mode .text-button[mode='" + mode + "']").addClass("active");
  if (config.mode == "time") {
    $("#top .config .wordCount").addClass("hidden");
    $("#top .config .time").removeClass("hidden");
    $("#top .config .customText").addClass("hidden");
    $("#top .config .punctuationMode").removeClass("hidden");
    $("#top .config .numbersMode").removeClass("hidden");
  } else if (config.mode == "words") {
    $("#top .config .wordCount").removeClass("hidden");
    $("#top .config .time").addClass("hidden");
    $("#top .config .customText").addClass("hidden");
    $("#top .config .punctuationMode").removeClass("hidden");
    $("#top .config .numbersMode").removeClass("hidden");
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
  } else if (config.mode == "quote") {
    setToggleSettings(false);
    $("#top .config .wordCount").addClass("hidden");
    $("#top .config .time").addClass("hidden");
    $("#top .config .customText").addClass("hidden");
    $("#top .config .punctuationMode").addClass("hidden");
    $("#top .config .numbersMode").addClass("hidden");
    $("#result .stats .source").removeClass("hidden");
    changeLanguage("english");
  }
  if (!nosave) saveConfigToCookie();
}

// function liveWPM() {
//   let correctWordChars = 0;
//   for (let i = 0; i < inputHistory.length; i++) {
//     if (inputHistory[i] == wordsList[i]) {
//       //the word is correct
//       //+1 for space
//       correctWordChars += wordsList[i].length + 1;
//     }
//   }
//   let testNow = Date.now();
//   let testSeconds = (testNow - testStart) / 1000;
//   wpm = (correctWordChars * (60 / testSeconds)) / 5;
//   return Math.round(wpm);
// }

// function liveRaw() {
//   let chars = 0;
//   for (let i = 0; i < inputHistory.length; i++) {
//     chars += inputHistory[i].length + 1;
//   }
//   let testNow = Date.now();
//   let testSeconds = (testNow - testStart) / 1000;
//   raw = (chars * (60 / testSeconds)) / 5;
//   return Math.round(raw);
// }

function liveWpmAndRaw() {
  let chars = 0;
  let correctWordChars = 0;
  let spaces = 0;
  for (let i = 0; i < inputHistory.length; i++) {
    if (inputHistory[i] == wordsList[i]) {
      //the word is correct
      //+1 for space
      correctWordChars += wordsList[i].length;
      if (i < inputHistory.length - 1) {
        spaces++;
      }
    }
    chars += inputHistory[i].length;
  }
  let testNow = Date.now();
  let testSeconds = (testNow - testStart) / 1000;
  let wpm = Math.round(((correctWordChars + spaces) * (60 / testSeconds)) / 5);
  let raw = Math.round(((chars + spaces + currentInput.length) * (60 / testSeconds)) / 5);
  return {
    wpm: wpm,
    raw: raw,
  };
}

function updateLiveWpm(wpm) {
  if (!testActive || !config.showLiveWpm) {
    hideLiveWpm();
  } else {
    showLiveWpm();
  }
  // let wpmstring = wpm < 100 ? `&nbsp;${wpm}` : `${wpm}`;
  document.querySelector("#miniTimerAndLiveWpm .wpm").innerHTML = wpm;
  document.querySelector("#liveWpm").innerHTML = wpm;
  // $("#liveWpm").html(wpm);
}

function showLiveWpm() {
  if (!config.showLiveWpm) return;
  if (!testActive) return;
  if (config.timerStyle === "mini") {
    $("#miniTimerAndLiveWpm .wpm").css("opacity", config.timerOpacity);
  } else {
    $("#liveWpm").css("opacity", config.timerOpacity);
  }
  // if (config.timerStyle === "text") {
  //   $("#timerNumber").css("opacity", config.timerOpacity);
  // }
}

function hideLiveWpm() {
  $("#liveWpm").css("opacity", 0);
  $("#miniTimerAndLiveWpm .wpm").css("opacity", 0);
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
    // $("#menu .icon-button.account").removeClass('hidden');
    // $("#menu .icon-button.login").addClass('hidden');
  } else {
    swapElements(
      $("#menu .icon-button.account"),
      $("#menu .icon-button.login"),
      250
    );
    // $("#menu .icon-button.login").removeClass('hidden');
    // $("#menu .icon-button.account").addClass('hidden');
  }
}

function accountIconLoading(truefalse) {
  if (truefalse) {
    $("#top #menu .account .icon").html(
      '<i class="fas fa-fw fa-spin fa-circle-notch"></i>'
    );
  } else {
    $("#top #menu .account .icon").html('<i class="fas fa-fw fa-user"></i>');
  }
}

function toggleResultWordsDisplay() {
  if (resultVisible) {
    if ($("#wordsWrapper").stop(true, true).hasClass("hidden")) {
      //show
      $("#wordsTitle").css("opacity", 1).removeClass("hidden").slideDown(250);

      if (!$("#showWordHistoryButton").hasClass("loaded")) {
        $("#words").html(
          `<div class="preloader"><i class="fas fa-fw fa-spin fa-circle-notch"></i></div>`
        );
        loadWordsHistory();
      }

      $("#words").css("height", "auto");
      let newHeight = $("#wordsWrapper")
        .removeClass("hidden")
        .css("height", "auto")
        .outerHeight();

      $("#wordsWrapper")
        .css({
          height: 0,
          opacity: 0,
        })
        .animate(
          {
            height: newHeight,
            opacity: 1,
          },
          250
        );
    } else {
      //hide

      $("#wordsTitle").slideUp(250);

      let oldHeight = $("#wordsWrapper").outerHeight();
      $("#wordsWrapper").removeClass("hidden");
      $("#wordsWrapper")
        .css({
          opacity: 1,
          height: oldHeight,
        })
        .animate(
          {
            height: 0,
            opacity: 0,
          },
          250,
          () => {
            $("#wordsWrapper").addClass("hidden");
          }
        );
    }
  }
}

async function loadWordsHistory() {
  $("#words").empty();
  // inputHistory.forEach((input, index) => {
  for (let i = 0; i < inputHistory.length + 2; i++) {
    let input = inputHistory[i];
    let wordEl = "";
    try {
      if (input === "") throw Exception;
      if (correctedHistory[i] !== "") {
        wordEl = `<div class='word' input='${correctedHistory[i]}'>`;
      } else {
        wordEl = `<div class='word' input='${input}'>`;
      }
      if (input !== wordsList[i]) {
        wordEl = `<div class='word error' input='${input}'>`;
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
        // input.forEach((inputLetter, inputLetteri) => {
        let correctedChar;
        try {
          correctedChar = correctedHistory[i][c];
        } catch (e) {
          correctedChar = undefined;
        }
        let extraCorrected = "";
        if (c + 1 === loop && correctedHistory[i].length > input.length) {
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
              wordEl += "<letter class='correct'>" + wordsList[i][c] + "</letter>";
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
      try{
        wordEl = "<div class='word'>";
        for (let c = 0; c < wordsList[i].length; c++) {
          wordEl += "<letter>" + wordsList[i][c] + "</letter>";
        }
          wordEl += "</div>"
      }catch(e){}
    }
    $("#words").append(wordEl);
  };
  $("#showWordHistoryButton").addClass("loaded");
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

// function applyReadAheadMode(tc) {
//   if (tc) {
//     $("#words").addClass("readAheadMode");
//   } else {
//     $("#words").removeClass("readAheadMode");
//   }
// }

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
      .animate({ opacity: 1 }, 100, (e) => {
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
        (e) => {
          $("#tagsWrapper").addClass("hidden");
        }
      );
  }
}

function showBackgroundLoader() {
  $("#backgroundLoader").stop(true, true).fadeIn(125);
}

function hideBackgroundLoader() {
  $("#backgroundLoader").stop(true, true).fadeOut(125);
}

function updateTestModesNotice() {
  let anim = false;
  if ($(".pageTest #testModesNotice").text() === "") anim = true;

  $(".pageTest #testModesNotice").empty();

  if (config.difficulty === "expert") {
    $(".pageTest #testModesNotice").append(
      `<div><i class="fas fa-star-half-alt"></i>expert</div>`
    );
  } else if (config.difficulty === "master") {
    $(".pageTest #testModesNotice").append(
      `<div><i class="fas fa-star"></i>master</div>`
    );
  }

  if (config.blindMode) {
    $(".pageTest #testModesNotice").append(
      `<div><i class="fas fa-eye-slash"></i>blind</div>`
    );
  }

  // if (config.readAheadMode) {
  //   $(".pageTest #testModesNotice").append(
  //     `<div><i class="fas fa-arrow-right"></i>read ahead</div>`
  //   );
  // }

  if (activeFunBox !== "none") {
    $(".pageTest #testModesNotice").append(
      `<div><i class="fas fa-gamepad"></i>${activeFunBox.replace(
        /_/g,
        " "
      )}</div>`
    );
  }

  if (config.confidenceMode === "on") {
    $(".pageTest #testModesNotice").append(
      `<div><i class="fas fa-backspace"></i>confidence</div>`
    );
  }
  if (config.confidenceMode === "max") {
    $(".pageTest #testModesNotice").append(
      `<div><i class="fas fa-backspace"></i>max confidence</div>`
    );
  }

  if (config.stopOnError != "off") {
    $(".pageTest #testModesNotice").append(
      `<div><i class="fas fa-hand-paper"></i>stop on ${config.stopOnError}</div>`
    );
  }

  if (config.layout !== "default") {
    $(".pageTest #testModesNotice").append(
      `<div><i class="fas fa-keyboard"></i>${config.layout}</div>`
    );
  }

  tagsString = "";
  // $.each($('.pageSettings .section.tags .tagsList .tag'), (index, tag) => {
  //     if($(tag).children('.active').attr('active') === 'true'){
  //         tagsString += $(tag).children('.title').text() + ', ';
  //     }
  // })
  try {
    dbSnapshot.tags.forEach((tag) => {
      if (tag.active === true) {
        tagsString += tag.name + ", ";
      }
    });

    if (tagsString !== "") {
      $(".pageTest #testModesNotice").append(
        `<div><i class="fas fa-tag"></i>${tagsString.substring(
          0,
          tagsString.length - 2
        )}</div>`
      );
    }
  } catch (e) {}

  if (anim) {
    $(".pageTest #testModesNotice")
      .css("transition", "none")
      .css("opacity", 0)
      .animate(
        {
          opacity: 1,
        },
        125,
        (e) => {
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

$("#tagsWrapper #tagsEdit .button").click((e) => {
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
    addTag({ uid: firebase.auth().currentUser.uid, name: inputVal }).then(
      (e) => {
        hideBackgroundLoader();
        let status = e.data.resultCode;
        if (status === 1) {
          showNotification("Tag added", 2000);
          dbSnapshot.tags.push({
            name: inputVal,
            id: e.data.id,
          });
          updateResultEditTagsPanelButtons();
          updateSettingsPage();
          updateFilterTags();
        } else if (status === -1) {
          showNotification("Invalid tag name", 3000);
        } else if (status < -1) {
          showNotification("Unknown error", 3000);
        }
      }
    );
  } else if (action === "edit") {
    showBackgroundLoader();
    editTag({
      uid: firebase.auth().currentUser.uid,
      name: inputVal,
      tagid: tagid,
    }).then((e) => {
      hideBackgroundLoader();
      let status = e.data.resultCode;
      if (status === 1) {
        showNotification("Tag updated", 2000);
        dbSnapshot.tags.forEach((tag) => {
          if (tag.id === tagid) {
            tag.name = inputVal;
          }
        });
        updateResultEditTagsPanelButtons();
        updateSettingsPage();
        updateFilterTags();
      } else if (status === -1) {
        showNotification("Invalid tag name", 3000);
      } else if (status < -1) {
        showNotification("Unknown error", 3000);
      }
    });
  } else if (action === "remove") {
    showBackgroundLoader();
    removeTag({ uid: firebase.auth().currentUser.uid, tagid: tagid }).then(
      (e) => {
        hideBackgroundLoader();
        let status = e.data.resultCode;
        if (status === 1) {
          showNotification("Tag removed", 2000);
          dbSnapshot.tags.forEach((tag, index) => {
            if (tag.id === tagid) {
              dbSnapshot.tags.splice(index, 1);
            }
          });
          updateResultEditTagsPanelButtons();
          updateSettingsPage();
          updateFilterTags();
          updateActiveTags();
        } else if (status < -1) {
          showNotification("Unknown error", 3000);
        }
      }
    );
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
      .animate({ opacity: 1 }, 100, (e) => {
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

$("#customTextPopup .inputs .check input").change((e) => {
  if ($("#customTextPopup .check input").prop("checked")) {
    $("#customTextPopup .inputs .wordcount").removeClass("hidden");
  } else {
    $("#customTextPopup .inputs .wordcount").addClass("hidden");
  }
});

$("#customTextPopup .button").click((e) => {
  let text = $("#customTextPopup textarea").val();
  text = text.trim();
  text = text.replace(/[\n\r\t ]/gm, " ");
  text = text.replace(/ +/gm, " ");
  text = text.split(" ");
  // if (text.length >= 10000) {
  //   showNotification("Custom text cannot be longer than 10000 words.", 4000);
  //   changeMode("time");
  //   text = "The quick brown fox jumped over the lazy dog".split(" ");
  // } else {
  customText = text;
  customTextIsRandom = $("#customTextPopup .check input").prop("checked");
  // if (customTextIsRandom && customText.length < 3) {
  //   showNotification("Random custom text requires at least 3 words", 4000);
  //   customTextIsRandom = false;
  // }
  customTextWordCount = $("#customTextPopup .wordcount input").val();
  manualRestart = true;
  restartTest();
  // }
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

  let rand = Math.floor(
    Math.random() * clickSounds[config.playSoundOnClick].length
  );
  let randomSound = clickSounds[config.playSoundOnClick][rand];
  randomSound.counter++;
  if (randomSound.counter === 2) randomSound.counter = 0;
  randomSound.sounds[randomSound.counter].currentTime = 0;
  randomSound.sounds[randomSound.counter].play();

  // clickSound.currentTime = 0;
  // clickSound.play();
}

function playErrorSound() {
  if (!config.playSoundOnError) return;
  errorSound.currentTime = 0;
  errorSound.play();
}

$("#customMode2PopupWrapper").click((e) => {
  if ($(e.target).attr("id") === "customMode2PopupWrapper") {
    hideCustomMode2Popup();
  }
});

$("#customMode2Popup input").keypress((e) => {
  if (event.keyCode == 13) {
    applyMode2Popup();
  }
});

$("#customMode2Popup .button").click((e) => {
  applyMode2Popup();
});

function applyMode2Popup() {
  let mode = $("#customMode2Popup").attr("mode");
  let val = $("#customMode2Popup input").val();

  if (mode == "time") {
    if (val !== null && !isNaN(val) && val > 0) {
      changeTimeConfig(val);
      manualRestart = true;
      restartTest();
      if (val >= 1800) {
        showNotification("Stay safe and take breaks!", 3000);
      }
    } else {
      showNotification("Custom time must be larger than 1", 3000);
    }
  } else if (mode == "words") {
    if (val !== null && !isNaN(val) && val > 0) {
      changeWordCount(val);
      manualRestart = true;
      restartTest();
      if (val > 2000) {
        showNotification("Stay safe and take breaks!", 3000);
      }
    } else {
      showNotification("Custom word amount must be larger than 1", 3000);
    }
  }

  hideCustomMode2Popup();
}

$(document).on("click", "#top .logo", (e) => {
  changePage("test");
});

$(document).on("click", "#top .config .wordCount .text-button", (e) => {
  wrd = $(e.currentTarget).attr("wordCount");
  if (wrd == "custom") {
    //   let newWrd = prompt("Custom word amount");
    //   if (newWrd !== null && !isNaN(newWrd) && newWrd > 0 && newWrd <= 10000) {
    //     changeWordCount(newWrd);
    //     if (newWrd > 2000) {
    //       showNotification(
    //         "Very long tests can cause performance issues or crash the website on some machines!",
    //         5000
    //       );
    //     }
    //   } else {
    //     showNotification(
    //       "Custom word amount can only be set between 1 and 10000",
    //       3000
    //     );
    //   }
    showCustomMode2Popup("words");
  } else {
    changeWordCount(wrd);
    manualRestart = true;
    restartTest();
  }
});

$(document).on("click", "#top .config .time .text-button", (e) => {
  let mode = $(e.currentTarget).attr("timeConfig");
  if (mode == "custom") {
    //   let newTime = prompt("Custom time in seconds");
    //   if (newTime !== null && !isNaN(newTime) && newTime > 0 && newTime <= 3600) {
    //     changeTimeConfig(newTime);
    //     if (newTime >= 1800) {
    //       showNotification(
    //         "Very long tests can cause performance issues or crash the website on some machines!",
    //         5000
    //       );
    //     }
    //   } else {
    //     showNotification("Custom time can only be set between 1 and 3600", 3000);
    //   }
    showCustomMode2Popup("time");
  } else {
    changeTimeConfig(mode);
    manualRestart = true;

    restartTest();
  }
});

$(document).on("click", "#top .config .customText .text-button", (e) => {
  // changeCustomText();
  // restartTest();
  showCustomTextPopup();
});

$(document).on("click", "#top .config .punctuationMode .text-button", (e) => {
  togglePunctuation();
  manualRestart = true;

  restartTest();
});

$(document).on("click", "#top .config .numbersMode .text-button", (e) => {
  toggleNumbers();
  manualRestart = true;

  restartTest();
});

$("#wordsWrapper").on("click",(e) => {
  focusWords();
});

$(document).on("click", "#top .config .mode .text-button", (e) => {
  if ($(e.currentTarget).hasClass("active")) return;
  mode = $(e.currentTarget).attr("mode");
  changeMode(mode);
  manualRestart = true;

  restartTest();
});

$(document).on("click", "#top #menu .icon-button", (e) => {
  if ($(e.currentTarget).hasClass("discord")) return;
  if ($(e.currentTarget).hasClass("leaderboards")) {
    showLeaderboards();
  } else {
    href = $(e.currentTarget).attr("href");
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
        let testNow = Date.now();
        let testSeconds = roundTo2((testNow - testStart) / 1000);
        incompleteTestSeconds += testSeconds;
        restartCount++;
      }
      restartTest();
    } else {
      showNotification("Quick restart disabled for long tests", 2000);
    }
  }
});

$(document.body).on("click", "#restartTestButton", (event) => {
  manualRestart = true;
  restartTest();
});

$(document).on("keypress", "#showWordHistoryButton", (event) => {
  if (event.keyCode == 13) {
    toggleResultWordsDisplay();
  }
});

$(document.body).on("click", "#showWordHistoryButton", (event) => {
  toggleResultWordsDisplay();
});

$(document.body).on("click", "#restartTestButtonWithSameWordset", (event) => {
  manualRestart = true;

  restartTest(true);
});

$(document).on("keypress", "#restartTestButtonWithSameWordset", (event) => {
  if (event.keyCode == 13) {
    restartTest(true);
  }
});

$(document.body).on("click", "#copyResultToClipboardButton", (event) => {
  copyResultToClipboard();
});

$(document.body).on("click", ".version", (event) => {
  $("#versionHistoryWrapper")
    .css("opacity", 0)
    .removeClass("hidden")
    .animate({ opacity: 1 }, 125);
});

$(document.body).on("click", "#versionHistoryWrapper", (event) => {
  $("#versionHistoryWrapper")
    .css("opacity", 1)
    .animate({ opacity: 0 }, 125, () => {
      $("#versionHistoryWrapper").addClass("hidden");
    });
});

$("#wordsInput").keypress((event) => {
  event.preventDefault();
});

let outOfFocusTimeout;

$("#wordsInput").on("focus", (event) => {
  if (!resultVisible) {
    $("#words").removeClass("blurred");
    $(".outOfFocusWarning").addClass('hidden');
    clearTimeout(outOfFocusTimeout);
  }
  showCaret();
});

$("#wordsInput").on("focusout", (event) => {
  if (!resultVisible) {
  outOfFocusTimeout = setTimeout(() => {
    $("#words").addClass('blurred');
    $(".outOfFocusWarning").removeClass('hidden');
  }, 1000)
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

//keypresses for the test, using different method to be more responsive
$(document).keypress(function (event) {
  event = emulateLayout(event);
  if (!$("#wordsInput").is(":focus")) return;
  if (event["keyCode"] == 13) return;
  if (event["keyCode"] == 32) return;
  if (event["keyCode"] == 27) return;
  if (event.key == "ContextMenu") return;
  //start the test
  if (currentInput == "" && inputHistory.length == 0 && !testActive) {
    startTest();
  } else {
    if (!testActive) return;
  }
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
    if (config.difficulty == "master") {
      //failed due to master diff when pressing a key
      inputHistory.push(currentInput);
      correctedHistory.push(currentCorrected);
      showResult(true);
      let testNow = Date.now();
      let testSeconds = roundTo2((testNow - testStart) / 1000);
      incompleteTestSeconds += testSeconds;
      restartCount++;
      return;
    } else {
      return;
    }
  }

  if(currentInput.length < wordsList[currentWordIndex].length + 20) currentInput += event["key"];
  setFocus(true);
  stopCaretAnimation();
  activeWordTopBeforeJump = activeWordTop;
  compareInput(!config.blindMode);
  
  // let newActiveTop = $("#words .word.active").position().top;

  // console.time("offcheck1");
  let newActiveTop = document.querySelector("#words .word.active").offsetTop;
  if (activeWordTopBeforeJump < newActiveTop && !lineTransition) {
    activeWordJumped = true;
  } else {
    activeWordJumped = false;
  }
  // console.timeEnd("offcheck2");

  if (config.keymapMode === "react") {
    flashPressedKeymapKey(event.key, thisCharCorrect);
  } else if (config.keymapMode === "next") {
    updateHighlightedKeymapKey();
  }
  updateCaretPosition();
});

$(document).keydown((event) => {
  keypressStats.duration.current = performance.now();
  if ($("#wordsInput").is(":focus")) {
    try {
      if (
        !config.capsLockBackspace &&
        event.originalEvent.getModifierState("CapsLock")
      ) {
        showCapsWarning();
      } else {
        hideCapsWarning();
      }
    } catch (e) {}
  }
});

$(document).keyup((event) => {
  let now = performance.now();
  let diff = Math.abs(keypressStats.duration.current - now);
  if (keypressStats.duration.current !== -1) {
    keypressStats.duration.array.push(diff);
  }
  keypressStats.duration.current = now;
});

//handle keyboard events
$(document).keydown((event) => {
  let now = performance.now();
  let diff = Math.abs(keypressStats.spacing.current - now);
  if (keypressStats.spacing.current !== -1) {
    keypressStats.spacing.array.push(diff);
  }
  keypressStats.spacing.current = now;

  //tab
  if (event["keyCode"] == 9) {
    if (
      !event.ctrlKey &&
      config.quickTab &&
      !$(".pageLogin").hasClass("active")
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
            let testNow = Date.now();
            let testSeconds = roundTo2((testNow - testStart) / 1000);
            incompleteTestSeconds += testSeconds;
            restartCount++;
          }
          restartTest();
        } else {
          showNotification("Quick restart disabled for long tests", 2000);
        }
      } else {
        changePage("test");
      }
    }
  }

  //only for the typing test
  if ($("#wordsInput").is(":focus")) {
    const isBackspace =
      event["keyCode"] === 8 ||
      (config.capsLockBackspace && event.key === "CapsLock");
    if (isBackspace) {
      event.preventDefault();
      if (!testActive) return;
      if (
        currentInput == "" &&
        inputHistory.length > 0 &&
        currentWordElementIndex > 0
      ) {
        if (
          (inputHistory[currentWordIndex - 1] ==
            wordsList[currentWordIndex - 1] &&
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
          }
          currentWordIndex--;
          currentWordElementIndex--;
          updateActiveElement();
          compareInput(!config.blindMode);
        }
      } else {
        if (config.confidenceMode === "max") return;
        if (event["ctrlKey"] || event["altKey"]) {
          currentInput = "";
        } else {
          currentInput = currentInput.substring(0, currentInput.length - 1);
        }
        compareInput(!config.blindMode);
      }
      playClickSound();
      if (config.keymapMode === "react") {
        flashPressedKeymapKey(event.code, true);
      } else if (config.keymapMode === "next") {
        updateHighlightedKeymapKey();
      }
      updateCaretPosition();
    }
    //space
    if (event["keyCode"] == 32 || event.key === " ") {
      if (!testActive) return;
      if (currentInput == "") return;
      event.preventDefault();
      let currentWord = wordsList[currentWordIndex];
      // if (config.mode == "time") {
      if (!config.showAllLines || config.mode == "time") {
        // let currentTop = Math.floor($($("#words .word")[currentWordIndex]).position().top);
        // let nextTop = Math.floor($($("#words .word")[currentWordIndex + 1]).position().top);
        let currentTop = Math.floor(
          document.querySelectorAll("#words .word")[currentWordElementIndex]
            .offsetTop
        );
        let nextTop;
        try {
          nextTop = Math.floor(
            document.querySelectorAll("#words .word")[
              currentWordElementIndex + 1
            ].offsetTop
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
            for (let i = 0; i < currentWordElementIndex + 1; i++) {
              if ($(wordElements[i]).hasClass("hidden")) continue;
              // let forWordTop = Math.floor($(wordElements[i]).position().top);
              let forWordTop = Math.floor(wordElements[i].offsetTop);
              if (forWordTop < hideBound - 10) {
                // $($("#words .word")[i]).addClass("hidden");
                toHide.push($($("#words .word")[i]));
              }
            }
            const wordHeight = $(document.querySelector(".word")).outerHeight(
              true
            );
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
            }

            // if (config.smoothLineScroll) {
            //   let word = $(document.querySelector(".word"));
            //   $("#words").prepend(
            //     `<div class="smoothScroller" style="height:${word.outerHeight(
            //       true
            //     )}px;width:100%"></div>`
            //   );
            //   lineTransition = true;
            //   $("#words .smoothScroller").animate(
            //     {
            //       height: 0,
            //     },
            //     100,
            //     () => {
            //       $("#words .smoothScroller").remove();
            //       lineTransition = false;
            //       $(this).remove();
            //       activeWordTop = document.querySelector("#words .active")
            //         .offsetTop;
            //     }
            //   );
            // }
            // toHide.forEach((el) => el.remove());
          }
          currentTestLine++;
        }
      }
      if (activeFunBox === "layoutfluid" && config.mode !== "time") {
        const layouts = ["qwerty", "dvorak", "colemak"];
        let index = 0;
        let outof = wordsList.length;
        index = Math.floor((inputHistory.length + 1) / (outof / 3));
        if (config.layout !== layouts[index] && layouts[index] !== undefined) {
          showNotification(`--- !!! ${layouts[index]} !!! ---`, 3000);
        }
        changeLayout(layouts[index]);
        changeKeymapLayout(layouts[index]);
        updateHighlightedKeymapKey();
        settingsGroups.layout.updateButton();
      }
      if (config.blindMode) $("#words .word.active letter").addClass("correct");
      // document
      //   .querySelector("#words .word.active")
      //   .setAttribute("input", currentInput);
      if (currentWord == currentInput) {
        accuracyStats.correct++;
        inputHistory.push(currentInput);
        currentInput = "";
        currentWordIndex++;
        currentWordElementIndex++;
        updateActiveElement();
        updateCaretPosition();
        currentKeypress.count++;
        currentKeypress.words.push(currentWordIndex);
        playClickSound();
      } else {
        if (!config.playSoundOnError || config.blindMode) {
          playClickSound();
        } else {
          playErrorSound();
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
            inputHistory.push(currentInput);
            correctedHistory.push(currentCorrected);
            showResult(true);
            // if (!afkDetected) {
            let testNow = Date.now();
            let testSeconds = roundTo2((testNow - testStart) / 1000);
            incompleteTestSeconds += testSeconds;
            restartCount++;
            // }
            return;
          }
          return;
        }
        inputHistory.push(currentInput);
        highlightBadWord(currentWordElementIndex, !config.blindMode);
        currentInput = "";
        currentWordIndex++;
        currentWordElementIndex++;
        if (currentWordIndex == wordsList.length) {
          //submitted last word that is incorrect
          showResult();
          return;
        } else if (
          config.difficulty == "expert" ||
          config.difficulty == "master"
        ) {
          //submitted last word incorrect and failed test
          inputHistory.push(currentInput);
          correctedHistory.push(currentCorrected);
          showResult(true);
          // if (!afkDetected) {
          let testNow = Date.now();
          let testSeconds = roundTo2((testNow - testStart) / 1000);
          incompleteTestSeconds += testSeconds;
          restartCount++;
          // }
          return;
        }
        updateActiveElement();
        updateCaretPosition();
        currentKeypress.count++;
        currentKeypress.words.push(currentWordIndex);
      }
      correctedHistory.push(currentCorrected);
      currentCorrected = "";
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
      if (config.showAllLines) {
        if (config.mode == "time") {
          addWord();
        }
      } else {
        if (
          config.mode == "time" ||
          config.mode == "words" ||
          config.mode == "custom"
        ) {
          addWord();
        }
      }
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
    this.showNotification(error, 3000);
  };
  $("#top .logo .top").text("localhost");
  $("head title").text($("head title").text() + " (localhost)");
  firebase.functions().useFunctionsEmulator("http://localhost:5001");
  $("body").append(
    `<div class="devIndicator tl">local</div><div class="devIndicator br">local</div>`
  );
}

loadConfigFromCookie();
getReleasesFromGitHub();
getPatreonNames();

$(document).on("mouseenter", "#words .word", (e) => {
  if (resultVisible) {
    let input = $(e.currentTarget).attr("input");
    if (input != undefined)
      $(e.currentTarget).append(`<div class="wordInputAfter">${input}</div>`);
  }
});

$(document).on("mouseleave", "#words .word", (e) => {
  $(".wordInputAfter").remove();
});

$("#wpmChart").on("mouseleave", (e) => {
  $(".wordInputAfter").remove();
});

$(document).ready(() => {
  updateFavicon(32, 14);
  $("body").css("transition", ".25s");
  manualRestart = true;
  restartTest();
  if (config.quickTab) {
    $("#restartTestButton").addClass("hidden");
  }
  $("#centerContent")
    .css("opacity", "0")
    .removeClass("hidden")
    .stop(true, true)
    .animate({ opacity: 1 }, 250, () => {
      if (window.location.pathname === "/account") {
        history.replaceState("/", null, "/");
      } else if (window.location.pathname !== "/") {
        let page = window.location.pathname.replace("/", "");
        changePage(page);
      }
    });
});

$(".scrollToTopButton").click((event) => {
  window.scrollTo(0, 0);
});

$(".pageTest #copyWordsListButton").click(async (event) => {
  try {
    await navigator.clipboard.writeText(
      wordsList.slice(0, inputHistory.length).join(" ")
    );
    showNotification("Copied to clipboard", 1000);
  } catch (e) {
    showNotification("Could not copy to clipboard: " + e, 5000);
  }
});

let ctx = $("#wpmChart");
let wpmOverTimeChart = new Chart(ctx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "wpm",
        data: [],
        // backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderColor: "rgba(125, 125, 125, 1)",
        borderWidth: 2,
        yAxisID: "wpm",
        order: 2,
        radius: 2,
      },
      {
        label: "raw",
        data: [],
        // backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderColor: "rgba(125, 125, 125, 1)",
        borderWidth: 2,
        yAxisID: "raw",
        order: 3,
        radius: 2,
      },
      {
        label: "errors",
        data: [],
        // backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderColor: "rgba(255, 125, 125, 1)",
        pointBackgroundColor: "rgba(255, 125, 125, 1)",
        borderWidth: 2,
        order: 1,
        yAxisID: "error",
        // barPercentage: 0.1,
        maxBarThickness: 10,
        type: "scatter",
        pointStyle: "crossRot",
        radius: function (context) {
          var index = context.dataIndex;
          var value = context.dataset.data[index];
          return value.y <= 0 ? 0 : 3;
        },
        pointHoverRadius: function (context) {
          var index = context.dataIndex;
          var value = context.dataset.data[index];
          return value.y <= 0 ? 0 : 5;
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
              let wordEl = $($("#words .word")[wordIndex]);
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
    // hover: {
    //   mode: 'x',
    //   intersect: false
    // },
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
      annotations: [
        {
          enabled: false,
          type: "line",
          mode: "horizontal",
          scaleID: "wpm",
          value: "-30",
          borderColor: "red",
          borderWidth: 1,
          borderDash: [2, 2],
          label: {
            // Background color of label, default below
            backgroundColor: "blue",
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
        },
      ],
    },
  },
});
