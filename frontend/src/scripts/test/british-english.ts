import { capitalizeFirstLetterOfEachWord } from "../misc";

let list: string[] = [];

export async function getList(): Promise<string[]> {
  if (list.length === 0) {
    return $.getJSON("languages/britishenglish.json", function (data) {
      list = data;
      return list;
    });
  } else {
    return list;
  }
}

export async function replace(word: string): Promise<string> {
  const list = await getList();
  const replacement = list.find((a) =>
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
              : capitalizeFirstLetterOfEachWord(replacement[1])
            : replacement[1]) +
          $3
      )
    : word;
}
