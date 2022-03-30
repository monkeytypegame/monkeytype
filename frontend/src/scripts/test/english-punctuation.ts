let list: string[] = [];

export async function getList(): Promise<string[]> {
  if (list.length === 0) {
    return $.getJSON("languages/english_punctuation.json", function (data) {
      list = data;
      return list;
    });
  } else {
    return list;
  }
}

// Check if word is in the group of pairs so it can be replaced
export async function check(word: string): Promise<boolean> {
  const list = await getList();
  if (
    list.find((a) => word.match(RegExp(`^([\\W]*${a[0]}[\\W]*)$`, "gi"))) ===
    undefined
  ) {
    return false;
  } else {
    return true;
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
