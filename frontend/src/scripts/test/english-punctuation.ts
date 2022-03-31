let pairsList: string[] = [];

export async function getList(): Promise<string[]> {
  if (pairsList.length === 0) {
    return $.getJSON("languages/english_punctuation.json", function (data) {
      pairsList = data;
      return pairsList;
    });
  }
  return pairsList;
}

// Check if word is in the group of pairs so it can be replaced
export async function check(word: string): Promise<boolean> {
  const list = await getList();
  if (
    list.find((a) => word.match(RegExp(`^([\\W]*${a[0]}[\\W]*)$`, "gi"))) ===
    undefined
  ) {
    return false;
  }
  return true;
}

export async function replace(word: string): Promise<string> {
  const list = await getList();
  const replacement = list.find((a) =>
    word.match(RegExp(`^([\\W]*${a[0]}[\\W]*)$`, "gi"))
  );
  return replacement
    ? word.replace(
        RegExp(`^(?:([\\W]*)(${replacement[0]})([\\W]*))$`, "gi"),
        replacement[1]
      )
    : word;
}
