import { capitalizeFirstLetter } from "./misc";

let list = null;

export async function getList() {
  if (list == null) {
    return $.getJSON("languages/britishenglish.json", function (data) {
      list = data;
      return list;
    });
  } else {
    return list;
  }
}

export async function replace(word) {
  let list = await getList();
  var britishWord =
    list[list.findIndex((a) => a[0] === word.toLowerCase())]?.[1];
  if (typeof britishWord !== "undefined") {
    if (word.charAt(0) === word.charAt(0).toUpperCase()) {
      britishWord = capitalizeFirstLetter(britishWord);
    }
  }
  return britishWord;
}
