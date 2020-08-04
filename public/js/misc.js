let themesList = null;
async function getThemesList() {
  if (themesList == null) {
    return $.getJSON("themes/list.json", function (data) {
      themesList = data.sort(function (a, b) {
        (nameA = a.name.toLowerCase()), (nameB = b.name.toLowerCase());
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
      });
      return themesList;
    });
  } else {
    return themesList;
  }
}

let funboxList = null;
async function getFunboxList() {
  if (funboxList == null) {
    return $.getJSON("funbox/list.json", function (data) {
      funboxList = data.sort(function (a, b) {
        (nameA = a.name.toLowerCase()), (nameB = b.name.toLowerCase());
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

let fontsList = null;
async function getFontsList() {
  if (fontsList == null) {
    return $.getJSON("js/fonts.json", function (data) {
      fontsList = data.sort(function (a, b) {
        (nameA = a.name.toLowerCase()), (nameB = b.name.toLowerCase());
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

function smooth(arr, windowSize, getter = (value) => value, setter) {
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

function stdDev(array) {
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

function mean(array) {
  try {
    return (
      array.reduce((previous, current) => (current += previous)) / array.length
    );
  } catch (e) {
    return 0;
  }
}

function showNotification(text, time) {
  let noti = $(".notification");
  noti.text(text);
  noti.css("top", `-${noti.outerHeight()}px`);
  noti.stop(true, true).animate(
    {
      top: "1rem",
    },
    250,
    "swing",
    () => {
      noti.stop(true, true).animate(
        {
          opacity: 1,
        },
        time,
        () => {
          noti.stop(true, true).animate(
            {
              top: `-${noti.outerHeight()}px`,
            },
            250,
            "swing"
          );
        }
      );
    }
  );
}

function getReleasesFromGitHub() {
  $.getJSON(
    "https://api.github.com/repos/Miodec/monkey-type/releases",
    (data) => {
      $("#bottom .version").text(data[0].name).css("opacity", 1);
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

function getLastChar(word) {
  return word.charAt(word.length - 1);
}

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function kogasa(cov) {
  return (
    100 * (1 - Math.tanh(cov + Math.pow(cov, 3) / 3 + Math.pow(cov, 5) / 5))
  );
}
