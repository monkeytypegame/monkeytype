import { capitalizeFirstLetter } from "../misc";

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
    word.match(RegExp(`^([\\W]*${a[0]}[\\W]*)$`, "gi"))
  );
  return replacement
    ? word.replace(
        RegExp(`^(?:([\\W]*)(${replacement[0]})([\\W]*))$`, "gi"),
        (_, $1, $2, $3) =>
          $1 +
          ($2.charAt(0) === $2.charAt(0).toUpperCase()
            ? $2 === $2.toUpperCase()
              ? replacement[1].toUpperCase()
              : capitalizeFirstLetter(replacement[1])
            : replacement[1]) +
          $3
      )
    : word;
}
