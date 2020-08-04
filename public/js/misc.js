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
