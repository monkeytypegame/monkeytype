const listsObject = {
  commandsChallenges,
  commandsLanguages,
  commandsDifficulty,
  commandsLazyMode,
  commandsPaceCaret,
  commandsShowAverage,
  commandsMinWpm,
  commandsMinAcc,
  commandsMinBurst,
  commandsFunbox,
  commandsConfidenceMode,
  commandsStopOnError,
  commandsLayouts,
  commandsOppositeShiftMode,
  commandsTags,
};

export type ListsObjectKeys = keyof typeof listsObject;

export function getList(list: ListsObjectKeys): MonkeyTypes.CommandsGroup {
  return listsObject[list];
}
