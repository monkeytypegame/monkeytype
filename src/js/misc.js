import * as Loader from "./loader";
import Config from "./config";

export function getuid() {
  console.error("Only share this uid with Miodec and nobody else!");
  console.log(firebase.auth().currentUser.uid);
  console.error("Only share this uid with Miodec and nobody else!");
}

function hexToHSL(H) {
  // Convert hex to RGB first
  let r = 0,
    g = 0,
    b = 0;
  if (H.length == 4) {
    r = "0x" + H[1] + H[1];
    g = "0x" + H[2] + H[2];
    b = "0x" + H[3] + H[3];
  } else if (H.length == 7) {
    r = "0x" + H[1] + H[2];
    g = "0x" + H[3] + H[4];
    b = "0x" + H[5] + H[6];
  }
  // Then to HSL
  r /= 255;
  g /= 255;
  b /= 255;
  let cmin = Math.min(r, g, b),
    cmax = Math.max(r, g, b),
    delta = cmax - cmin,
    h = 0,
    s = 0,
    l = 0;

  if (delta == 0) h = 0;
  else if (cmax == r) h = ((g - b) / delta) % 6;
  else if (cmax == g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);

  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return {
    hue: h,
    sat: s,
    lgt: l,
    string: "hsl(" + h + "," + s + "%," + l + "%)",
  };
}

let themesList = null;
export async function getThemesList() {
  if (themesList == null) {
    return $.getJSON("themes/_list.json", function (data) {
      const list = data.sort(function (a, b) {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
      });
      themesList = list;
      return themesList;
    });
  } else {
    return themesList;
  }
}

let sortedThemesList = null;
export async function getSortedThemesList() {
  if (sortedThemesList == null) {
    if (themesList == null) {
      await getThemesList();
    }
    let sorted = [...themesList];
    sorted = sorted.sort((a, b) => {
      let b1 = hexToHSL(a.bgColor);
      let b2 = hexToHSL(b.bgColor);
      return b2.lgt - b1.lgt;
    });
    sortedThemesList = sorted;
    return sortedThemesList;
  } else {
    return sortedThemesList;
  }
}

let funboxList = null;
export async function getFunboxList() {
  if (funboxList == null) {
    return $.getJSON("funbox/_list.json", function (data) {
      funboxList = data.sort(function (a, b) {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
      });
      return funboxList;
    });
  } else {
    return funboxList;
  }
}

let quotes = null;
export async function getQuotes(language) {
  if (quotes === null || quotes.language !== language.replace(/_\d*k$/g, "")) {
    Loader.show();
    try {
      let data = await $.getJSON(`quotes/${language}.json`);
      Loader.hide();
      if (data.quotes === undefined || data.quotes.length === 0) {
        quotes = {
          quotes: [],
          length: 0,
        };
        return quotes;
      }
      quotes = data;
      quotes.length = data.quotes.length;
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
      return quotes;
    } catch {
      Loader.hide();
      quotes = {
        quotes: [],
        length: 0,
      };
      return quotes;
    }

    // error: (e) => {
    //   Notifications.add(
    //     `Error while loading ${language.replace(
    //       /_\d*k$/g,
    //       ""
    //     )} quotes: ${e}`,
    //     -1
    //   );
    //   quotes = [];
    //   return quotes;
    // },
  } else {
    return quotes;
  }
}

let fontsList = null;
export async function getFontsList() {
  if (fontsList == null) {
    return $.getJSON("fonts/_list.json", function (data) {
      fontsList = data.sort(function (a, b) {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
      });
      return fontsList;
    });
  } else {
    return fontsList;
  }
}

let languageList = null;
export async function getLanguageList() {
  if (languageList == null) {
    return $.getJSON("languages/_list.json", function (data) {
      languageList = data;
      return languageList;
    });
  } else {
    return languageList;
  }
}

let languageGroupList = null;
export async function getLanguageGroups() {
  if (languageGroupList == null) {
    return $.getJSON("languages/_groups.json", function (data) {
      languageGroupList = data;
      return languageGroupList;
    });
  } else {
    return languageGroupList;
  }
}

export async function findCurrentGroup(language) {
  let retgroup = undefined;
  let groups = await getLanguageGroups();
  groups.forEach((group) => {
    if (retgroup === undefined) {
      if (group.languages.includes(language)) {
        retgroup = group;
      }
    }
  });
  return retgroup;
}

