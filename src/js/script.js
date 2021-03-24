//test timer
let time = 0;
let timer = null;

//ui
let pageTransition = false;
let notSignedInLastResult = null;
let verifyUserWhenLoggedIn = null;

///

// let CustomText = "The quick brown fox jumps over the lazy dog".split(" ");
// let CustomText.isWordRandom = false;
// let CustomText.word = 1;

async function activateFunbox(funbox, mode) {
  if (TestLogic.active || TestUI.resultVisible) {
    Notifications.add(
      "You can only change the funbox before starting a test.",
      0
    );
    return false;
  }
  if (Misc.getCurrentLanguage().ligatures) {
    if (funbox == "choo_choo" || funbox == "earthquake") {
      Notifications.add(
        "Current language does not support this funbox mode",
        0
      );
      activateFunbox("none", null);
      return;
    }
  }
  $("#funBoxTheme").attr("href", ``);
  $("#words").removeClass("nospace");
  // if (funbox === "none") {

  Funbox.reset();

  $("#wordsWrapper").removeClass("hidden");
  // }

  if (mode === null || mode === undefined) {
    let list = await Misc.getFunboxList();
    mode = list.filter((f) => f.name === funbox)[0].type;
  }

  ManualRestart.set();
  if (mode === "style") {
    if (funbox != undefined) {
      $("#funBoxTheme").attr("href", `funbox/${funbox}.css`);
      Funbox.setActive(funbox);
    }

    if (funbox === "simon_says") {
      setKeymapMode("next");
      settingsGroups.keymapMode.updateButton();
      restartTest();
    }

    if (
      funbox === "read_ahead" ||
      funbox === "read_ahead_easy" ||
      funbox === "read_ahead_hard"
    ) {
      setHighlightMode("letter", true);
      restartTest();
    }
  } else if (mode === "script") {
    if (funbox === "tts") {
      $("#funBoxTheme").attr("href", `funbox/simon_says.css`);
      ConfigSet.keymapMode("off");
      settingsGroups.keymapMode.updateButton();
      restartTest();
    } else if (funbox === "layoutfluid") {
      ConfigSet.keymapMode("on");
      setKeymapMode("next");
      settingsGroups.keymapMode.updateButton();
      ConfigSet.savedLayout(Config.layout);
      setLayout("qwerty");
      settingsGroups.layout.updateButton();
      setKeymapLayout("qwerty");
      settingsGroups.keymapLayout.updateButton();
      restartTest();
    } else if (funbox === "memory") {
      setMode("words");
      setShowAllLines(true, true);
      restartTest(false, true);
      if (Config.keymapMode === "next") {
        setKeymapMode("react");
      }
    } else if (funbox === "nospace") {
      $("#words").addClass("nospace");
      setHighlightMode("letter", true);
      restartTest(false, true);
    }
    Funbox.setActive(funbox);
  }

  if (funbox !== "layoutfluid" || mode !== "script") {
    if (Config.layout !== Config.savedLayout) {
      setLayout(Config.savedLayout);
      settingsGroups.layout.updateButton();
    }
  }
  TestUI.updateModesNotice();
  return true;
}

function getuid() {
  console.error("Only share this uid with Miodec and nobody else!");
  console.log(firebase.auth().currentUser.uid);
  console.error("Only share this uid with Miodec and nobody else!");
}

async function initWords() {
  TestLogic.setActive(false);
  TestLogic.words.reset();
  TestUI.setCurrentWordElementIndex(0);
  // accuracy = {
  //   correct: 0,
  //   incorrect: 0,
  // };

  TestLogic.input.resetHistory();
  TestLogic.input.resetCurrent();

  let language = await Misc.getLanguage(Config.language);
  if (language && language.name !== Config.language) {
    ConfigSet.language("english");
  }

  if (!language) {
    ConfigSet.language("english");
    language = await Misc.getLanguage(Config.language);
  }

  if (
    Config.mode == "time" ||
    Config.mode == "words" ||
    Config.mode == "custom"
  ) {
    let wordsBound = 100;
    if (Config.showAllLines) {
      if (Config.mode === "custom") {
        if (CustomText.isWordRandom) {
          wordsBound = CustomText.word;
        } else if (CustomText.isTimeRandom) {
          wordsBound = 100;
        } else {
          wordsBound = CustomText.text.length;
        }
      } else if (Config.mode != "time") {
        wordsBound = Config.words;
      }
    } else {
      if (Config.mode === "words" && Config.words < wordsBound) {
        wordsBound = Config.words;
      }
      if (
        Config.mode == "custom" &&
        CustomText.isWordRandom &&
        CustomText.word < wordsBound
      ) {
        wordsBound = CustomText.word;
      }
      if (
        Config.mode == "custom" &&
        CustomText.isTimeRandom &&
        CustomText.time < wordsBound
      ) {
        wordsBound = 100;
      }
      if (
        Config.mode == "custom" &&
        !CustomText.isWordRandom &&
        CustomText.text.length < wordsBound
      ) {
        wordsBound = CustomText.text.length;
      }
    }

    if (
      (Config.mode === "custom" &&
        CustomText.isWordRandom &&
        CustomText.word == 0) ||
      (Config.mode === "custom" &&
        CustomText.isTimeRandom &&
        CustomText.time == 0)
    ) {
      wordsBound = 100;
    }

    if (Config.mode === "words" && Config.words === 0) {
      wordsBound = 100;
    }
    if (Funbox.active === "plus_one") {
      wordsBound = 2;
    }
    let wordset = language.words;
    if (Config.mode == "custom") {
      wordset = CustomText.text;
    }
    for (let i = 0; i < wordsBound; i++) {
      let randomWord = wordset[Math.floor(Math.random() * wordset.length)];
      const previousWord = TestLogic.words.get(i - 1);
      const previousWord2 = TestLogic.words.get(i - 2);
      if (
        Config.mode == "custom" &&
        (CustomText.isWordRandom || CustomText.isTimeRandom)
      ) {
        randomWord = wordset[Math.floor(Math.random() * wordset.length)];
      } else if (Config.mode == "custom" && !CustomText.isWordRandom) {
        randomWord = CustomText.text[i];
      } else {
        while (
          randomWord == previousWord ||
          randomWord == previousWord2 ||
          (!Config.punctuation && randomWord == "I") ||
          randomWord.indexOf(" ") > -1
        ) {
          randomWord = wordset[Math.floor(Math.random() * wordset.length)];
        }
      }

      if (Funbox.active === "rAnDoMcAsE") {
        let randomcaseword = "";
        for (let i = 0; i < randomWord.length; i++) {
          if (i % 2 != 0) {
            randomcaseword += randomWord[i].toUpperCase();
          } else {
            randomcaseword += randomWord[i];
          }
        }
        randomWord = randomcaseword;
      } else if (Funbox.active === "gibberish") {
        randomWord = Misc.getGibberish();
      } else if (Funbox.active === "58008") {
        setToggleSettings(false, true);
        randomWord = Misc.getNumbers(7);
      } else if (Funbox.active === "specials") {
        setToggleSettings(false, true);
        randomWord = Misc.getSpecials();
      } else if (Funbox.active === "ascii") {
        setToggleSettings(false, true);
        randomWord = Misc.getASCII();
      }

      if (Config.punctuation) {
        randomWord = punctuateWord(previousWord, randomWord, i, wordsBound);
      }
      if (Config.numbers) {
        if (Math.random() < 0.1) {
          randomWord = Misc.getNumbers(4);
        }
      }

      if (/\t/g.test(randomWord)) {
        TestLogic.setHasTab(true);
      }

      TestLogic.words.push(randomWord);
    }
  } else if (Config.mode == "quote") {
    // setLanguage(Config.language.replace(/_\d*k$/g, ""), true);

    let quotes = await Misc.getQuotes(Config.language.replace(/_\d*k$/g, ""));

    if (quotes.length === 0) {
      Notifications.add(
        `No ${Config.language.replace(/_\d*k$/g, "")} quotes found`,
        0
      );
      TestUI.setTestRestarting(false);
      setMode("words");
      restartTest();
      return;
    }

    let rq;
    if (Config.quoteLength != -2) {
      let quoteLengths = Config.quoteLength;
      let groupIndex;
      if (quoteLengths.length > 1) {
        groupIndex =
          quoteLengths[Math.floor(Math.random() * quoteLengths.length)];
        while (quotes.groups[groupIndex].length === 0) {
          groupIndex =
            quoteLengths[Math.floor(Math.random() * quoteLengths.length)];
        }
      } else {
        groupIndex = quoteLengths[0];
        if (quotes.groups[groupIndex].length === 0) {
          Notifications.add("No quotes found for selected quote length", 0);
          TestUI.setTestRestarting(false);
          return;
        }
      }

      rq =
        quotes.groups[groupIndex][
          Math.floor(Math.random() * quotes.groups[groupIndex].length)
        ];
      if (TestLogic.randomQuote != null && rq.id === TestLogic.randomQuote.id) {
        rq =
          quotes.groups[groupIndex][
            Math.floor(Math.random() * quotes.groups[groupIndex].length)
          ];
      }
    } else {
      quotes.groups.forEach((group) => {
        let filtered = group.filter(
          (quote) => quote.id == QuoteSearchPopup.selectedId
        );
        if (filtered.length > 0) {
          rq = filtered[0];
        }
      });
      if (rq == undefined) {
        rq = quotes.groups[0][0];
        Notifications.add("Quote Id Does Not Exist", 0);
      }
    }
    rq.text = rq.text.replace(/ +/gm, " ");
    rq.text = rq.text.replace(/\\\\t/gm, "\t");
    rq.text = rq.text.replace(/\\\\n/gm, "\n");
    rq.text = rq.text.replace(/\\t/gm, "\t");
    rq.text = rq.text.replace(/\\n/gm, "\n");
    rq.text = rq.text.replace(/( *(\r\n|\r|\n) *)/g, "\n ");

    TestLogic.setRandomQuote(rq);

    let w = TestLogic.randomQuote.text.trim().split(" ");
    for (let i = 0; i < w.length; i++) {
      if (/\t/g.test(w[i])) {
        TestLogic.setHasTab(true);
      }
      TestLogic.words.push(w[i]);
    }
  }
  //handle right-to-left languages
  if (language.leftToRight) {
    TestUI.arrangeCharactersLeftToRight();
  } else {
    TestUI.arrangeCharactersRightToLeft();
  }
  if (language.ligatures) {
    $("#words").addClass("withLigatures");
  } else {
    $("#words").removeClass("withLigatures");
  }
  // if (Config.mode == "zen") {
  //   // Creating an empty active word element for zen mode
  //   $("#words").append('<div class="word active"></div>');
  //   $("#words").css("height", "auto");
  //   $("#wordsWrapper").css("height", "auto");
  // } else {
  showWords();
  // }
}

function setToggleSettings(state, nosave) {
  setPunctuation(state, nosave);
  setNumbers(state, nosave);
}

