import {
  Challenge,
  getChallenge,
  getRegularChallenges,
} from "@monkeytype/challenges";
import { ChallengeName } from "@monkeytype/schemas/challenges";
import { UserChallenges } from "@monkeytype/schemas/users";
import { typedEntries } from "@monkeytype/util/objects";
import { format as dateFormat } from "date-fns";
import { createMemo, For, Show } from "solid-js";

import { bp } from "../../../states/breakpoints";
import { showModal } from "../../../states/modals";
import { FaSolidIcon } from "../../../types/font-awesome";
import { cn } from "../../../utils/cn";
import { AnimatedModal } from "../../common/AnimatedModal";
import { Balloon } from "../../common/Balloon";
import { Bar } from "../../common/Bar";
import { Button } from "../../common/Button";
import { Fa } from "../../common/Fa";
import { H2 } from "../../common/Headers";

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
      .map(([name]) => getChallenge(name))
      .sort((a, b) =>
        a.initialCount !== b.initialCount
          ? a.initialCount - b.initialCount
          : a.name.localeCompare(b.name),
      )
      .filter((it) => it !== undefined),
  );

  const completedNames = createMemo(
    () => new Set<ChallengeName>(completedChallenges().map((it) => it.name)),
  );

  const incompleteChallenges = createMemo((): Challenge[] =>
    getRegularChallenges()
      .filter((it) => !completedNames().has(it.name))
      .sort((a, b) =>
        a.initialCount !== b.initialCount
          ? b.initialCount - a.initialCount
          : a.name.localeCompare(b.name),
      ),
  );

  const maxIcons = createMemo(() => {
    const points = bp();
    if (points.lg) return 15;
    if (points.md) return 10;
    if (points.xs) return 5;
    if (points.xxs) return 3;

    return 7;
  });

  const unlockPercentage = () =>
    (Object.keys(props.challenges ?? {}).length * 100) /
    getRegularChallenges().length;

  return (
    <Show when={props.challenges !== undefined}>
      <ChallengesModal completed={completedChallenges()} />
      <div class="flex w-full min-w-0 flex-col gap-4 rounded bg-sub-alt p-4">
        <h3>Challenges</h3>
        <div class="text-sub">
          You&apos;ve unlocked {Object.keys(props.challenges ?? {}).length}/
          {getRegularChallenges().length} ({Math.round(unlockPercentage())}%)
        </div>

        <Bar bg="bg" fill="main" percent={unlockPercentage()} />

        <For each={completedChallenges().slice(0, 1)}>
          {(challenge) => (
            <ChallengeItem
              completed={true}
              challenge={challenge}
              unlocked={props.challenges?.[challenge.name]?.addedAt}
            />
          )}
        </For>

        <ChallengeIcons
          challenges={completedChallenges().slice(1, -1)}
          max={maxIcons()}
          completed={true}
        />

        <p class="-mb-2 text-sub">Locked Challenges</p>
        <ChallengeIcons
          challenges={incompleteChallenges()}
          max={maxIcons()}
          completed={false}
        />

        <Button
          variant="text"
          text="View Challenges"
          class="ml-auto shrink-0"
          onClick={() => showModal("AllChallengesModal")}
        />
      </div>
    </Show>
  );
}

function ChallengeItem(props: {
  completed: boolean;
  challenge: Challenge;
  iconOnly?: boolean;
  unlocked?: number;
}) {
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

  const unlocked = createMemo(() =>
    props.unlocked !== undefined
      ? `\n\nunlocked: ${dateFormat(props.unlocked, "dd MMM yyyy HH:mm")}`
      : "",
  );

  return (
    <Balloon
      text={
        props.iconOnly
          ? `${props.challenge.display}\n\n${props.challenge.description}${unlocked()}`
          : ""
      }
      break
      position={props.iconOnly ? "right" : "down"}
      length="xlarge"
      class={cn(
        "flex flex-row items-center gap-4 rounded",
        props.completed ? "text-text" : "text-sub",
      )}
    >
      <div
        class={cn(
          props.completed ? "bg-main" : "bg-bg",
          props.completed ? "text-bg" : "text-sub",
          "flex aspect-square items-center justify-center rounded",
          "h-10",
        )}
      >
        <Fa icon={icon()} size={1.25} />
      </div>
      <Show when={!props.iconOnly}>
        <div>
          <h4 class="text-md">{props.challenge.display}</h4>
          <p class="text-xs">{props.challenge.description}</p>
        </div>
      </Show>
    </Balloon>
  );
}

function ChallengesModal(_props: { completed: Challenge[] }) {
  return (
    <AnimatedModal id="AllChallengesModal">
      <H2 text="Challenges" />
    </AnimatedModal>
  );
}

function ChallengeIcons(props: {
  challenges: Challenge[];
  max: number;
  completed: boolean;
}) {
  return (
    <div class="flex gap-2">
      <For each={props.challenges.slice(0, props.max)}>
        {(challenge) => (
          <ChallengeItem
            completed={props.completed}
            challenge={challenge}
            iconOnly
          />
        )}
      </For>
      <Show when={props.challenges.length > props.max}>
        <div class="flex h-full items-center px-4 text-right">
          + {props.challenges.length - props.max}
        </div>
      </Show>
    </div>
  );
}
