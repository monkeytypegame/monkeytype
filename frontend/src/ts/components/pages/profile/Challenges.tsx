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

import { setup } from "../../../controllers/challenge-controller";
import { navigate } from "../../../controllers/route-controller";
import { bp } from "../../../states/breakpoints";
import { showModal } from "../../../states/modals";
import { restart } from "../../../test/test-logic";
import { FaSolidIcon } from "../../../types/font-awesome";
import { cn } from "../../../utils/cn";
import { AnimatedModal } from "../../common/AnimatedModal";
import { Balloon } from "../../common/Balloon";
import { Bar } from "../../common/Bar";
import { Button } from "../../common/Button";
import { Fa } from "../../common/Fa";

type ChallengeUnlock = Challenge & { addedAt?: number };

export function Challenges(props: {
  isAccountPage?: true;
  challenges: UserChallenges | undefined;
}) {
  const completedChallenges = createMemo((): ChallengeUnlock[] =>
    (
      typedEntries(props.challenges ?? {}) as [
        ChallengeName,
        { addedAt?: number | undefined } | undefined,
      ][]
    )
      .map(([name, val]) => ({ ...getChallenge(name), addedAt: val?.addedAt }))
      .filter((it) => it.name !== undefined) //filter unknown challenges
      .sort((a, b) =>
        a.initialCount !== b.initialCount
          ? a.initialCount - b.initialCount
          : a.name.localeCompare(b.name),
      ),
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
      <ChallengesModal
        completed={completedChallenges()}
        incompleted={incompleteChallenges()}
        percentage={unlockPercentage()}
      />
      <div class="flex w-full min-w-0 flex-col gap-4 rounded bg-sub-alt p-4">
        <h3>Challenges</h3>
        <Show when={props.isAccountPage}>
          <div class="text-sm text-sub">
            You&apos;ve unlocked {Object.keys(props.challenges ?? {}).length}/
            {getRegularChallenges().length} ({Math.round(unlockPercentage())}%)
          </div>
          <Bar bg="bg" fill="main" percent={unlockPercentage()} />
        </Show>

        <ChallengesList
          variant="short"
          challenges={completedChallenges().slice(0, 1)}
          completed={true}
        />

        <ChallengeIcons
          challenges={completedChallenges().slice(1, -1)}
          max={props.isAccountPage ? maxIcons() : 9999}
          completed={true}
        />

        <Show when={props.isAccountPage}>
          <p class="-mb-2 text-sub">locked challenges</p>
          <ChallengeIcons
            challenges={incompleteChallenges()}
            max={maxIcons()}
            completed={false}
          />

          <Button
            variant="text"
            text="View all challenges"
            class="ml-auto shrink-0"
            onClick={() => showModal("AllChallengesModal")}
          />
        </Show>
      </div>
    </Show>
  );
}

function ChallengeItem(props: {
  completed: boolean;
  challenge: ChallengeUnlock;
  variant: "iconOnly" | "short" | "full";
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
    props.challenge.addedAt !== undefined
      ? `\n\nunlocked: ${dateFormat(props.challenge.addedAt, "dd MMM yyyy HH:mm")}`
      : "",
  );

  return (
    <Balloon
      text={
        props.variant === "iconOnly"
          ? `${props.challenge.display}\n\n${props.challenge.description}${unlocked()}`
          : ""
      }
      break
      position={props.variant === "iconOnly" ? "right" : "down"}
      length="xlarge"
      class={cn("flex flex-row items-center gap-4 rounded")}
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
      <Show when={props.variant !== "iconOnly"}>
        <div>
          <h4
            class={cn(
              "text-md mb-1 font-bold",
              props.completed ? "text-text" : "text-sub",
            )}
          >
            {props.challenge.display}
            <Show
              when={!props.completed && props.challenge.settings !== undefined}
            >
              <Button
                variant="text"
                fa={{ icon: "fa-award" }}
                text="try challenge"
                class="text-xs opacity-0 group-hover:opacity-100"
                // oxlint-disable-next-line solid/reactivity
                onClick={async () => {
                  await navigate("/");
                  await setup(props.challenge.name);
                  restart({ nosave: true });
                }}
              />
            </Show>
          </h4>
          <p class="text-xs text-sub">
            {props.challenge.description}
            <Show
              when={
                props.variant === "short" &&
                props.challenge.addedAt !== undefined
              }
            >
              <br />
              Unlocked{" "}
              {dateFormat(props.challenge.addedAt ?? 0, "dd MMM yyyy HH:mm")}
            </Show>
          </p>
        </div>
      </Show>
    </Balloon>
  );
}

function ChallengeIcons(props: {
  challenges: Challenge[];
  max: number;
  completed: boolean;
}) {
  return (
    <div class="flex flex-wrap gap-2">
      <For each={props.challenges.slice(0, props.max)}>
        {(challenge) => (
          <ChallengeItem
            completed={props.completed}
            challenge={challenge}
            variant="iconOnly"
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

function ChallengesModal(props: {
  completed: ({ addedAt?: number } & Challenge)[];
  incompleted: Challenge[];
  percentage: number;
}) {
  return (
    <AnimatedModal id="AllChallengesModal" modalClass="max-w-[1200px]">
      <div class="text-sub">
        You&apos;ve unlocked {props.completed.length}/
        {getRegularChallenges().length} ({Math.round(props.percentage)}%)
      </div>

      <Bar bg="bg" fill="main" percent={props.percentage} />

      <ChallengesList
        variant="full"
        challenges={props.completed}
        completed={true}
      />

      <p class="-mb-2 text-sub">Locked Challenges</p>
      <ChallengesList
        variant="full"
        challenges={props.incompleted}
        completed={false}
      />
    </AnimatedModal>
  );
}

function ChallengesList(props: {
  challenges: ({ addedAt?: number } & Challenge)[];
  completed: boolean;
  variant: "short" | "full";
}) {
  return (
    <div class="flex flex-col gap-2">
      <For each={props.challenges}>
        {(challenge) => (
          <div
            class={cn(
              "group flex gap-4 rounded bg-sub-alt",
              props.variant === "full" && "p-2",
            )}
          >
            <div class="flex-1">
              <ChallengeItem
                completed={props.completed}
                challenge={challenge}
                variant={props.variant}
              />
            </div>
            <Show when={props.variant === "full" && props.completed}>
              <div class="self-end text-right text-xs text-sub">
                <Show when={challenge.addedAt}>
                  Unlocked{" "}
                  {dateFormat(challenge.addedAt ?? 0, "dd MMM yyyy HH:mm")}
                </Show>
              </div>
            </Show>
          </div>
        )}
      </For>
    </div>
  );
}
