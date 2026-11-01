import { Command } from "./types";

type Match = { matchCount: number; matchStrength: number };

function stripPunctuation(str: string): string {
  return str.replace(/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/g, "");
}

function splitWords(str: string): string[] {
  return str.toLowerCase().split(" ").map(stripPunctuation);
}

/**
 * Decides which commands match the search input. Each input word can match
 * the start of one word of a command's display or alias. Only commands with
 * the highest match count and match strength (total matched characters) are
 * kept. A leading `>` (the single list prefix) is ignored.
 *
 * @param commands the commands to search
 * @param availability whether each command (by index) is available
 * @param input the raw search input
 * @param useSingleListDisplay match against the display including the parent command
 * @returns whether each command (by index) was found
 */
export function findMatchingCommands(
  commands: Command[],
  availability: boolean[],
  input: string,
  useSingleListDisplay: boolean,
): boolean[] {
  const inputNoQuickSingle = input.replace(/^>/gi, "").toLowerCase().trim();

  const inputSplit =
    inputNoQuickSingle.length === 0
      ? []
      : inputNoQuickSingle.split(" ").map(stripPunctuation).filter(Boolean);

  const matches: Match[] = [];
  const matchCounts: number[] = [];

  for (const [index, command] of commands.entries()) {
    if (availability[index] !== true) {
      matches.push({ matchCount: -1, matchStrength: -1 });
      continue;
    }

    if (inputSplit.length === 0) {
      matches.push({ matchCount: 0, matchStrength: 0 });
      continue;
    }

    const displaySplit = splitWords(
      useSingleListDisplay
        ? (command.singleListDisplayNoIcon ?? "") || command.display
        : command.display,
    );
    const aliasSplit =
      command.alias !== undefined ? splitWords(command.alias) : [];

    const displayAliasSplit = displaySplit.concat(aliasSplit);
    const displayAliasMatchArray: (number | null)[] = displayAliasSplit.map(
      () => null,
    );

    let matchStrength = 0;

    for (const [inputIndex, inputWord] of inputSplit.entries()) {
      for (const [
        displayAliasIndex,
        displayAlias,
      ] of displayAliasSplit.entries()) {
        if (
          displayAlias.startsWith(inputWord) &&
          displayAliasMatchArray[displayAliasIndex] === null &&
          !displayAliasMatchArray.includes(inputIndex)
        ) {
          displayAliasMatchArray[displayAliasIndex] = inputIndex;
          matchStrength += inputWord.length;
        }
      }
    }

    const matchCount = displayAliasMatchArray.filter((i) => i !== null).length;

    matchCounts.push(matchCount);
    matches.push({ matchCount, matchStrength });
  }

  const maxMatchStrength = Math.max(...matches.map((m) => m.matchStrength));

  let minMatchCountToShow = inputSplit.length;

  do {
    const count = matchCounts.filter((m) => m >= minMatchCountToShow).length;
    if (count > 0) {
      break;
    }
    minMatchCountToShow--;
  } while (minMatchCountToShow > 0);

  if (minMatchCountToShow === 0) {
    minMatchCountToShow = 1;
  }

  return matches.map(
    (match) =>
      match.matchCount >= minMatchCountToShow &&
      match.matchStrength >= maxMatchStrength,
  );
}
