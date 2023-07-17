import { capitalizeFirstLetterOfEachWord } from "../utils/misc";

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

  if (word.includes("-")) {
    //this handles hyphenated words (for example "cream-colored") to make sure
    //we don't have to add every possible combination to the list
    return (
      await Promise.all(word.split("-").map(async (w) => replace(w)))
    ).join("-");
  } else {
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
}
