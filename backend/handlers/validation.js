import MonkeyError from "./error";

export function isUsernameValid(name) {
  if (name === null || name === undefined || name === "") return false;
  if (/.*miodec.*/.test(name.toLowerCase())) return false;
  //sorry for the bad words
  if (
    /.*(bitly|fuck|bitch|shit|pussy|nigga|niqqa|niqqer|nigger|ni99a|ni99er|niggas|niga|niger|cunt|faggot|retard).*/.test(
      name.toLowerCase()
    )
  )
    return false;
  if (name.length > 14) return false;
  if (/^\..*/.test(name.toLowerCase())) return false;
  return /^[0-9a-zA-Z_.-]+$/.test(name);
}

export function isTagPresetNameValid(name) {
  if (name === null || name === undefined || name === "") return false;
  if (name.length > 16) return false;
  return /^[0-9a-zA-Z_.-]+$/.test(name);
}

function isConfigKeyValid(name) {
  if (name === null || name === undefined || name === "") return false;
  if (name.length > 40) return false;
  return /^[0-9a-zA-Z_.\-#+]+$/.test(name);
}

export function validateConfig(config) {
  Object.keys(config).forEach((key) => {
    if (!isConfigKeyValid(key)) {
      throw new MonkeyError(500, `Invalid config: ${key} failed regex check`);
    }
    // if (key === "resultFilters") return;
    // if (key === "customBackground") return;
    if (key === "customBackground" || key === "customLayoutfluid") {
      let val = config[key];
      if (/[<>]/.test(val)) {
        throw new MonkeyError(
          500,
          `Invalid config: ${key}:${val} failed regex check`
        );
      }
    } else {
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
    }
  });
  return true;
}

export function validateObjectValues(val) {
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