let challengeList = null;
export async function getChallengeList() {
  if (challengeList == null) {
    return $.getJSON("challenges/_list.json", function (data) {
      challengeList = data;
      return challengeList;
    });
  } else {
    return challengeList;
  }
}

export function showNotification(text, time) {
  let noti = $(".notification");
  noti.text(text);
  noti.css("top", `-${noti.outerHeight()}px`);
  noti.stop(true, false).animate(
    {
      top: "1rem",
    },
    250,
    "swing",
    () => {
      noti.stop(true, false).animate(
        {
          opacity: 1,
        },
        time,
        () => {
          noti.stop(true, false).animate(
            {
              top: `-${noti.outerHeight()}px`,
            },
            250,
            "swing",
            () => {
              noti.text("");
            }
          );
        }
      );
    }
  );
}

let currentLanguage;
export async function getLanguage(lang) {
  try {
    if (currentLanguage == null || currentLanguage.name !== lang) {
      console.log("getting language json");
      await $.getJSON(`languages/${lang}.json`, function (data) {
        currentLanguage = data;
      });
    }
    return currentLanguage;
  } catch (e) {
    console.error(`error getting language`);
    console.error(e);
    showNotification(`Error getting language: ${e.message}`, 4000);
    await $.getJSON(`languages/english.json`, function (data) {
      currentLanguage = data;
    });
    return currentLanguage;
  }
}

export async function getCurrentLanguage() {
  return await getLanguage(Config.language);
}

export function migrateFromCookies() {
  ["resultFilters", "config", "merchbannerclosed", "activeTags"].forEach(
    function (name) {
      let decodedCookie = decodeURIComponent(document.cookie).split(";");
      let value = null;

      for (var i = 0; i < decodedCookie.length; i++) {
        var c = decodedCookie[i];
        while (c.charAt(0) == " ") {
          c = c.substring(1);
        }
        if (c.indexOf(name + "=") == 0) {
          value = c.substring(name.length + 1, c.length);
        }
      }

      if (value) {
        window.localStorage.setItem(name, value);
        $.removeCookie(name, { path: "/" });
      }
    }
  );
}

export function sendVerificationEmail() {
  Loader.show();
  let cu = firebase.auth().currentUser;
  cu.sendEmailVerification()
    .then(() => {
      Loader.hide();
      showNotification("Email sent to " + cu.email, 4000);
    })
    .catch((e) => {
      Loader.hide();
      showNotification("Error: " + e.message, 3000);
      console.error(e.message);
    });
}

export function smooth(arr, windowSize, getter = (value) => value, setter) {
  const get = getter;
  const result = [];

  for (let i = 0; i < arr.length; i += 1) {
    const leftOffeset = i - windowSize;
    const from = leftOffeset >= 0 ? leftOffeset : 0;
    const to = i + windowSize + 1;

    let count = 0;
    let sum = 0;
    for (let j = from; j < to && j < arr.length; j += 1) {
      sum += get(arr[j]);
      count += 1;
    }

    result[i] = setter ? setter(arr[i], sum / count) : sum / count;
  }

  return result;
}

export function stdDev(array) {
  try {
    const n = array.length;
    const mean = array.reduce((a, b) => a + b) / n;
    return Math.sqrt(
      array.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n
    );
  } catch (e) {
    return 0;
  }
}

export function mean(array) {
  try {
    return (
      array.reduce((previous, current) => (current += previous)) / array.length
    );
  } catch (e) {
    return 0;
  }
}

//https://www.w3resource.com/javascript-exercises/fundamental/javascript-fundamental-exercise-88.php
export function median(arr) {
  try {
    const mid = Math.floor(arr.length / 2),
      nums = [...arr].sort((a, b) => a - b);
    return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
  } catch (e) {
    return 0;
  }
}

export async function getReleasesFromGitHub() {
  return $.getJSON(
    "https://api.github.com/repos/Miodec/monkeytype/releases",
    (data) => {
      $("#bottom .version .text").text(data[0].name);
      $("#bottom .version").css("opacity", 1);
      $("#versionHistory .releases").empty();
      data.forEach((release) => {
        if (!release.draft && !release.prerelease) {
          $("#versionHistory .releases").append(`
          <div class="release">
            <div class="title">${release.name}</div>
            <div class="date">${moment(release.published_at).format(
              "DD MMM YYYY"
            )}</div>
            <div class="body">${release.body.replace(/\r\n/g, "<br>")}</div>
          </div>
        `);
        }
      });
    }
  );
}

