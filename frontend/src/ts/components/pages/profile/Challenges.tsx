import {
  Challenge,
  getChallenge,
  getRegularChallenges,
} from "@monkeytype/challenges";
import { ChallengeName } from "@monkeytype/schemas/challenges";
import { UserChallenges } from "@monkeytype/schemas/users";
import { typedEntries } from "@monkeytype/util/objects";
import { createMemo, For, Show } from "solid-js";

import { FaSolidIcon } from "../../../types/font-awesome";
import { cn } from "../../../utils/cn";
import { Fa } from "../../common/Fa";

function sortNewestFirst(
  a: [ChallengeName, { addedAt?: number | undefined } | undefined],
  b: [ChallengeName, { addedAt?: number | undefined } | undefined],
): number {
  const aHas = a[1]?.addedAt !== undefined;
  const bHas = b[1]?.addedAt !== undefined;
  if (aHas && !bHas) return -1;
  if (!aHas && bHas) return 1;
  if (aHas && bHas) return (b[1]?.addedAt ?? 0) - (a[1]?.addedAt ?? 0);
  return a[0].localeCompare(b[0]);
}

export function Challenges(props: {
  isAccountPage?: true;
  challenges: UserChallenges | undefined;
}) {
  const completedChallenges = createMemo((): Challenge[] =>
    (
      typedEntries(props.challenges ?? {}) as [
        ChallengeName,
        { addedAt?: number | undefined } | undefined,
      ][]
    )
      .sort(sortNewestFirst)
      .map(([name]) => getChallenge(name))
      .filter((it) => it !== undefined),
  );

  const completedNames = createMemo(
    () => new Set<ChallengeName>(completedChallenges().map((it) => it.name)),
  );

  const incompleteChallenges = createMemo((): Challenge[] =>
    getRegularChallenges().filter((it) => !completedNames().has(it.name)),
  );

  return (
    <Show when={props.challenges !== undefined}>
      <div class="flex flex-col gap-4 rounded bg-sub-alt p-4">
        <div class="flex w-full flex-row">
          <h3>Challenges</h3>
          <div class="ml-auto text-sub">
            {Object.keys(props.challenges ?? {}).length} /{" "}
            {getRegularChallenges().length} completed
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <For each={completedChallenges()}>
            {(challenge) => (
              <ChallengeItem completed={true} challenge={challenge} />
            )}
          </For>
          <Show when={props.isAccountPage}>
            <For each={incompleteChallenges()}>
              {(challenge) => (
                <ChallengeItem completed={false} challenge={challenge} />
              )}
            </For>
          </Show>
        </div>
      </div>
    </Show>
  );
}

function ChallengeItem(props: { completed: boolean; challenge: Challenge }) {
  const icon = (): FaSolidIcon => {
    switch (props.challenge.category) {
      case "accuracy":
        return "fa-bullseye";
      case "champions":
        return "fa-crown";
      case "endurance":
        return "fa-running";
      case "funbox":
        return "fa-gamepad";
      case "speed":
        return "fa-tachometer-alt";
      case "script":
        return "fa-file-alt";

      default:
        return "fa-trophy";
    }
  };
  return (
    <div
      class={cn(
        "flex flex-row gap-4 rounded bg-bg p-4",
        props.completed ? "text-text" : "text-sub",
      )}
    >
      <div
        class={cn(
          props.completed ? "bg-main" : "bg-sub-alt",
          props.completed ? "text-bg" : "text-sub",
          "flex aspect-square h-14 items-center justify-center rounded-full",
        )}
      >
        <Fa icon={icon()} size={1.25} />
      </div>
      <div>
        <h4 class="text-md">{props.challenge.display}</h4>
        <p class="text-xs">{props.challenge.description}</p>
      </div>
    </div>
  );
}
