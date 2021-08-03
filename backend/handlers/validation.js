const MonkeyError = require("./error");

const { roundTo2 } = require("./misc");

function isUsernameValid(name) {
  if (name === null || name === undefined || name === "") return false;
  if (/miodec/.test(name.toLowerCase())) return false;
  if (/bitly/.test(name.toLowerCase())) return false;
  if (name.length > 14) return false;
  if (/^\..*/.test(name.toLowerCase())) return false;
  return /^[0-9a-zA-Z_.-]+$/.test(name);
}

function validateResult(result) {
  if (result.wpm > result.rawWpm) {
    console.error(
      `Could not validate result for ${result.uid}. ${result.wpm} > ${result.rawWpm}`
    );
    return false;
  }
  let wpm = roundTo2((result.correctChars * (60 / result.testDuration)) / 5);
  if (
    wpm < result.wpm - result.wpm * 0.01 ||
    wpm > result.wpm + result.wpm * 0.01
  ) {
    console.error(
      `Could not validate result for ${result.uid}. wpm ${wpm} != ${result.wpm}`
    );
    return false;
  }
  if (result.mode === "time" && (result.mode2 === 15 || result.mode2 === 60)) {
    let keyPressTimeSum =
      result.keySpacing.reduce((total, val) => {
        return total + val;
      }) / 1000;
    if (
      keyPressTimeSum < result.testDuration - 1 ||
      keyPressTimeSum > result.testDuration + 1
    ) {
      console.error(
        `Could not validate key spacing sum for ${result.uid}. ${keyPressTimeSum} !~ ${result.testDuration}`
      );
      return false;
    }

    if (
      result.testDuration < result.mode2 - 1 ||
      result.testDuration > result.mode2 + 1
    ) {
      console.error(
        `Could not validate test duration for ${result.uid}. ${result.testDuration} !~ ${result.mode2}`
      );
      return false;
    }
  }

  if (result.chartData.raw !== undefined) {
    if (result.chartData.raw.filter((w) => w > 350).length > 0) return false;
  }

  if (result.wpm > 100 && result.consistency < 10) return false;

  return true;
}

function isTagPresetNameValid(name) {
  if (name === null || name === undefined || name === "") return false;
  if (name.length > 16) return false;
  return /^[0-9a-zA-Z_.-]+$/.test(name);
}

function isConfigKeyValid(name) {
  if (name === null || name === undefined || name === "") return false;
  if (name.length > 40) return false;
  return /^[0-9a-zA-Z_.\-#+]+$/.test(name);
}

function validateConfig(config) {
  Object.keys(config).forEach((key) => {
    if (!isConfigKeyValid(key)) {
      throw new MonkeyError(500, `Invalid config: ${key} failed regex check`);
    }
    // if (key === "resultFilters") return;
    // if (key === "customBackground") return;
    if (key === "customBackground" || key === "customLayoutfluid") {
      if (/[<>]/.test(config[key])) {
        throw new MonkeyError(
          500,
          `Invalid config: ${key}:${config.key} failed regex check`
        );
      }
    }
    let val = config[key];
    if (Array.isArray(val)) {
      val.forEach((valarr) => {
        if (!isConfigKeyValid(valarr)) {
          throw new MonkeyError(
            500,
            `Invalid config: ${key}:${valarr} failed regex check`
          );
        }
      });
    } else {
      if (!isConfigKeyValid(val)) {
        throw new MonkeyError(
          500,
          `Invalid config: ${key}:${val} failed regex check`
        );
      }
    }
  });
  return true;
}

function validateObjectValues(val) {
  let errCount = 0;
  if (val === null || val === undefined) {
    //
  } else if (Array.isArray(val)) {
    //array
    val.forEach((val2) => {
      errCount += validateObjectValues(val2);
    });
  } else if (typeof val === "object" && !Array.isArray(val)) {
    //object
    Object.keys(val).forEach((valkey) => {
      errCount += validateObjectValues(val[valkey]);
    });
  } else {
    if (!/^[0-9a-zA-Z._\-+]+$/.test(val)) {
      errCount++;
    }
  }
  return errCount;
}

module.exports = {
  isUsernameValid,
  validateResult,
  isTagPresetNameValid,
  validateConfig,
  validateObjectValues,
};