// function getPatreonNames() {
//   let namesel = $(".pageAbout .section .supporters");
//   firebase
//     .functions()
//     .httpsCallable("getPatreons")()
//     .then((data) => {
//       let names = data.data;
//       names.forEach((name) => {
//         namesel.append(`<div>${name}</div>`);
//       });
//     });
// }

export function getLastChar(word) {
  try {
    return word.charAt(word.length - 1);
  } catch {
    return "";
  }
}

export function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function isASCIILetter(c) {
  return c.length === 1 && /[a-z]/i.test(c);
}

export function kogasa(cov) {
  return (
    100 * (1 - Math.tanh(cov + Math.pow(cov, 3) / 3 + Math.pow(cov, 5) / 5))
  );
}

export function whorf(speed, wordlen) {
  return Math.min(
    speed,
    Math.floor(speed * Math.pow(1.03, -2 * (wordlen - 3)))
  );
}

export function roundTo2(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function findLineByLeastSquares(values_y) {
  var sum_x = 0;
  var sum_y = 0;
  var sum_xy = 0;
  var sum_xx = 0;
  var count = 0;

  /*
   * We'll use those variables for faster read/write access.
   */
  var x = 0;
  var y = 0;
  var values_length = values_y.length;

  /*
   * Nothing to do.
   */
  if (values_length === 0) {
    return [[], []];
  }

  /*
   * Calculate the sum for each of the parts necessary.
   */
  for (var v = 0; v < values_length; v++) {
    x = v + 1;
    y = values_y[v];
    sum_x += x;
    sum_y += y;
    sum_xx += x * x;
    sum_xy += x * y;
    count++;
  }

  /*
   * Calculate m and b for the formular:
   * y = x * m + b
   */
  var m = (count * sum_xy - sum_x * sum_y) / (count * sum_xx - sum_x * sum_x);
  var b = sum_y / count - (m * sum_x) / count;

  var returnpoint1 = [1, 1 * m + b];
  var returnpoint2 = [values_length, values_length * m + b];
  return [returnpoint1, returnpoint2];
}

export function getGibberish() {
  let randLen = Math.floor(Math.random() * 7) + 1;
  let ret = "";
  for (let i = 0; i < randLen; i++) {
    ret += String.fromCharCode(97 + Math.floor(Math.random() * 26));
  }
  return ret;
}

export function secondsToString(sec, fullMinutes = false, fullHours = false) {
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = roundTo2((sec % 3600) % 60);
  let hoursString;
  let minutesString;
  let secondsString;
  hours < 10 ? (hoursString = "0" + hours) : (hoursString = hours);
  minutes < 10 ? (minutesString = "0" + minutes) : (minutesString = minutes);
  seconds < 10 && (minutes > 0 || hours > 0 || fullMinutes)
    ? (secondsString = "0" + seconds)
    : (secondsString = seconds);

  let ret = "";
  if (hours > 0 || fullHours) ret += hoursString + ":";
  if (minutes > 0 || hours > 0 || fullMinutes) ret += minutesString + ":";
  ret += secondsString;
  return ret;
}

export function getNumbers(len) {
  let randLen = Math.floor(Math.random() * len) + 1;
  let ret = "";
  for (let i = 0; i < randLen; i++) {
    const randomNum = Math.floor(Math.random() * 10);
    ret += randomNum.toString();
  }
  return ret;
}

export function getSpecials() {
  let randLen = Math.floor(Math.random() * 7) + 1;
  let ret = "";
  let specials = [
    "!",
    "@",
    "#",
    "$",
    "%",
    "^",
    "&",
    "*",
    "(",
    ")",
    "-",
    "_",
    "=",
    "+",
    "{",
    "}",
    "[",
    "]",
    "'",
    '"',
    "/",
    "\\",
    "|",
  ];
  for (let i = 0; i < randLen; i++) {
    ret += specials[Math.floor(Math.random() * specials.length)];
  }
  return ret;
}

export function getASCII() {
  let randLen = Math.floor(Math.random() * 10) + 1;
  let ret = "";
  for (let i = 0; i < randLen; i++) {
    ret += String.fromCharCode(33 + Math.floor(Math.random() * 94));
  }
  return ret;
}

export function getPositionString(number) {
  let numend = "th";
  let t = number % 10;
  let h = number % 100;
  if (t == 1 && h != 11) {
    numend = "st";
  }
  if (t == 2 && h != 12) {
    numend = "nd";
  }
  if (t == 3 && h != 13) {
    numend = "rd";
  }
  return number + numend;
}

export function findGetParameter(parameterName) {
  var result = null,
    tmp = [];
  location.search
    .substr(1)
    .split("&")
    .forEach(function (item) {
      tmp = item.split("=");
      if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
    });
  return result;
}

export function objectToQueryString(obj) {
  var str = [];
  for (var p in obj)
    if (Object.prototype.hasOwnProperty.call(obj, p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  return str.join("&");
}

export function toggleFullscreen(elem) {
  elem = elem || document.documentElement;

  if (
    !document.fullscreenElement &&
    !document.mozFullScreenElement &&
    !document.webkitFullscreenElement &&
    !document.msFullscreenElement
  ) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}

export function getWords() {
  const words = [...document.querySelectorAll("#words .word")]
    .map((word) => {
      return [...word.querySelectorAll("letter")]
        .map((letter) => letter.innerText)
        .join("");
    })
    .join(" ");

  return words;
}

//credit: https://www.w3resource.com/javascript-exercises/javascript-string-exercise-32.php
export function remove_non_ascii(str) {
  if (str === null || str === "") return false;
  else str = str.toString();

  return str.replace(/[^\x20-\x7E]/g, "");
}

export function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function cleanTypographySymbols(textToClean) {
  var specials = {
    "“": '"', // &ldquo;	&#8220;
    "”": '"', // &rdquo;	&#8221;
    "’": "'", // &lsquo;	&#8216;
    "‘": "'", // &rsquo;	&#8217;
    ",": ",", // &sbquo;	&#8218;
    "—": "-", // &mdash;  &#8212;
    "…": "...", // &hellip; &#8230;
    "«": "<<",
    "»": ">>",
    "–": "-",
    " ": " ",
    " ": " ",
    " ": " ",
  };
  return textToClean.replace(
    /[“”’‘—,…«»–   ]/g,
    (char) => specials[char] || ""
  );
}

export function isUsernameValid(name) {
  if (name === null || name === undefined || name === "") return false;
  if (/miodec/.test(name.toLowerCase())) return false;
  if (/bitly/.test(name.toLowerCase())) return false;
  if (name.length > 14) return false;
  if (/^\..*/.test(name.toLowerCase())) return false;
  return /^[0-9a-zA-Z_.-]+$/.test(name);
}

export function mapRange(x, in_min, in_max, out_min, out_max) {
  let num = ((x - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;

  if (out_min > out_max) {
    if (num > out_min) {
      num = out_min;
    } else if (num < out_max) {
      num = out_max;
    }
  } else {
    if (num < out_min) {
      num = out_min;
    } else if (num > out_max) {
      num = out_max;
    }
  }
  return num;
}

export function canQuickRestart(mode, words, time, CustomText) {
  if (
    (mode === "words" && words < 1000) ||
    (mode === "time" && time < 3600) ||
    mode === "quote" ||
    (mode === "custom" && CustomText.isWordRandom && CustomText.word < 1000) ||
    (mode === "custom" && CustomText.isTimeRandom && CustomText.time < 3600) ||
    (mode === "custom" &&
      !CustomText.isWordRandom &&
      CustomText.text.length < 1000)
  ) {
    return true;
  } else {
    return false;
  }
}

export function clearTimeouts(timeouts) {
  timeouts.forEach((to) => {
    clearTimeout(to);
    to = null;
  });
}

//https://stackoverflow.com/questions/1431094/how-do-i-replace-a-character-at-a-particular-index-in-javascript
export function setCharAt(str, index, chr) {
  if (index > str.length - 1) return str;
  return str.substring(0, index) + chr + str.substring(index + 1);
}

//https://stackoverflow.com/questions/273789/is-there-a-version-of-javascripts-string-indexof-that-allows-for-regular-expr
export function regexIndexOf(string, regex, startpos) {
  var indexOf = string.substring(startpos || 0).search(regex);
  return indexOf >= 0 ? indexOf + (startpos || 0) : indexOf;
}

String.prototype.lastIndexOfRegex = function (regex) {
  var match = this.match(regex);
  return match ? this.lastIndexOf(match[match.length - 1]) : -1;
};

export const trailingComposeChars = /[\u02B0-\u02FF`´^¨~]+$|⎄.*$/;
