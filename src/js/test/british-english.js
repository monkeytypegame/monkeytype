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
  let replacement = list.find((a) =>
    word.match(RegExp(`([\\W\\D]*)${a[0]}([\\W\\D]*)`, "gi"))
  );
  return replacement
    ? word.replace(
        RegExp(`([\\W\\D]*)${replacement[0]}([\\W\\D]*)`, "gi"),
        (_, $1, $2) =>
          $1 +
          (word.charAt(0) === word.charAt(0).toUpperCase()
            ? capitalizeFirstLetter(replacement[1])
            : replacement[1]) +
          $2
      )
    : word;
}
