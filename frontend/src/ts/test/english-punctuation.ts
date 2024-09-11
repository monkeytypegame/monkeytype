import { randomElementFromArray } from "../utils/arrays";
import { capitalizeFirstLetterOfEachWord } from "../utils/strings";

type Pair = [string, string[]];

const pairs: Pair[] = [
  ["are", ["aren't"]],
  ["can", ["can't"]],
  ["could", ["couldn't"]],
  ["did", ["didn't"]],
  ["does", ["doesn't"]],
  ["do", ["don't"]],
  ["had", ["hadn't"]],
  ["has", ["hasn't"]],
  ["have", ["haven't"]],
  ["is", ["isn't"]],
  ["it", ["it's", "it'll"]],
  ["i", ["i'm", "i'll", "i've", "i'd"]],
  ["you", ["you'll", "you're", "you've", "you'd"]],
  ["that", ["that's", "that'll", "that'd"]],
  ["must", ["mustn't", "must've"]],
  ["there", ["there's", "there'll", "there'd"]],
  ["he", ["he's", "he'll", "he'd"]],
  ["she", ["she's", "she'll", "she'd"]],
  ["we", ["we're", "we'll", "we'd"]],
  ["they", ["they're", "they'll", "they'd"]],
  ["should", ["shouldn't", "should've"]],
  ["was", ["wasn't"]],
  ["were", ["weren't"]],
  ["will", ["won't"]],
  ["would", ["wouldn't", "would've"]],
  ["going", ["goin'"]],
];

// Check if word is in the group of pairs so it can be replaced
export async function check(word: string): Promise<boolean> {
  if (
    pairs.find((pair) =>
      word.match(RegExp(`^([\\W]*${pair[0]}[\\W]*)$`, "gi"))
    ) === undefined
  ) {
    return false;
  }
  return true;
}

export async function replace(word: string): Promise<string> {
  const replacement = pairs.find((pair) =>
    word.match(RegExp(`^([\\W]*${pair[0]}[\\W]*)$`, "gi"))
  );

  if (replacement === undefined) return word;

  const randomReplacement = randomElementFromArray(replacement[1]);

  return word.replace(
    RegExp(`^(?:([\\W]*)(${replacement[0]})([\\W]*))$`, "gi"),
    (_, $1, $2, $3) =>
      $1 +
      ($2.charAt(0) === $2.charAt(0).toUpperCase()
        ? shouldWholeReplacementWordBeCapitalised($2 as string)
          ? randomReplacement.toUpperCase()
          : capitalizeFirstLetterOfEachWord(randomReplacement)
        : randomReplacement) +
      $3
  );
}

function shouldWholeReplacementWordBeCapitalised(
  wordToBeReplaced: string
): boolean {
  if (wordToBeReplaced === "I") return false;
  if (wordToBeReplaced === wordToBeReplaced.toUpperCase()) return true;
  return false;
}