function emulateLayout(event) {
  function emulatedLayoutShouldShiftKey(event, newKeyPreview) {
    if (Config.capsLockBackspace) return event.shiftKey;
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
    if (Config.layout === "default") {
      //override the caps lock modifier for the default layout if needed
      if (Config.capsLockBackspace && Misc.isASCIILetter(newEvent.key)) {
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
    const layoutMap = layouts[Config.layout].keys;

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
    Config.language.split("_")[0] != "code"
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
      if (Config.language.split("_")[0] == "french") {
        word = "?";
      } else {
        word += "?";
      }
    } else {
      if (Config.language.split("_")[0] == "french") {
        word = "!";
      } else {
        word += "!";
      }
    }
  } else if (
    Math.random() < 0.01 &&
    Misc.getLastChar(previousWord) != "," &&
    Misc.getLastChar(previousWord) != "." &&
    Config.language.split("_")[0] !== "russian"
  ) {
    word = `"${word}"`;
  } else if (
    Math.random() < 0.011 &&
    Misc.getLastChar(previousWord) != "," &&
    Misc.getLastChar(previousWord) != "." &&
    Config.language.split("_")[0] !== "russian"
  ) {
    word = `'${word}'`;
  } else if (
    Math.random() < 0.012 &&
    Misc.getLastChar(previousWord) != "," &&
    Misc.getLastChar(previousWord) != "."
  ) {
    if (Config.language.split("_")[0] == "code") {
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
  } else if (Math.random() < 0.013) {
    if (Config.language.split("_")[0] == "french") {
      word = ":";
    } else {
      word += ":";
    }
  } else if (
    Math.random() < 0.014 &&
    Misc.getLastChar(previousWord) != "," &&
    Misc.getLastChar(previousWord) != "." &&
    previousWord != "-"
  ) {
    word = "-";
  } else if (
    Math.random() < 0.015 &&
    Misc.getLastChar(previousWord) != "," &&
    Misc.getLastChar(previousWord) != "." &&
    Misc.getLastChar(previousWord) != ";"
  ) {
    if (Config.language.split("_")[0] == "french") {
      word = ";";
    } else {
      word += ";";
    }
  } else if (Math.random() < 0.2 && Misc.getLastChar(previousWord) != ",") {
    word += ",";
  } else if (Math.random() < 0.25 && Config.language.split("_")[0] == "code") {
    let specials = ["{", "}", "[", "]", "(", ")", ";", "=", "%", "/"];

    word = specials[Math.floor(Math.random() * 10)];
  }
  return word;
}

function addWord() {
  let bound = 100;
  if (Funbox.active === "plus_one") bound = 1;
  if (
    TestLogic.words.length - TestLogic.input.history.length > bound ||
    (Config.mode === "words" &&
      TestLogic.words.length >= Config.words &&
      Config.words > 0) ||
    (Config.mode === "custom" &&
      CustomText.isWordRandom &&
      TestLogic.words.length >= CustomText.word &&
      CustomText.word != 0) ||
    (Config.mode === "custom" &&
      !CustomText.isWordRandom &&
      TestLogic.words.length >= CustomText.text.length)
  )
    return;
  const language =
    Config.mode !== "custom"
      ? Misc.getCurrentLanguage()
      : {
          //borrow the direction of the current language
          leftToRight: Misc.getCurrentLanguage().leftToRight,
          words: CustomText.text,
        };
  const wordset = language.words;
  let randomWord = wordset[Math.floor(Math.random() * wordset.length)];
  const previousWord = TestLogic.words.getLast();
  const previousWordStripped = previousWord
    .replace(/[.?!":\-,]/g, "")
    .toLowerCase();
  const previousWord2Stripped = TestLogic.words
    .get(TestLogic.words.length - 2)
    .replace(/[.?!":\-,]/g, "")
    .toLowerCase();

  if (
    Config.mode === "custom" &&
    CustomText.isWordRandom &&
    wordset.length < 3
  ) {
    randomWord = wordset[Math.floor(Math.random() * wordset.length)];
  } else if (Config.mode == "custom" && !CustomText.isWordRandom) {
    randomWord = CustomText.text[TestLogic.words.length];
  } else {
    while (
      previousWordStripped == randomWord ||
      previousWord2Stripped == randomWord ||
      randomWord.indexOf(" ") > -1 ||
      (!Config.punctuation && randomWord == "I")
    ) {
      randomWord = wordset[Math.floor(Math.random() * wordset.length)];
    }
  }

  if (Funbox.active === "rAnDoMcAsE") {
    let randomcaseword = "";
    for (let i = 0; i < randomWord.length; i++) {
      if (i % 2 != 0) {
        randomcaseword += randomWord[i].toUpperCase();
      } else {
        randomcaseword += randomWord[i];
      }
    }
    randomWord = randomcaseword;
  } else if (Funbox.active === "gibberish") {
    randomWord = Misc.getGibberish();
  } else if (Funbox.active === "58008") {
    randomWord = Misc.getNumbers(7);
  } else if (Funbox.active === "specials") {
    randomWord = Misc.getSpecials();
  } else if (Funbox.active === "ascii") {
    randomWord = Misc.getASCII();
  }

  if (Config.punctuation && Config.mode != "custom") {
    randomWord = punctuateWord(
      previousWord,
      randomWord,
      TestLogic.words.length,
      0
    );
  }
  if (Config.numbers && Config.mode != "custom") {
    if (Math.random() < 0.1) {
      randomWord = Misc.getNumbers(4);
    }
  }

  TestLogic.words.push(randomWord);

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
  let newlineafter = false;
  if (Config.mode !== "zen") {
    for (let i = 0; i < TestLogic.words.length; i++) {
      newlineafter = false;
      wordsHTML += `<div class='word'>`;
      for (let c = 0; c < TestLogic.words.get(i).length; c++) {
        if (TestLogic.words.get(i).charAt(c) === "\t") {
          wordsHTML += `<letter class='tabChar'><i class="fas fa-long-arrow-alt-right"></i></letter>`;
        } else if (TestLogic.words.get(i).charAt(c) === "\n") {
          newlineafter = true;
          wordsHTML += `<letter class='nlChar'><i class="fas fa-angle-down"></i></letter>`;
        } else {
          wordsHTML +=
            "<letter>" + TestLogic.words.get(i).charAt(c) + "</letter>";
        }
      }
      wordsHTML += "</div>";
      if (newlineafter) wordsHTML += "<div class='newline'></div>";
    }
  } else {
    wordsHTML =
      '<div class="word">word height</div><div class="word active"></div>';
  }

  $("#words").html(wordsHTML);

  $("#wordsWrapper").removeClass("hidden");
  const wordHeight = $(document.querySelector(".word")).outerHeight(true);
  const wordsHeight = $(document.querySelector("#words")).outerHeight(true);
  if (
    Config.showAllLines &&
    Config.mode != "time" &&
    !(CustomText.isWordRandom && CustomText.word == 0) &&
    !CustomText.isTimeRandom
  ) {
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

  if (Config.mode === "zen") {
    $(document.querySelector(".word")).remove();
  } else {
    if (Config.keymapMode === "next") {
      Keymap.highlightKey(
        TestLogic.words
          .getCurrent()
          .substring(
            TestLogic.input.current.length,
            TestLogic.input.current.length + 1
          )
          .toString()
          .toUpperCase()
      );
    }
  }

  TestUI.updateActiveElement();
  Funbox.toggleScript(TestLogic.words.getCurrent());

  Caret.updatePosition();
}

(function (history) {
  var pushState = history.pushState;
  history.pushState = function (state) {
    if (Funbox.active === "memory" && state !== "/") {
      Funbox.resetMemoryTimer();
    }
    return pushState.apply(history, arguments);
  };
})(window.history);

function highlightBadWord(index, showError) {
  if (!showError) return;
  $($("#words .word")[index]).addClass("error");
}

function countChars() {
  let correctWordChars = 0;
  let correctChars = 0;
  let incorrectChars = 0;
  let extraChars = 0;
  let missedChars = 0;
  let spaces = 0;
  let correctspaces = 0;
  for (let i = 0; i < TestLogic.input.history.length; i++) {
    let word =
      Config.mode == "zen"
        ? TestLogic.input.getHistory(i)
        : TestLogic.words.get(i);
    if (TestLogic.input.getHistory(i) === "") {
      //last word that was not started
      continue;
    }
    if (TestLogic.input.getHistory(i) == word) {
      //the word is correct
      correctWordChars += word.length;
      correctChars += word.length;
      if (
        i < TestLogic.input.history.length - 1 &&
        Misc.getLastChar(TestLogic.input.getHistory(i)) !== "\n"
      ) {
        correctspaces++;
      }
    } else if (TestLogic.input.getHistory(i).length >= word.length) {
      //too many chars
      for (let c = 0; c < TestLogic.input.getHistory(i).length; c++) {
        if (c < word.length) {
          //on char that still has a word list pair
          if (TestLogic.input.getHistory(i)[c] == word[c]) {
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
      for (let c = 0; c < word.length; c++) {
        if (c < TestLogic.input.getHistory(i).length) {
          //on char that still has a word list pair
          if (TestLogic.input.getHistory(i)[c] == word[c]) {
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
      if (i === TestLogic.input.history.length - 1 && Config.mode == "time") {
        //last word - check if it was all correct - add to correct word chars
        if (toAdd.incorrect === 0) correctWordChars += toAdd.correct;
      } else {
        missedChars += toAdd.missed;
      }
    }
    if (i < TestLogic.input.history.length - 1) {
      spaces++;
    }
  }
  if (Funbox.active === "nospace") {
    spaces = 0;
    correctspaces = 0;
  }
  return {
    spaces: spaces,
    correctWordChars: correctWordChars,
    allCorrectChars: correctChars,
    incorrectChars:
      Config.mode == "zen" ? TestStats.accuracy.incorrect : incorrectChars,
    extraChars: extraChars,
    missedChars: missedChars,
    correctSpaces: correctspaces,
  };
}

function calculateStats() {
  let testSeconds = TestStats.calculateTestSeconds();
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
  let acc = Misc.roundTo2(TestStats.calculateAccuracy());
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
  TestLogic.input.pushHistory();
  TestLogic.corrected.pushHistory();
  TestStats.pushKeypressesToHistory();
  TestStats.setLastSecondNotRound();
  showResult(true);
  let testSeconds = TestStats.calculateTestSeconds(performance.now());
  let afkseconds = TestStats.calculateAfkSeconds();
  TestStats.incrementIncompleteSeconds(testSeconds - afkseconds);
  TestStats.incrementRestartCount();
}

function showResult(difficultyFailed = false) {
  if (!TestLogic.active) return;
  if (Config.mode == "zen" && TestLogic.input.current.length != 0) {
    TestLogic.input.pushHistory();
    TestLogic.corrected.pushHistory();
  }

  TestStats.recordKeypressSpacing();

  TestUI.setResultCalculating(true);
  TestUI.setResultVisible(true);
  TestStats.setEnd(performance.now());
  TestLogic.setActive(false);
  Focus.set(false);
  Caret.hide();
  LiveWpm.hide();
  hideCrown();
  LiveAcc.hide();
  TimerProgress.hide();
  Keymap.hide();
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
  let afkseconds = TestStats.calculateAfkSeconds();
  let afkSecondsPercent = Misc.roundTo2((afkseconds / testtime) * 100);

  ChartController.result.options.annotation.annotations = [];

  $("#result #resultWordsHistory").addClass("hidden");

  if (Config.alwaysShowDecimalPlaces) {
    if (Config.alwaysShowCPM == false) {
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
    if (Config.alwaysShowCPM == false) {
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
  OutOfFocus.hide();
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
  if (Config.mode === "time") {
    mode2 = Config.time;
  } else if (Config.mode === "words") {
    mode2 = Config.words;
  } else if (Config.mode === "custom") {
    mode2 = "custom";
  } else if (Config.mode === "quote") {
    mode2 = TestLogic.randomQuote.id;
  } else if (Config.mode === "zen") {
    mode2 = "zen";
  }

  if (TestStats.lastSecondNotRound) {
    let wpmAndRaw = liveWpmAndRaw();
    TestStats.pushToWpmHistory(wpmAndRaw.wpm);
    TestStats.pushToRawHistory(wpmAndRaw.raw);
    TestStats.pushKeypressesToHistory();
    // errorsPerSecond.push(currentError);
    // currentError = {
    //   count: 0,
    //   words: [],
    // };
  }

  let labels = [];
  for (let i = 1; i <= TestStats.wpmHistory.length; i++) {
    if (TestStats.lastSecondNotRound && i === TestStats.wpmHistory.length) {
      labels.push(Misc.roundTo2(testtime).toString());
    } else {
      labels.push(i.toString());
    }
  }

  ChartController.result.updateColors();

  ChartController.result.data.labels = labels;

  let rawWpmPerSecondRaw = TestStats.keypressPerSecond.map((f) =>
    Math.round((f.count / 5) * 60)
  );

  let rawWpmPerSecond = Misc.smooth(rawWpmPerSecondRaw, 1);

  let stddev = Misc.stdDev(rawWpmPerSecondRaw);
  let avg = Misc.mean(rawWpmPerSecondRaw);

  let consistency = Misc.roundTo2(Misc.kogasa(stddev / avg));
  let keyConsistency = Misc.roundTo2(
    Misc.kogasa(
      Misc.stdDev(TestStats.keypressTimings.spacing.array) /
        Misc.mean(TestStats.keypressTimings.spacing.array)
    )
  );

  if (isNaN(consistency)) {
    consistency = 0;
  }

  if (Config.alwaysShowDecimalPlaces) {
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

  ChartController.result.data.datasets[0].data = TestStats.wpmHistory;
  ChartController.result.data.datasets[1].data = rawWpmPerSecond;

  let maxChartVal = Math.max(
    ...[Math.max(...rawWpmPerSecond), Math.max(...TestStats.wpmHistory)]
  );
  if (!Config.startGraphsAtZero) {
    ChartController.result.options.scales.yAxes[0].ticks.min = Math.min(
      ...TestStats.wpmHistory
    );
    ChartController.result.options.scales.yAxes[1].ticks.min = Math.min(
      ...TestStats.wpmHistory
    );
  } else {
    ChartController.result.options.scales.yAxes[0].ticks.min = 0;
    ChartController.result.options.scales.yAxes[1].ticks.min = 0;
  }

  // let errorsNoZero = [];

  // for (let i = 0; i < errorsPerSecond.length; i++) {
  //   errorsNoZero.push({
  //     x: i + 1,
  //     y: errorsPerSecond[i].count,
  //   });
  // }

  let errorsArray = [];
  for (let i = 0; i < TestStats.keypressPerSecond.length; i++) {
    errorsArray.push(TestStats.keypressPerSecond[i].errors);
  }

  ChartController.result.data.datasets[2].data = errorsArray;

  let kps = TestStats.keypressPerSecond.slice(
    Math.max(TestStats.keypressPerSecond.length - 5, 0)
  );

  kps = kps.map((a) => a.count);

  kps = kps.reduce((a, b) => a + b, 0);

  let afkDetected = kps === 0 ? true : false;

  if (TestLogic.bailout) afkDetected = false;

  $("#result .stats .tags").addClass("hidden");

  let lang = Config.language;

  let quoteLength = -1;
  if (Config.mode === "quote") {
    quoteLength = TestLogic.randomQuote.group;
    lang = Config.language.replace(/_\d*k$/g, "");
  }

  if (difficultyFailed) {
    Notifications.add("Test failed", 0, 1);
  } else if (afkDetected) {
    Notifications.add("Test invalid - AFK detected", 0);
  } else if (TestLogic.isRepeated) {
    Notifications.add("Test invalid - repeated", 0);
  } else if (
    (Config.mode === "time" && mode2 < 15 && mode2 > 0) ||
    (Config.mode === "time" && mode2 == 0 && testtime < 15) ||
    (Config.mode === "words" && mode2 < 10 && mode2 > 0) ||
    (Config.mode === "words" && mode2 == 0 && testtime < 15) ||
    (Config.mode === "custom" &&
      !CustomText.isWordRandom &&
      !CustomText.isTimeRandom &&
      CustomText.text.length < 10) ||
    (Config.mode === "custom" &&
      CustomText.isWordRandom &&
      !CustomText.isTimeRandom &&
      CustomText.word < 10) ||
    (Config.mode === "custom" &&
      !CustomText.isWordRandom &&
      CustomText.isTimeRandom &&
      CustomText.time < 15) ||
    (Config.mode === "zen" && testtime < 15)
  ) {
    Notifications.add("Test too short", 0);
  } else {
    let activeTags = [];
    let activeTagsIds = [];
    try {
      DB.getSnapshot().tags.forEach((tag) => {
        if (tag.active === true) {
          activeTags.push(tag);
          activeTagsIds.push(tag.id);
        }
      });
    } catch (e) {}

    let chartData = {
      wpm: TestStats.wpmHistory,
      raw: rawWpmPerSecond,
      err: errorsArray,
    };

    if (testtime > 122) {
      chartData = "toolong";
      TestStats.setKeypressTimingsTooLong();
    }

    let cdata = null;
    if (Config.mode === "custom") {
      cdata = {};
      cdata.textLen = CustomText.text.length;
      cdata.isWordRandom = CustomText.isWordRandom;
      cdata.isTimeRandom = CustomText.isTimeRandom;
      cdata.word =
        CustomText.word !== "" && !isNaN(CustomText.word)
          ? CustomText.word
          : null;
      cdata.time =
        CustomText.time !== "" && !isNaN(CustomText.time)
          ? CustomText.time
          : null;
    }

    let completedEvent = {
      wpm: stats.wpm,
      rawWpm: stats.wpmRaw,
      correctChars: stats.correctChars + stats.correctSpaces,
      incorrectChars: stats.incorrectChars,
      allChars: stats.allChars,
      acc: stats.acc,
      mode: Config.mode,
      mode2: mode2,
      quoteLength: quoteLength,
      punctuation: Config.punctuation,
      numbers: Config.numbers,
      timestamp: Date.now(),
      language: lang,
      restartCount: TestStats.restartCount,
      incompleteTestSeconds:
        TestStats.incompleteSeconds < 0
          ? 0
          : Misc.roundTo2(TestStats.incompleteSeconds),
      difficulty: Config.difficulty,
      testDuration: testtime,
      afkDuration: afkseconds,
      blindMode: Config.blindMode,
      theme: Config.theme,
      tags: activeTagsIds,
      keySpacing: TestStats.keypressTimings.spacing.array,
      keyDuration: TestStats.keypressTimings.duration.array,
      consistency: consistency,
      keyConsistency: keyConsistency,
      funbox: Funbox.active,
      bailedOut: TestLogic.bailout,
      chartData: chartData,
      customText: cdata,
    };

    if (Config.mode !== "custom") {
      delete completedEvent.CustomText;
    }

    if (
      Config.difficulty == "normal" ||
      ((Config.difficulty == "master" || Config.difficulty == "expert") &&
        !difficultyFailed)
    ) {
      // restartCount = 0;
      // incompleteTestSeconds = 0;
      TestStats.resetIncomplete();
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
        AccountIcon.loading(true);
        let dontShowCrown = false;
        let pbDiff = 0;
        DB.getLocalPB(
          Config.mode,
          mode2,
          Config.punctuation,
          Config.language,
          Config.difficulty
        ).then((lpb) => {
          DB.getUserHighestWpm(
            Config.mode,
            mode2,
            Config.punctuation,
            Config.language,
            Config.difficulty
          ).then((highestwpm) => {
            hideCrown();
            $("#result .stats .wpm .crown").attr("aria-label", "");
            if (lpb < stats.wpm && stats.wpm < highestwpm) {
              dontShowCrown = true;
            }
            if (Config.mode == "quote") dontShowCrown = true;
            if (lpb < stats.wpm) {
              //new pb based on local
              pbDiff = Math.abs(stats.wpm - lpb);
              if (!dontShowCrown) {
                showCrown();
                $("#result .stats .wpm .crown").attr(
                  "aria-label",
                  "+" + Misc.roundTo2(pbDiff)
                );
              }
            }
            if (lpb > 0) {
              ChartController.result.options.annotation.annotations.push({
                enabled: false,
                type: "line",
                mode: "horizontal",
                scaleID: "wpm",
                value: lpb,
                borderColor: ThemeColors.sub,
                borderWidth: 1,
                borderDash: [2, 2],
                label: {
                  backgroundColor: ThemeColors.sub,
                  fontFamily: Config.fontFamily.replace(/_/g, " "),
                  fontSize: 11,
                  fontStyle: "normal",
                  fontColor: ThemeColors.bg,
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
              ChartController.result.options.scales.yAxes[0].ticks.max = Math.round(
                maxChartVal
              );
              ChartController.result.options.scales.yAxes[1].ticks.max = Math.round(
                maxChartVal
              );
              ChartController.result.update({ duration: 0 });
            }

            if (activeTags.length == 0) {
              $("#result .stats .tags").addClass("hidden");
            } else {
              $("#result .stats .tags").removeClass("hidden");
            }
            $("#result .stats .tags .bottom").text("");
            let annotationSide = "left";
            activeTags.forEach(async (tag) => {
              let tpb = await DB.getLocalTagPB(
                tag.id,
                Config.mode,
                mode2,
                Config.punctuation,
                Config.language,
                Config.difficulty
              );
              $("#result .stats .tags .bottom").append(`
                <div tagid="${tag.id}" aria-label="PB: ${tpb}" data-balloon-pos="up">${tag.name}<i class="fas fa-crown hidden"></i></div>
              `);
              if (Config.mode != "quote") {
                if (tpb < stats.wpm) {
                  //new pb for that tag
                  DB.saveLocalTagPB(
                    tag.id,
                    Config.mode,
                    mode2,
                    Config.punctuation,
                    Config.language,
                    Config.difficulty,
                    stats.wpm,
                    stats.acc,
                    stats.wpmRaw,
                    consistency
                  );
                  $(
                    `#result .stats .tags .bottom div[tagid="${tag.id}"] .fas`
                  ).removeClass("hidden");
                  $(`#result .stats .tags .bottom div[tagid="${tag.id}"]`).attr(
                    "aria-label",
                    "+" + Misc.roundTo2(stats.wpm - tpb)
                  );
                  // console.log("new pb for tag " + tag.name);
                } else {
                  ChartController.result.options.annotation.annotations.push({
                    enabled: false,
                    type: "line",
                    mode: "horizontal",
                    scaleID: "wpm",
                    value: tpb,
                    borderColor: ThemeColors.sub,
                    borderWidth: 1,
                    borderDash: [2, 2],
                    label: {
                      backgroundColor: ThemeColors.sub,
                      fontFamily: Config.fontFamily.replace(/_/g, " "),
                      fontSize: 11,
                      fontStyle: "normal",
                      fontColor: ThemeColors.bg,
                      xPadding: 6,
                      yPadding: 6,
                      cornerRadius: 3,
                      position: annotationSide,
                      enabled: true,
                      content: `${tag.name} PB: ${tpb}`,
                    },
                  });
                  if (annotationSide === "left") {
                    annotationSide = "right";
                  } else {
                    annotationSide = "left";
                  }
                }
              }
            });
            if (
              completedEvent.funbox === "none" &&
              completedEvent.language === "english" &&
              completedEvent.mode === "time" &&
              ["15", "60"].includes(String(completedEvent.mode2))
            ) {
              $("#result .stats .leaderboards").removeClass("hidden");
              $("#result .stats .leaderboards .bottom").html(
                `checking <i class="fas fa-spin fa-fw fa-circle-notch"></i>`
              );
            }
            CloudFunctions.testCompleted({
              uid: firebase.auth().currentUser.uid,
              obj: completedEvent,
            })
              .then((e) => {
                AccountIcon.loading(false);
                if (e.data == null) {
                  Notifications.add(
                    "Unexpected response from the server: " + e.data,
                    -1
                  );
                  return;
                }
                if (e.data.resultCode === -1) {
                  Notifications.add("Could not save result", -1);
                } else if (e.data.resultCode === -2) {
                  Notifications.add(
                    "Possible bot detected. Result not saved.",
                    -1
                  );
                } else if (e.data.resultCode === -3) {
                  Notifications.add(
                    "Could not verify keypress stats. Result not saved.",
                    -1
                  );
                } else if (e.data.resultCode === -4) {
                  Notifications.add(
                    "Result data does not make sense. Result not saved.",
                    -1
                  );
                } else if (e.data.resultCode === -5) {
                  Notifications.add("Test too short. Result not saved.", -1);
                } else if (e.data.resultCode === -999) {
                  console.error("internal error: " + e.data.message);
                  Notifications.add(
                    "Internal error. Result might not be saved. " +
                      e.data.message,
                    -1
                  );
                } else if (e.data.resultCode === 1 || e.data.resultCode === 2) {
                  completedEvent.id = e.data.createdId;
                  TestLeaderboards.check(completedEvent);
                  if (e.data.resultCode === 2) {
                    completedEvent.isPb = true;
                  }
                  if (
                    DB.getSnapshot() !== null &&
                    DB.getSnapshot().results !== undefined
                  ) {
                    DB.getSnapshot().results.unshift(completedEvent);
                    if (DB.getSnapshot().globalStats.time == undefined) {
                      DB.getSnapshot().globalStats.time =
                        testtime +
                        completedEvent.incompleteTestSeconds -
                        afkseconds;
                    } else {
                      DB.getSnapshot().globalStats.time +=
                        testtime +
                        completedEvent.incompleteTestSeconds -
                        afkseconds;
                    }
                    if (DB.getSnapshot().globalStats.started == undefined) {
                      DB.getSnapshot().globalStats.started =
                        TestStats.restartCount + 1;
                    } else {
                      DB.getSnapshot().globalStats.started +=
                        TestStats.restartCount + 1;
                    }
                    if (DB.getSnapshot().globalStats.completed == undefined) {
                      DB.getSnapshot().globalStats.completed = 1;
                    } else {
                      DB.getSnapshot().globalStats.completed += 1;
                    }
                  }
                  try {
                    firebase
                      .analytics()
                      .logEvent("testCompleted", completedEvent);
                  } catch (e) {
                    console.log("Analytics unavailable");
                  }

                  if (e.data.resultCode === 2) {
                    //new pb
                    showCrown();
                    DB.saveLocalPB(
                      Config.mode,
                      mode2,
                      Config.punctuation,
                      Config.language,
                      Config.difficulty,
                      stats.wpm,
                      stats.acc,
                      stats.wpmRaw,
                      consistency
                    );
                  } else if (e.data.resultCode === 1) {
                    hideCrown();
                    // if (localPb) {
                    //   Notifications.add(
                    //     "Local PB data is out of sync! Refresh the page to resync it or contact Miodec on Discord.",
                    //     15000
                    //   );
                    // }
                  }
                }
              })
              .catch((e) => {
                AccountIcon.loading(false);
                console.error(e);
                Notifications.add("Could not save result. " + e, -1);
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
      Notifications.add("Test invalid", 0);
      TestStats.setInvalid();
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

  if (Config.mode === "quote") {
    let qlen = "";
    if (Config.quoteLength === 0) {
      qlen = "short ";
    } else if (Config.quoteLength === 1) {
      qlen = "medium ";
    } else if (Config.quoteLength === 2) {
      qlen = "long ";
    } else if (Config.quoteLength === 3) {
      qlen = "thicc ";
    }
    testType += qlen + Config.mode;
  } else {
    testType += Config.mode;
  }
  if (Config.mode == "time") {
    testType += " " + Config.time;
  } else if (Config.mode == "words") {
    testType += " " + Config.words;
  }
  if (
    Config.mode != "custom" &&
    Funbox.active !== "gibberish" &&
    Funbox.active !== "58008"
  ) {
    testType += "<br>" + lang;
  }
  if (Config.punctuation) {
    testType += "<br>punctuation";
  }
  if (Config.numbers) {
    testType += "<br>numbers";
  }
  if (Config.blindMode) {
    testType += "<br>blind";
  }
  if (Funbox.active !== "none") {
    testType += "<br>" + Funbox.active.replace(/_/g, " ");
  }
  if (Config.difficulty == "expert") {
    testType += "<br>expert";
  } else if (Config.difficulty == "master") {
    testType += "<br>master";
  }

  $("#result .stats .testType .bottom").html(testType);

  let otherText = "";
  if (Config.layout !== "default") {
    otherText += "<br>" + Config.layout;
  }
  if (difficultyFailed) {
    otherText += "<br>failed";
  }
  if (afkDetected) {
    otherText += "<br>afk detected";
  }
  if (TestStats.invalid) {
    otherText += "<br>invalid";
  }
  if (TestLogic.isRepeated) {
    otherText += "<br>repeated";
  }
  if (TestLogic.bailout) {
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

  if (Config.mode === "quote") {
    $("#result .stats .source").removeClass("hidden");
    $("#result .stats .source .bottom").html(TestLogic.randomQuote.source);
  } else {
    $("#result .stats .source").addClass("hidden");
  }

  ChartController.result.options.scales.yAxes[0].ticks.max = maxChartVal;
  ChartController.result.options.scales.yAxes[1].ticks.max = maxChartVal;

  ChartController.result.update({ duration: 0 });
  ChartController.result.resize();
  swapElements($("#typingTest"), $("#result"), 250, () => {
    TestUI.setResultCalculating(false);
    $("#words").empty();
    ChartController.result.resize();
    if (Config.alwaysShowWordsHistory) {
      toggleResultWordsDisplay();
    }
  });
}

function startTest() {
  if (pageTransition) {
    return false;
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
  TestLogic.setActive(true);
  TestStats.setStart(performance.now());
  TestStats.resetKeypressTimings();
  TimerProgress.restart();
  TimerProgress.show();
  $("#liveWpm").text("0");
  LiveWpm.show();
  LiveAcc.show();
  TimerProgress.update(time);
  clearTimeout(timer);

  if (Funbox.active === "memory") {
    Funbox.resetMemoryTimer();
    $("#wordsWrapper").addClass("hidden");
  }

  try {
    if (Config.paceCaret !== "off") PaceCaret.start();
  } catch (e) {}
  //use a recursive self-adjusting timer to avoid time drift
  const stepIntervalMS = 1000;
  (function loop(expectedStepEnd) {
    const delay = expectedStepEnd - performance.now();
    timer = setTimeout(function () {
      time++;
      $(".pageTest #premidSecondsLeft").text(Config.time - time);
      if (
        Config.mode === "time" ||
        (Config.mode === "custom" && CustomText.isTimeRandom)
      ) {
        TimerProgress.update(time);
      }
      let wpmAndRaw = liveWpmAndRaw();
      LiveWpm.update(wpmAndRaw.wpm, wpmAndRaw.raw);
      TestStats.pushToWpmHistory(wpmAndRaw.wpm);
      TestStats.pushToRawHistory(wpmAndRaw.raw);
      Monkey.updateFastOpacity(wpmAndRaw.wpm);

      let acc = Misc.roundTo2(TestStats.calculateAccuracy());

      if (Funbox.active === "layoutfluid" && Config.mode === "time") {
        const layouts = ["qwerty", "dvorak", "colemak"];
        let index = 0;
        index = Math.floor(time / (Config.time / 3));

        if (
          time == Math.floor(Config.time / 3) - 3 ||
          time == (Config.time / 3) * 2 - 3
        ) {
          Notifications.add("3", 0, 1);
        }
        if (
          time == Math.floor(Config.time / 3) - 2 ||
          time == Math.floor(Config.time / 3) * 2 - 2
        ) {
          Notifications.add("2", 0, 1);
        }
        if (
          time == Math.floor(Config.time / 3) - 1 ||
          time == Math.floor(Config.time / 3) * 2 - 1
        ) {
          Notifications.add("1", 0, 1);
        }

        if (Config.layout !== layouts[index] && layouts[index] !== undefined) {
          Notifications.add(`--- !!! ${layouts[index]} !!! ---`, 0);
        }
        setLayout(layouts[index]);
        setKeymapLayout(layouts[index]);
        Keymap.highlightKey(
          TestLogic.words
            .getCurrent()
            .substring(
              TestLogic.input.current.length,
              TestLogic.input.current.length + 1
            )
            .toString()
            .toUpperCase()
        );
        settingsGroups.layout.updateButton();
      }

      TestStats.pushKeypressesToHistory();
      if (
        (Config.minWpm === "custom" &&
          wpmAndRaw.wpm < parseInt(Config.minWpmCustomSpeed) &&
          TestLogic.words.currentIndex > 3) ||
        (Config.minAcc === "custom" && acc < parseInt(Config.minAccCustom))
      ) {
        clearTimeout(timer);
        failTest();
        return;
      }
      if (
        Config.mode == "time" ||
        (Config.mode === "custom" && CustomText.isTimeRandom)
      ) {
        if (
          (time >= Config.time &&
            Config.time !== 0 &&
            Config.mode === "time") ||
          (time >= CustomText.time &&
            CustomText.time !== 0 &&
            Config.mode === "custom")
        ) {
          //times up
          clearTimeout(timer);
          Caret.hide();
          TestLogic.input.pushHistory();
          TestLogic.corrected.pushHistory();
          showResult();
          return;
        }
      }
      loop(expectedStepEnd + stepIntervalMS);
    }, delay);
  })(TestStats.start + stepIntervalMS);
  return true;
}

function restartTest(withSameWordset = false, nosave = false, event) {
  // if (!manualRestart) {
  //   if (
  //     (Config.mode === "words" && Config.words < 1000 && Config.words > 0) ||
  //     (Config.mode === "time" && Config.time < 3600 && Config.time > 0) ||
  //     Config.mode === "quote" ||
  //     (Config.mode === "custom" &&
  //       CustomText.isWordRandom &&
  //       CustomText.word < 1000 &&
  //       CustomText.word != 0) ||
  //     (Config.mode === "custom" &&
  //       CustomText.isTimeRandom &&
  //       CustomText.time < 3600 &&
  //       CustomText.time != 0) ||
  //     (Config.mode === "custom" &&
  //       !CustomText.isWordRandom &&
  //       CustomText.text.length < 1000)
  //   ) {
  //   } else {
  //     if (TestLogic.active) {
  //       Notifications.add(
  //         "Restart disabled for long tests. Use your mouse to confirm.",
  //         0
  //       );
  //       return;
  //     }
  //   }
  // }

  if (TestUI.testRestarting || TestUI.resultCalculating) {
    try {
      event.preventDefault();
    } catch {}
    return;
  }
  if ($(".pageTest").hasClass("active") && !TestUI.resultVisible) {
    if (!ManualRestart.get()) {
      if (TestLogic.hasTab) {
        try {
          if (!event.shiftKey) return;
        } catch {}
      }
      try {
        if (Config.mode !== "zen") event.preventDefault();
      } catch {}
      if (
        !Misc.canQuickRestart(
          Config.mode,
          Config.words,
          Config.time,
          CustomText
        )
      ) {
        let message = "Use your mouse to confirm.";
        if (Config.quickTab)
          message = "Press shift + tab or use your mouse to confirm.";
        Notifications.add("Quick restart disabled. " + message, 0, 3);
        return;
      }
      // }else{
      //   return;
      // }
    }
  }
  if (TestLogic.active) {
    TestStats.pushKeypressesToHistory();
    let testSeconds = TestStats.calculateTestSeconds(performance.now());
    let afkseconds = TestStats.calculateAfkSeconds();
    // incompleteTestSeconds += ;
    TestStats.incrementIncompleteSeconds(testSeconds - afkseconds);
    TestStats.incrementRestartCount();
    // restartCount++;
  }

  if (Config.mode == "zen") {
    $("#words").empty();
  }

  if (PractiseMissed.before.mode !== null && !withSameWordset) {
    Notifications.add("Reverting to previous settings.", 0);
    setMode(PractiseMissed.before.mode);
    setPunctuation(PractiseMissed.before.punctuation);
    setNumbers(PractiseMissed.before.numbers);
    PractiseMissed.resetBefore();
  }

  ManualRestart.reset();
  clearTimeout(timer);
  time = 0;
  TestStats.restart();
  TestLogic.corrected.reset();
  ShiftTracker.reset();
  Focus.set(false);
  Caret.hide();
  TestLogic.setActive(false);
  LiveWpm.hide();
  LiveAcc.hide();
  TimerProgress.hide();
  TestLogic.setBailout(false);
  PaceCaret.reset();
  $("#showWordHistoryButton").removeClass("loaded");
  focusWords();
  Funbox.resetMemoryTimer();

  TestUI.reset();

  $("#timerNumber").css("opacity", 0);
  let el = null;
  if (TestUI.resultVisible) {
    //results are being displayed
    el = $("#result");
  } else {
    //words are being displayed
    el = $("#typingTest");
  }
  if (TestUI.resultVisible) {
    if (
      Config.randomTheme !== "off" &&
      !pageTransition &&
      !Config.customTheme
    ) {
      ThemeController.randomiseTheme();
    }
  }
  TestUI.setResultVisible(false);
  pageTransition = true;
  TestUI.setTestRestarting(true);
  el.stop(true, true).animate(
    {
      opacity: 0,
    },
    125,
    async () => {
      $("#monkey .fast").stop(true, true).css("opacity", 0);
      $("#monkey").stop(true, true).css({ animationDuration: "0s" });
      $("#typingTest").css("opacity", 0).removeClass("hidden");
      if (!withSameWordset) {
        TestLogic.setRepeated(false);
        TestLogic.setHasTab(false);
        await initWords();
        PaceCaret.init(nosave);
      } else {
        TestLogic.setRepeated(true);
        TestLogic.setActive(false);
        TestLogic.words.resetCurrentIndex();
        TestLogic.input.reset();
        PaceCaret.init();
        showWords();
      }
      if (Config.mode === "quote") {
        TestLogic.setRepeated(false);
      }
      if (Config.keymapMode !== "off") {
        Keymap.show();
      } else {
        Keymap.hide();
      }
      document.querySelector("#miniTimerAndLiveWpm .wpm").innerHTML = "0";
      document.querySelector("#miniTimerAndLiveWpm .acc").innerHTML = "100%";
      document.querySelector("#liveWpm").innerHTML = "0";
      document.querySelector("#liveAcc").innerHTML = "100%";

      if (Funbox.active === "memory") {
        Funbox.startMemoryTimer();
        if (Config.keymapMode === "next") {
          setKeymapMode("react");
        }
      }

      let mode2 = "";
      if (Config.mode === "time") {
        mode2 = Config.time;
      } else if (Config.mode === "words") {
        mode2 = Config.words;
      } else if (Config.mode === "custom") {
        mode2 = "custom";
      } else if (Config.mode === "quote") {
        mode2 = TestLogic.randomQuote.id;
      }
      let fbtext = "";
      if (Funbox.active !== "none") {
        fbtext = " " + Funbox.active;
      }
      $(".pageTest #premidTestMode").text(
        `${Config.mode} ${mode2} ${Config.language}${fbtext}`
      );
      $(".pageTest #premidSecondsLeft").text(Config.time);

      if (Funbox.active === "layoutfluid") {
        setLayout("qwerty");
        settingsGroups.layout.updateButton();
        setKeymapLayout("qwerty");
        settingsGroups.keymapLayout.updateButton();
        Keymap.highlightKey(
          TestLogic.words
            .getCurrent()
            .substring(
              TestLogic.input.current.length,
              TestLogic.input.current.length + 1
            )
            .toString()
            .toUpperCase()
        );
      }

      $("#result").addClass("hidden");
      $("#testModesNotice").removeClass("hidden").css({
        opacity: 1,
      });
      // resetPaceCaret();
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
            TestUI.setTestRestarting(false);
            // resetPaceCaret();
            hideCrown();
            clearTimeout(timer);
            if ($("#commandLineWrapper").hasClass("hidden")) focusWords();
            ChartController.result.update();
            TestUI.updateModesNotice();
            pageTransition = false;
            // console.log(TestStats.incompleteSeconds);
            // console.log(TestStats.restartCount);
          }
        );
    }
  );
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
    // restartCount = 0;
    // incompleteTestSeconds = 0;
    TestStats.resetIncomplete();
    ManualRestart.set();
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
  if (TestUI.testRestarting) return;
  if (mode !== "words" && Funbox.active === "memory") {
    Notifications.add("Memory funbox can only be used with words mode.", 0);
    return;
  }

  ConfigSet.mode(mode);
  $("#top .config .mode .text-button").removeClass("active");
  $("#top .config .mode .text-button[mode='" + mode + "']").addClass("active");
  if (Config.mode == "time") {
    $("#top .config .wordCount").addClass("hidden");
    $("#top .config .time").removeClass("hidden");
    $("#top .config .customText").addClass("hidden");
    $("#top .config .punctuationMode").removeClass("disabled");
    $("#top .config .numbersMode").removeClass("disabled");
    $("#top .config .punctuationMode").removeClass("hidden");
    $("#top .config .numbersMode").removeClass("hidden");
    $("#top .config .quoteLength").addClass("hidden");
  } else if (Config.mode == "words") {
    $("#top .config .wordCount").removeClass("hidden");
    $("#top .config .time").addClass("hidden");
    $("#top .config .customText").addClass("hidden");
    $("#top .config .punctuationMode").removeClass("disabled");
    $("#top .config .numbersMode").removeClass("disabled");
    $("#top .config .punctuationMode").removeClass("hidden");
    $("#top .config .numbersMode").removeClass("hidden");
    $("#top .config .quoteLength").addClass("hidden");
  } else if (Config.mode == "custom") {
    if (
      Funbox.active === "58008" ||
      Funbox.active === "gibberish" ||
      Funbox.active === "ascii"
    ) {
      Funbox.setAcitve("none");
      TestUI.updateModesNotice();
    }
    $("#top .config .wordCount").addClass("hidden");
    $("#top .config .time").addClass("hidden");
    $("#top .config .customText").removeClass("hidden");
    $("#top .config .punctuationMode").removeClass("disabled");
    $("#top .config .numbersMode").removeClass("disabled");
    $("#top .config .punctuationMode").removeClass("hidden");
    $("#top .config .numbersMode").removeClass("hidden");
    $("#top .config .quoteLength").addClass("hidden");
    setPunctuation(false, true);
    setNumbers(false, true);
  } else if (Config.mode == "quote") {
    setToggleSettings(false, nosave);
    $("#top .config .wordCount").addClass("hidden");
    $("#top .config .time").addClass("hidden");
    $("#top .config .customText").addClass("hidden");
    $("#top .config .punctuationMode").addClass("disabled");
    $("#top .config .numbersMode").addClass("disabled");
    $("#top .config .punctuationMode").removeClass("hidden");
    $("#top .config .numbersMode").removeClass("hidden");
    $("#result .stats .source").removeClass("hidden");
    $("#top .config .quoteLength").removeClass("hidden");
  } else if (Config.mode == "zen") {
    $("#top .config .wordCount").addClass("hidden");
    $("#top .config .time").addClass("hidden");
    $("#top .config .customText").addClass("hidden");
    $("#top .config .punctuationMode").addClass("hidden");
    $("#top .config .numbersMode").addClass("hidden");
    $("#top .config .quoteLength").addClass("hidden");
    if (Config.paceCaret != "off") {
      Notifications.add(`Pace caret will not work with zen mode.`, 0);
    }
    // setPaceCaret("off", true);
  }
  if (!nosave) saveConfigToCookie();
}

function liveWpmAndRaw() {
  let chars = 0;
  let correctWordChars = 0;
  let spaces = 0;
  for (let i = 0; i < TestLogic.input.history.length; i++) {
    let word =
      Config.mode == "zen"
        ? TestLogic.input.getHistory(i)
        : TestLogic.words.get(i);
    if (TestLogic.input.getHistory(i) == word) {
      //the word is correct
      //+1 for space
      correctWordChars += word.length;
      if (
        i < TestLogic.input.history.length - 1 &&
        Misc.getLastChar(TestLogic.input.getHistory(i)) !== "\n"
      ) {
        spaces++;
      }
    }
    chars += TestLogic.input.getHistory(i).length;
  }
  if (TestLogic.words.getCurrent() == TestLogic.input.current) {
    correctWordChars += TestLogic.input.current.length;
  }
  if (Funbox.active === "nospace") {
    spaces = 0;
  }
  chars += TestLogic.input.current.length;
  let testSeconds = TestStats.calculateTestSeconds(performance.now());
  let wpm = Math.round(((correctWordChars + spaces) * (60 / testSeconds)) / 5);
  let raw = Math.round(((chars + spaces) * (60 / testSeconds)) / 5);
  return {
    wpm: wpm,
    raw: raw,
  };
}

function toggleResultWordsDisplay() {
  if (TestUI.resultVisible) {
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
  for (let i = 0; i < TestLogic.input.history.length + 2; i++) {
    let input = TestLogic.input.getHistory(i);
    let word = TestLogic.words.get(i);
    let wordEl = "";
    try {
      if (input === "") throw new Error("empty input word");
      if (
        TestLogic.corrected.getHistory(i) !== undefined &&
        TestLogic.corrected.getHistory(i) !== ""
      ) {
        wordEl = `<div class='word' input="${TestLogic.corrected
          .getHistory(i)
          .replace(/"/g, "&quot;")
          .replace(/ /g, "_")}">`;
      } else {
        wordEl = `<div class='word' input="${input
          .replace(/"/g, "&quot;")
          .replace(/ /g, "_")}">`;
      }
      if (i === TestLogic.input.history.length - 1) {
        //last word
        let wordstats = {
          correct: 0,
          incorrect: 0,
          missed: 0,
        };
        let length = Config.mode == "zen" ? input.length : word.length;
        for (let c = 0; c < length; c++) {
          if (c < input.length) {
            //on char that still has a word list pair
            if (Config.mode == "zen" || input[c] == word[c]) {
              wordstats.correct++;
            } else {
              wordstats.incorrect++;
            }
          } else {
            //on char that is extra
            wordstats.missed++;
          }
        }
        if (wordstats.incorrect !== 0 || Config.mode !== "time") {
          if (Config.mode != "zen" && input !== word) {
            wordEl = `<div class='word error' input="${input
              .replace(/"/g, "&quot;")
              .replace(/ /g, "_")}">`;
          }
        }
      } else {
        if (Config.mode != "zen" && input !== word) {
          wordEl = `<div class='word error' input="${input
            .replace(/"/g, "&quot;")
            .replace(/ /g, "_")}">`;
        }
      }

      let loop;
      if (Config.mode == "zen" || input.length > word.length) {
        //input is longer - extra characters possible (loop over input)
        loop = input.length;
      } else {
        //input is shorter or equal (loop over word list)
        loop = word.length;
      }

      for (let c = 0; c < loop; c++) {
        let correctedChar;
        try {
          correctedChar = TestLogic.corrected.getHistory(i)[c];
        } catch (e) {
          correctedChar = undefined;
        }
        let extraCorrected = "";
        if (
          c + 1 === loop &&
          TestLogic.corrected.getHistory(i) !== undefined &&
          TestLogic.corrected.getHistory(i).length > input.length
        ) {
          extraCorrected = "extraCorrected";
        }
        if (Config.mode == "zen" || word[c] !== undefined) {
          if (Config.mode == "zen" || input[c] === word[c]) {
            if (correctedChar === input[c] || correctedChar === undefined) {
              wordEl += `<letter class="correct ${extraCorrected}">${input[c]}</letter>`;
            } else {
              wordEl +=
                `<letter class="corrected ${extraCorrected}">` +
                input[c] +
                "</letter>";
            }
          } else {
            if (input[c] === TestLogic.input.current) {
              wordEl +=
                `<letter class='correct ${extraCorrected}'>` +
                word[c] +
                "</letter>";
            } else if (input[c] === undefined) {
              wordEl += "<letter>" + word[c] + "</letter>";
            } else {
              wordEl +=
                `<letter class="incorrect ${extraCorrected}">` +
                word[c] +
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
        for (let c = 0; c < word.length; c++) {
          wordEl += "<letter>" + word[c] + "</letter>";
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
        Notifications.add("Tag added", 1, 2);
        DB.getSnapshot().tags.push({
          name: inputVal,
          id: e.data.id,
        });
        updateResultEditTagsPanelButtons();
        updateSettingsPage();
        updateFilterTags();
      } else if (status === -1) {
        Notifications.add("Invalid tag name", 0);
      } else if (status < -1) {
        Notifications.add("Unknown error: " + e.data.message, -1);
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
        Notifications.add("Tag updated", 1);
        DB.getSnapshot().tags.forEach((tag) => {
          if (tag.id === tagid) {
            tag.name = inputVal;
          }
        });
        updateResultEditTagsPanelButtons();
        updateSettingsPage();
        updateFilterTags();
      } else if (status === -1) {
        Notifications.add("Invalid tag name", 0);
      } else if (status < -1) {
        Notifications.add("Unknown error: " + e.data.message, -1);
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
        Notifications.add("Tag removed", 1);
        DB.getSnapshot().tags.forEach((tag, index) => {
          if (tag.id === tagid) {
            DB.getSnapshot().tags.splice(index, 1);
          }
        });
        updateResultEditTagsPanelButtons();
        updateSettingsPage();
        updateFilterTags();
      } else if (status < -1) {
        Notifications.add("Unknown error: " + e.data.message, -1);
      }
    });
  }
}

function showCustomMode2Popup(mode) {
  if ($("#customMode2PopupWrapper").hasClass("hidden")) {
    if (mode == "time") {
      $("#customMode2Popup .title").text("Test length");
      $("#customMode2Popup").attr("mode", "time");
    } else if (mode == "words") {
      $("#customMode2Popup .title").text("Word amount");
      $("#customMode2Popup").attr("mode", "words");
    }
    $("#customMode2PopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100, (e) => {
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

function applyMode2Popup() {
  let mode = $("#customMode2Popup").attr("mode");
  let val = parseInt($("#customMode2Popup input").val());

  if (mode == "time") {
    if (val !== null && !isNaN(val) && val >= 0) {
      setTimeConfig(val);
      ManualRestart.set();
      restartTest();
      if (val >= 1800) {
        Notifications.add("Stay safe and take breaks!", 0);
      } else if (val == 0) {
        Notifications.add(
          "Infinite time! Make sure to use Bail Out from the command line to save your result.",
          0,
          7
        );
      }
    } else {
      Notifications.add("Custom time must be at least 1", 0);
    }
  } else if (mode == "words") {
    if (val !== null && !isNaN(val) && val >= 0) {
      setWordCount(val);
      ManualRestart.set();
      restartTest();
      if (val > 2000) {
        Notifications.add("Stay safe and take breaks!", 0);
      } else if (val == 0) {
        Notifications.add(
          "Infinite words! Make sure to use Bail Out from the command line to save your result.",
          0,
          7
        );
      }
    } else {
      Notifications.add("Custom word amount must be at least 1", 0);
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
    ManualRestart.set();
    restartTest();
  }
});

$(document).on("click", "#top .config .time .text-button", (e) => {
  let mode = $(e.currentTarget).attr("timeConfig");
  if (mode == "custom") {
    showCustomMode2Popup("time");
  } else {
    setTimeConfig(mode);
    ManualRestart.set();

    restartTest();
  }
});

$(document).on("click", "#top .config .quoteLength .text-button", (e) => {
  let len = $(e.currentTarget).attr("quoteLength");
  if (len == -2) {
    setQuoteLength(-2, false, e.shiftKey);
    QuoteSearchPopup.show(restartTest, setQuoteLength);
  } else {
    if (len == -1) {
      len = [0, 1, 2, 3];
    }
    setQuoteLength(len, false, e.shiftKey);
    ManualRestart.set();
    restartTest();
  }
});

$(document).on("click", "#top .config .customText .text-button", () => {
  CustomTextPopup.show(restartTest);
});

$(document).on("click", "#top .config .punctuationMode .text-button", () => {
  togglePunctuation();
  ManualRestart.set();

  restartTest();
});

$(document).on("click", "#top .config .numbersMode .text-button", () => {
  toggleNumbers();
  ManualRestart.set();

  restartTest();
});

$("#wordsWrapper").on("click", () => {
  focusWords();
});

$(document).on("click", "#top .config .mode .text-button", (e) => {
  if ($(e.currentTarget).hasClass("active")) return;
  const mode = $(e.currentTarget).attr("mode");
  setMode(mode);
  ManualRestart.set();
  restartTest();
});

$(document).on("click", "#top #menu .icon-button", (e) => {
  if ($(e.currentTarget).hasClass("discord")) return;
  if ($(e.currentTarget).hasClass("leaderboards")) {
    Leaderboards.show();
  } else {
    const href = $(e.currentTarget).attr("href");
    ManualRestart.set();
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
      TestLogic.active &&
      Config.repeatQuotes === "typing" &&
      Config.mode === "quote"
    ) {
      restartTest(true);
    } else {
      restartTest();
    }
  }
});

$(document.body).on("click", "#restartTestButton", () => {
  ManualRestart.set();
  if (TestUI.resultCalculating) return;
  if (
    TestLogic.active &&
    Config.repeatQuotes === "typing" &&
    Config.mode === "quote"
  ) {
    restartTest(true);
  } else {
    restartTest();
  }
});

$(document).on("keypress", "#practiseMissedWordsButton", (event) => {
  if (event.keyCode == 13) {
    PractiseMissed.init(setMode, restartTest);
  }
});

$(document.body).on("click", "#practiseMissedWordsButton", () => {
  PractiseMissed.init(setMode, restartTest);
});

$(document).on("keypress", "#nextTestButton", (event) => {
  if (event.keyCode == 13) {
    restartTest();
  }
});

$(document.body).on("click", "#nextTestButton", () => {
  ManualRestart.set();
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
  if (Config.mode == "zen") {
    Notifications.add("Repeat test disabled in zen mode");
    return;
  }
  ManualRestart.set();
  restartTest(true);
});

$(document).on("keypress", "#restartTestButtonWithSameWordset", (event) => {
  if (Config.mode == "zen") {
    Notifications.add("Repeat test disabled in zen mode");
    return;
  }
  if (event.keyCode == 13) {
    restartTest(true);
  }
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

$("#wordsInput").on("focus", () => {
  if (!TestUI.resultVisible && Config.showOutOfFocusWarning) {
    OutOfFocus.hide();
  }
  Caret.show(TestLogic.input.current);
});

$("#wordsInput").on("focusout", () => {
  if (!TestUI.resultVisible && Config.showOutOfFocusWarning) {
    OutOfFocus.show();
  }
  Caret.hide();
});

$(window).resize(() => {
  Caret.updatePosition();
});

$(document).mousemove(function (event) {
  if (
    $("#top").hasClass("focus") &&
    (event.originalEvent.movementX > 0 || event.originalEvent.movementY > 0)
  ) {
    Focus.set(false);
  }
});

$(document).on("click", "#testModesNotice .text-button", (event) => {
  let commands = eval($(event.currentTarget).attr("commands"));
  let func = $(event.currentTarget).attr("function");
  if (commands !== undefined) {
    if ($(event.currentTarget).attr("commands") === "commandsTags") {
      updateCommandsTagsList();
    }
    currentCommands.push(commands);
    showCommandLine();
  } else if (func != undefined) {
    eval(func);
  }
});

$(document).on("click", "#commandLineMobileButton", () => {
  currentCommands = [commands];
  showCommandLine();
});

let dontInsertSpace = false;

$(document).keyup((event) => {
  if (!event.originalEvent.isTrusted) return;

  if (TestUI.resultVisible) return;
  let now = performance.now();
  let diff = Math.abs(TestStats.keypressTimings.duration.current - now);
  if (TestStats.keypressTimings.duration.current !== -1) {
    TestStats.pushKeypressDuration(diff);
    // keypressStats.duration.array.push(diff);
  }
  TestStats.setKeypressDuration(now);
  // keypressStats.duration.current = now;
  Monkey.stop();
});

$(document).keydown(function (event) {
  if (!(event.key == " ") && !event.originalEvent.isTrusted) return;

  if (!TestUI.resultVisible) {
    TestStats.recordKeypressSpacing();
  }

  Monkey.type();

  //autofocus
  let pageTestActive = !$(".pageTest").hasClass("hidden");
  let commandLineVisible = !$("#commandLineWrapper").hasClass("hidden");
  let wordsFocused = $("#wordsInput").is(":focus");
  let modePopupVisible =
    !$("#customTextPopupWrapper").hasClass("hidden") ||
    !$("#customMode2PopupWrapper").hasClass("hidden") ||
    !$("#quoteSearchPopupWrapper").hasClass("hidden");
  if (
    pageTestActive &&
    !commandLineVisible &&
    !modePopupVisible &&
    !TestUI.resultVisible &&
    !wordsFocused &&
    event.key !== "Enter"
  ) {
    focusWords();
    wordsFocused = true;
    // if (Config.showOutOfFocusWarning) return;
  }

  //tab
  if (
    (event.key == "Tab" && !Config.swapEscAndTab) ||
    (event.key == "Escape" && Config.swapEscAndTab)
  ) {
    handleTab(event);
    // event.preventDefault();
  }

  //blocking firefox from going back in history with backspace
  if (event.key === "Backspace" && wordsFocused) {
    let t = /INPUT|SELECT|TEXTAREA/i;
    if (
      !t.test(event.target.tagName) ||
      event.target.disabled ||
      event.target.readOnly
    ) {
      event.preventDefault();
    }
  }

  // keypressStats.duration.current = performance.now();
  TestStats.setKeypressDuration(performance.now());

  if (TestUI.testRestarting) {
    return;
  }

  //backspace
  const isBackspace =
    event.key === "Backspace" ||
    (Config.capsLockBackspace && event.key === "CapsLock");
  if (isBackspace && wordsFocused) {
    handleBackspace(event);
  }

  if (event.key === "Enter" && Funbox.active === "58008" && wordsFocused) {
    event.key = " ";
  }

  //space or enter
  if (event.key === " " && wordsFocused) {
    handleSpace(event, false);
  }

  if (wordsFocused && !commandLineVisible) {
    handleAlpha(event);
  }

  let acc = Misc.roundTo2(TestStats.calculateAccuracy());
  LiveAcc.update(acc);
});

function handleTab(event) {
  if (TestUI.resultCalculating) {
    event.preventDefault();
  }
  if ($("#customTextPopup .textarea").is(":focus")) {
    event.preventDefault();

    let area = $("#customTextPopup .textarea")[0];

    var start = area.selectionStart;
    var end = area.selectionEnd;

    // set textarea value to: text before caret + tab + text after caret
    area.value =
      area.value.substring(0, start) + "\t" + area.value.substring(end);

    // put caret at right position again
    area.selectionStart = area.selectionEnd = start + 1;

    // event.preventDefault();
    // $("#customTextPopup .textarea").val(
    //   $("#customTextPopup .textarea").val() + "\t"
    // );
    return;
  } else if (
    $(".pageTest").hasClass("active") &&
    !TestUI.resultCalculating &&
    $("#commandLineWrapper").hasClass("hidden") &&
    $("#simplePopupWrapper").hasClass("hidden")
  ) {
    if (Config.quickTab) {
      if (Config.mode == "zen" && !event.shiftKey) {
        //ignore
      } else {
        if (event.shiftKey) ManualRestart.set();

        if (
          TestLogic.active &&
          Config.repeatQuotes === "typing" &&
          Config.mode === "quote"
        ) {
          restartTest(true, false, event);
        } else {
          restartTest(false, false, event);
        }
      }
    } else {
      if (
        !TestUI.resultVisible &&
        ((TestLogic.hasTab && event.shiftKey) ||
          (!TestLogic.hasTab && Config.mode !== "zen") ||
          (Config.mode === "zen" && event.shiftKey))
      ) {
        event.preventDefault();
        $("#restartTestButton").focus();
      }
    }
  } else if (Config.quickTab) {
    changePage("test");
  }

  // } else if (
  //   !event.ctrlKey &&
  //   (
  //     (!event.shiftKey && !TestLogic.hasTab) ||
  //     (event.shiftKey && TestLogic.hasTab) ||
  //     TestUI.resultVisible
  //   ) &&
  //   Config.quickTab &&
  //   !$(".pageLogin").hasClass("active") &&
  //   !resultCalculating &&
  //   $("#commandLineWrapper").hasClass("hidden") &&
  //   $("#simplePopupWrapper").hasClass("hidden")
  // ) {
  //   event.preventDefault();
  //   if ($(".pageTest").hasClass("active")) {
  //     if (
  //       (Config.mode === "words" && Config.words < 1000) ||
  //       (Config.mode === "time" && Config.time < 3600) ||
  //       Config.mode === "quote" ||
  //       (Config.mode === "custom" &&
  //         CustomText.isWordRandom &&
  //         CustomText.word < 1000) ||
  //       (Config.mode === "custom" &&
  //         CustomText.isTimeRandom &&
  //         CustomText.time < 3600) ||
  //       (Config.mode === "custom" &&
  //         !CustomText.isWordRandom &&
  //         CustomText.text.length < 1000)
  //     ) {
  //       if (TestLogic.active) {
  //         let testNow = performance.now();
  //         let testSeconds = Misc.roundTo2((testNow - testStart) / 1000);
  //         let afkseconds = keypressPerSecond.filter(
  //           (x) => x.count == 0 && x.mod == 0
  //         ).length;
  //         incompleteTestSeconds += testSeconds - afkseconds;
  //         restartCount++;
  //       }
  //       restartTest();
  //     } else {
  //       Notifications.add("Quick restart disabled for long tests", 0);
  //     }
  //   } else {
  //     changePage("test");
  //   }
  // } else if (
  //   !Config.quickTab &&
  //   TestLogic.hasTab &&
  //   event.shiftKey &&
  //   !TestUI.resultVisible
  // ) {
  //   event.preventDefault();
  //   $("#restartTestButton").focus();
  // }
}

function handleBackspace(event) {
  event.preventDefault();
  if (!TestLogic.active) return;
  if (
    TestLogic.input.current == "" &&
    TestLogic.input.history.length > 0 &&
    TestUI.currentWordElementIndex > 0
  ) {
    //if nothing is inputted and its not the first word
    if (
      (TestLogic.input.getHistory(TestLogic.words.currentIndex - 1) ==
        TestLogic.words.get(TestLogic.words.currentIndex - 1) &&
        !Config.freedomMode) ||
      $($(".word")[TestLogic.words.currentIndex - 1]).hasClass("hidden")
    ) {
      return;
    } else {
      if (Config.confidenceMode === "on" || Config.confidenceMode === "max")
        return;
      if (event["ctrlKey"] || event["altKey"]) {
        TestLogic.input.resetCurrent();
        TestLogic.input.popHistory();
        TestLogic.corrected.popHistory();
      } else {
        TestLogic.input.setCurrent(TestLogic.input.popHistory());
        TestLogic.corrected.setCurrent(TestLogic.corrected.popHistory());
        if (Funbox.active === "nospace") {
          TestLogic.input.setCurrent(
            TestLogic.input.current.substring(
              0,
              TestLogic.input.current.length - 1
            )
          );
        }
      }
      TestLogic.words.decreaseCurrentIndex();
      TestUI.setCurrentWordElementIndex(TestUI.currentWordElementIndex - 1);
      TestUI.updateActiveElement(true);
      Funbox.toggleScript(TestLogic.words.getCurrent());
      TestUI.updateWordElement(!Config.blindMode);
    }
  } else {
    if (Config.confidenceMode === "max") return;
    if (event["ctrlKey"] || event["altKey"]) {
      let limiter = " ";
      if (
        TestLogic.input.current.lastIndexOf("-") >
        TestLogic.input.current.lastIndexOf(" ")
      )
        limiter = "-";

      let split = TestLogic.input.current.replace(/ +/g, " ").split(limiter);
      if (split[split.length - 1] == "") {
        split.pop();
      }
      let addlimiter = false;
      if (split.length > 1) {
        addlimiter = true;
      }
      split.pop();
      TestLogic.input.setCurrent(split.join(limiter));

      if (addlimiter) {
        TestLogic.input.appendCurrent(limiter);
      }
    } else if (event.metaKey) {
      TestLogic.input.resetCurrent();
    } else {
      TestLogic.input.setCurrent(
        TestLogic.input.current.substring(0, TestLogic.input.current.length - 1)
      );
    }
    TestUI.updateWordElement(!Config.blindMode);
  }
  Sound.playClick(Config.playSoundOnClick);
  if (Config.keymapMode === "react") {
    Keymap.flashKey(event.code, true);
  } else if (Config.keymapMode === "next" && Config.mode !== "zen") {
    Keymap.highlightKey(
      TestLogic.words
        .getCurrent()
        .substring(
          TestLogic.input.current.length,
          TestLogic.input.current.length + 1
        )
        .toString()
        .toUpperCase()
    );
  }
  Caret.updatePosition();
}

function handleSpace(event, isEnter) {
  if (!TestLogic.active) return;
  if (TestLogic.input.current === "") return;
  // let nextWord = wordsList[TestLogic.words.currentIndex + 1];
  // if ((isEnter && nextWord !== "\n") && (isEnter && Funbox.active !== "58008")) return;
  // if (!isEnter && nextWord === "\n") return;
  event.preventDefault();

  if (Config.mode == "zen") {
    $("#words .word.active").removeClass("active");
    $("#words").append("<div class='word active'></div>");
  }

  let currentWord = TestLogic.words.getCurrent();
  if (Funbox.active === "layoutfluid" && Config.mode !== "time") {
    const layouts = ["qwerty", "dvorak", "colemak"];
    let index = 0;
    let outof = TestLogic.words.length;
    index = Math.floor((TestLogic.input.history.length + 1) / (outof / 3));
    if (Config.layout !== layouts[index] && layouts[index] !== undefined) {
      Notifications.add(`--- !!! ${layouts[index]} !!! ---`, 0);
    }
    setLayout(layouts[index]);
    setKeymapLayout(layouts[index]);
    Keymap.highlightKey(
      TestLogic.words
        .getCurrent()
        .substring(
          TestLogic.input.current.length,
          TestLogic.input.current.length + 1
        )
        .toString()
        .toUpperCase()
    );
    settingsGroups.layout.updateButton();
  }
  dontInsertSpace = true;
  if (currentWord == TestLogic.input.current || Config.mode == "zen") {
    //correct word or in zen mode
    PaceCaret.handleSpace(true, currentWord);
    TestStats.incrementAccuracy(true);
    TestLogic.input.pushHistory();
    TestLogic.words.increaseCurrentIndex();
    TestUI.setCurrentWordElementIndex(TestUI.currentWordElementIndex + 1);
    TestUI.updateActiveElement();
    Funbox.toggleScript(TestLogic.words.getCurrent());
    Caret.updatePosition();
    TestStats.incrementKeypressCount();
    TestStats.pushKeypressWord(TestLogic.words.currentIndex);
    // currentKeypress.count++;
    // currentKeypress.words.push(TestLogic.words.currentIndex);
    if (Funbox.active !== "nospace") {
      Sound.playClick(Config.playSoundOnClick);
    }
  } else {
    //incorrect word
    PaceCaret.handleSpace(false, currentWord);
    if (Funbox.active !== "nospace") {
      if (!Config.playSoundOnError || Config.blindMode) {
        Sound.playClick(Config.playSoundOnClick);
      } else {
        Sound.playError(Config.playSoundOnError);
      }
    }
    TestStats.incrementAccuracy(false);
    TestStats.incrementKeypressErrors();
    let cil = TestLogic.input.current.length;
    if (cil <= TestLogic.words.getCurrent().length) {
      if (cil >= TestLogic.corrected.current.length) {
        TestLogic.corrected.appendCurrent("_");
      } else {
        TestLogic.corrected.setCurrent(
          TestLogic.corrected.current.substring(0, cil) +
            "_" +
            TestLogic.corrected.current.substring(cil + 1)
        );
      }
    }
    if (Config.stopOnError != "off") {
      if (Config.difficulty == "expert" || Config.difficulty == "master") {
        //failed due to diff when pressing space
        failTest();
        return;
      }
      if (Config.stopOnError == "word") {
        TestLogic.input.appendCurrent(" ");
        TestUI.updateWordElement(true);
        Caret.updatePosition();
      }
      return;
    }
    if (Config.blindMode) $("#words .word.active letter").addClass("correct");
    TestLogic.input.pushHistory();
    highlightBadWord(TestUI.currentWordElementIndex, !Config.blindMode);
    TestLogic.words.increaseCurrentIndex();
    TestUI.setCurrentWordElementIndex(TestUI.currentWordElementIndex + 1);
    TestUI.updateActiveElement();
    Funbox.toggleScript(TestLogic.words.getCurrent());
    Caret.updatePosition();
    // currentKeypress.count++;
    // currentKeypress.words.push(TestLogic.words.currentIndex);
    TestStats.incrementKeypressCount();
    TestStats.pushKeypressWord(TestLogic.words.currentIndex);
    if (Config.difficulty == "expert" || Config.difficulty == "master") {
      failTest();
      return;
    } else if (TestLogic.words.currentIndex == TestLogic.words.length) {
      //submitted last word that is incorrect
      TestStats.setLastSecondNotRound();
      showResult();
      return;
    }
  }

  TestLogic.corrected.pushHistory();

  if (
    !Config.showAllLines ||
    Config.mode == "time" ||
    (CustomText.isWordRandom && CustomText.word == 0) ||
    CustomText.isTimeRandom
  ) {
    let currentTop = Math.floor(
      document.querySelectorAll("#words .word")[
        TestUI.currentWordElementIndex - 1
      ].offsetTop
    );
    let nextTop;
    try {
      nextTop = Math.floor(
        document.querySelectorAll("#words .word")[
          TestUI.currentWordElementIndex
        ].offsetTop
      );
    } catch (e) {
      nextTop = 0;
    }

    if (nextTop > currentTop && !TestUI.lineTransition) {
      TestUI.lineJump(currentTop);
    }
  } //end of line wrap

  Caret.updatePosition();

  if (Config.keymapMode === "react") {
    Keymap.flashKey(event.code, true);
  } else if (Config.keymapMode === "next" && Config.mode !== "zen") {
    Keymap.highlightKey(
      TestLogic.words
        .getCurrent()
        .substring(
          TestLogic.input.current.length,
          TestLogic.input.current.length + 1
        )
        .toString()
        .toUpperCase()
    );
  }
  if (
    Config.mode === "words" ||
    Config.mode === "custom" ||
    Config.mode === "quote" ||
    Config.mode === "zen"
  ) {
    TimerProgress.update(time);
  }
  if (
    Config.mode == "time" ||
    Config.mode == "words" ||
    Config.mode == "custom"
  ) {
    addWord();
  }
}

function handleAlpha(event) {
  if (
    [
      "ContextMenu",
      "Escape",
      "Shift",
      "Control",
      "Meta",
      "Alt",
      "AltGraph",
      "CapsLock",
      "Backspace",
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
      "Process",
      "Delete",
      "KanjiMode",
      "Pause",
      "PrintScreen",
      "Clear",
      "End",
      undefined,
    ].includes(event.key)
  ) {
    TestStats.incrementKeypressMod();
    // currentKeypress.mod++;
    return;
  }

  //insert space for expert and master or strict space,
  //otherwise dont do anything
  if (event.key === " ") {
    if (Config.difficulty !== "normal" || Config.strictSpace) {
      if (dontInsertSpace) {
        dontInsertSpace = false;
        return;
      }
    } else {
      return;
    }
  }

  if (event.key === "Tab") {
    if (
      Config.mode !== "zen" &&
      (!TestLogic.hasTab || (TestLogic.hasTab && event.shiftKey))
    ) {
      return;
    }
    event.key = "\t";
    event.preventDefault();
  }

  if (event.key === "Enter") {
    if (event.shiftKey && Config.mode == "zen") {
      showResult();
    }
    if (
      event.shiftKey &&
      ((Config.mode == "time" && Config.time === 0) ||
        (Config.mode == "words" && Config.words === 0))
    ) {
      TestLogic.setBailout(true);
      showResult();
    }
    event.key = "\n";
  }

  // if (event.key.length > 1) return;
  if (/F\d+/.test(event.key)) return;
  if (/Numpad/.test(event.key)) return;
  if (/Volume/.test(event.key)) return;
  if (/Media/.test(event.key)) return;
  if (
    event.ctrlKey != event.altKey &&
    (event.ctrlKey || /Linux/.test(window.navigator.platform))
  )
    return;
  if (event.metaKey) return;

  let originalEvent = event;

  event = emulateLayout(event);

  //start the test
  if (
    TestLogic.input.current == "" &&
    TestLogic.input.history.length == 0 &&
    !TestLogic.active
  ) {
    if (!startTest()) return;
  } else {
    if (!TestLogic.active) return;
  }

  Focus.set(true);
  Caret.stopAnimation();

  //show dead keys
  if (event.key === "Dead") {
    Sound.playClick(Config.playSoundOnClick);
    $(
      document.querySelector("#words .word.active").querySelectorAll("letter")[
        TestLogic.input.current.length
      ]
    ).toggleClass("dead");
    return;
  }

  //check if the char typed was correct
  let thisCharCorrect;
  let nextCharInWord;
  if (Config.mode != "zen") {
    nextCharInWord = TestLogic.words
      .getCurrent()
      .substring(
        TestLogic.input.current.length,
        TestLogic.input.current.length + 1
      );
  }

  if (nextCharInWord == event["key"]) {
    thisCharCorrect = true;
  } else {
    thisCharCorrect = false;
  }

  if (Config.language.split("_")[0] == "russian") {
    if ((event.key === "е" || event.key === "e") && nextCharInWord == "ё") {
      event.key = nextCharInWord;
      thisCharCorrect = true;
    }
    if (
      event.key === "ё" &&
      (nextCharInWord == "е" || nextCharInWord === "e")
    ) {
      event.key = nextCharInWord;
      thisCharCorrect = true;
    }
  }

  if (Config.mode == "zen") {
    thisCharCorrect = true;
  }

  if (event.key === "’" && nextCharInWord == "'") {
    event.key = "'";
    thisCharCorrect = true;
  }

  if (event.key === "'" && nextCharInWord == "’") {
    event.key = "’";
    thisCharCorrect = true;
  }

  if (event.key === "”" && nextCharInWord == '"') {
    event.key = '"';
    thisCharCorrect = true;
  }

  if (event.key === '"' && nextCharInWord == "”") {
    event.key = "”";
    thisCharCorrect = true;
  }

  if ((event.key === "–" || event.key === "—") && nextCharInWord == "-") {
    event.key = "-";
    thisCharCorrect = true;
  }

  if (
    Config.oppositeShiftMode === "on" &&
    ShiftTracker.isUsingOppositeShift(originalEvent) === false
  ) {
    thisCharCorrect = false;
  }

  if (!thisCharCorrect) {
    TestStats.incrementAccuracy(false);
    TestStats.incrementKeypressErrors();
    // currentError.count++;
    // currentError.words.push(TestLogic.words.currentIndex);
    thisCharCorrect = false;
    TestStats.pushMissedWord(TestLogic.words.getCurrent());
  } else {
    TestStats.incrementAccuracy(true);
    thisCharCorrect = true;
    if (Config.mode == "zen") {
      //making the input visible to the user
      $("#words .active").append(
        `<letter class="correct">${event.key}</letter>`
      );
    }
  }

  if (thisCharCorrect) {
    Sound.playClick(Config.playSoundOnClick);
  } else {
    if (!Config.playSoundOnError || Config.blindMode) {
      Sound.playClick(Config.playSoundOnClick);
    } else {
      Sound.playError(Config.playSoundOnError);
    }
  }

  if (
    Config.oppositeShiftMode === "on" &&
    ShiftTracker.isUsingOppositeShift(originalEvent) === false
  )
    return;

  //update current corrected verison. if its empty then add the current key. if its not then replace the last character with the currently pressed one / add it
  if (TestLogic.corrected.current === "") {
    TestLogic.corrected.setCurrent(TestLogic.input.current + event["key"]);
  } else {
    let cil = TestLogic.input.current.length;
    if (cil >= TestLogic.corrected.current.length) {
      TestLogic.corrected.appendCurrent(event["key"]);
    } else if (!thisCharCorrect) {
      TestLogic.corrected.setCurrent(
        TestLogic.corrected.current.substring(0, cil) +
          event["key"] +
          TestLogic.corrected.current.substring(cil + 1)
      );
    }
  }
  TestStats.incrementKeypressCount();
  TestStats.pushKeypressWord(TestLogic.words.currentIndex);
  // currentKeypress.count++;
  // currentKeypress.words.push(TestLogic.words.currentIndex);

  if (Config.stopOnError == "letter" && !thisCharCorrect) {
    return;
  }

  //update the active word top, but only once
  if (
    TestLogic.input.current.length === 1 &&
    TestLogic.words.currentIndex === 0
  ) {
    TestUI.setActiveWordTop(document.querySelector("#words .active").offsetTop);
  }

  //max length of the input is 20 unless in zen mode
  if (
    Config.mode == "zen" ||
    TestLogic.input.current.length < TestLogic.words.getCurrent().length + 20
  ) {
    TestLogic.input.appendCurrent(event["key"]);
  }

  if (!thisCharCorrect && Config.difficulty == "master") {
    failTest();
    return;
  }

  //keymap
  if (Config.keymapMode === "react") {
    Keymap.flashKey(event.key, thisCharCorrect);
  } else if (Config.keymapMode === "next" && Config.mode !== "zen") {
    Keymap.highlightKey(
      TestLogic.words
        .getCurrent()
        .substring(
          TestLogic.input.current.length,
          TestLogic.input.current.length + 1
        )
        .toString()
        .toUpperCase()
    );
  }

  let activeWordTopBeforeJump = TestUI.activeWordTop;
  TestUI.updateWordElement(!Config.blindMode);

  if (Config.mode != "zen") {
    //not applicable to zen mode
    //auto stop the test if the last word is correct
    let currentWord = TestLogic.words.getCurrent();
    let lastindex = TestLogic.words.currentIndex;
    if (
      (currentWord == TestLogic.input.current ||
        (Config.quickEnd &&
          currentWord.length == TestLogic.input.current.length &&
          Config.stopOnError == "off")) &&
      lastindex == TestLogic.words.length - 1
    ) {
      TestLogic.input.pushHistory();

      TestLogic.corrected.pushHistory();
      TestStats.setLastSecondNotRound();
      showResult();
    }
  }

  //simulate space press in nospace funbox
  if (
    (Funbox.active === "nospace" &&
      TestLogic.input.current.length === TestLogic.words.getCurrent().length) ||
    (event.key === "\n" && thisCharCorrect)
  ) {
    $.event.trigger({
      type: "keydown",
      which: " ".charCodeAt(0),
      key: " ",
    });
  }

  let newActiveTop = document.querySelector("#words .word.active").offsetTop;
  //stop the word jump by slicing off the last character, update word again
  if (
    activeWordTopBeforeJump < newActiveTop &&
    !TestUI.lineTransition &&
    TestLogic.input.current.length > 1
  ) {
    if (Config.mode == "zen") {
      let currentTop = Math.floor(
        document.querySelectorAll("#words .word")[
          TestUI.currentWordElementIndex - 1
        ].offsetTop
      );
      if (!Config.showAllLines) TestUI.lineJump(currentTop);
    } else {
      TestLogic.input.setCurrent(TestLogic.input.current.slice(0, -1));
      TestUI.updateWordElement(!Config.blindMode);
    }
  }

  Caret.updatePosition();
}

window.addEventListener("beforeunload", (event) => {
  // Cancel the event as stated by the standard.
  if (
    (Config.mode === "words" && Config.words < 1000) ||
    (Config.mode === "time" && Config.time < 3600) ||
    Config.mode === "quote" ||
    (Config.mode === "custom" &&
      CustomText.isWordRandom &&
      CustomText.word < 1000) ||
    (Config.mode === "custom" &&
      CustomText.isTimeRandom &&
      CustomText.time < 1000) ||
    (Config.mode === "custom" &&
      !CustomText.isWordRandom &&
      CustomText.text.length < 1000)
  ) {
    //ignore
  } else {
    if (TestLogic.active) {
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
    Notifications.add(error, -1);
  };
  $("#top .logo .top").text("localhost");
  $("head title").text($("head title").text() + " (localhost)");
  firebase.functions().useFunctionsEmulator("http://localhost:5001");
  $("body").append(
    `<div class="devIndicator tl">local</div><div class="devIndicator br">local</div>`
  );
}

ManualRestart.set();

let configLoadDone;
let configLoadPromise = new Promise((v) => {
  configLoadDone = v;
});
loadConfigFromCookie();
configLoadDone();
Misc.getReleasesFromGitHub();
// getPatreonNames();

$(document).on("mouseenter", "#resultWordsHistory .words .word", (e) => {
  if (TestUI.resultVisible) {
    let input = $(e.currentTarget).attr("input");
    if (input != undefined)
      $(e.currentTarget).append(
        `<div class="wordInputAfter">${input
          .replace(/\t/g, "_")
          .replace(/\n/g, "_")}</div>`
      );
  }
});

$(document).on("click", "#bottom .leftright .right .current-theme", (e) => {
  if (e.shiftKey) {
    toggleCustomTheme();
  } else {
    // if (Config.customTheme) {
    //   toggleCustomTheme();
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

let mappedRoutes = {
  "/": "pageTest",
  "/login": "pageLogin",
  "/settings": "pageSettings",
  "/about": "pageAbout",
  "/account": "pageAccount",
  "/verify": "pageTest",
};

function handleInitialPageClasses(el) {
  $(el).removeClass("hidden");
  $(el).addClass("active");
}

$(document).ready(() => {
  handleInitialPageClasses(
    $(".page." + mappedRoutes[window.location.pathname])
  );
  if (window.location.pathname === "/") {
    $("#top .config").removeClass("hidden");
  }
  $("body").css("transition", ".25s");
  if (Config.quickTab) {
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
        // history.replaceState("/", null, "/");
      } else if (/challenge_.+/g.test(window.location.pathname)) {
        //do nothing
        // }
      } else if (window.location.pathname !== "/") {
        let page = window.location.pathname.replace("/", "");
        changePage(page);
      }
    });
  settingsFillPromise.then(updateSettingsPage);
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
  Notifications.add(
    "Won't remind you anymore. Thanks for continued support <3",
    0,
    5
  );
});

$(".pageTest #copyWordsListButton").click(async (event) => {
  try {
    let words;
    if (Config.mode == "zen") {
      words = TestLogic.input.history.join(" ");
    } else {
      words = TestLogic.words
        .get()
        .slice(0, TestLogic.input.history.length)
        .join(" ");
    }
    await navigator.clipboard.writeText(words);
    Notifications.add("Copied to clipboard", 0, 2);
  } catch (e) {
    Notifications.add("Could not copy to clipboard: " + e, -1);
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
      Notifications.add("Challenge not found", 0);
      ManualRestart.set();
      restartTest(false, true);
      setTimeout(() => {
        $("#top .config").removeClass("hidden");
        $(".page.pageTest").removeClass("hidden");
      }, 250);
      return;
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
      CustomText.setText(challenge.parameters[0].split(" "));
      CustomText.setIsWordRandom(challenge.parameters[1]);
      CustomText.setWord(parseInt(challenge.parameters[2]));
      setMode("custom", true);
      setDifficulty("normal", true);
    } else if (challenge.type === "script") {
      let scriptdata = await fetch("/challenges/" + challenge.parameters[0]);
      scriptdata = await scriptdata.text();
      let text = scriptdata.trim();
      text = text.replace(/[\n\r\t ]/gm, " ");
      text = text.replace(/ +/gm, " ");
      CustomText.setText(text.split(" "));
      CustomText.setIsWordRandom(false);
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
    ManualRestart.set();
    restartTest(false, true);
    notitext = challenge.message;
    $("#top .config").removeClass("hidden");
    $(".page.pageTest").removeClass("hidden");

    if (notitext === undefined) {
      Notifications.add(`Challenge '${challengeName}' loaded.`, 0);
    } else {
      Notifications.add("Challenge loaded. " + notitext, 0);
    }
  } catch (e) {
    Notifications.add("Something went wrong: " + e, -1);
  }
}
