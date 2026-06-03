import { UserProfile } from "@monkeytype/schemas/users";
import { For, JSXElement } from "solid-js";

import { Achievement, getAchievements } from "../../../utils/achievements";
import { cn } from "../../../utils/cn";
import { Bar } from "../../common/Bar";
import { Fa } from "../../common/Fa";

export function Achievements(props: { profile: UserProfile }): JSXElement {
  const achievements = () => getAchievements(props.profile);

  return (
    <div class="grid gap-4 rounded bg-sub-alt p-4">
      <div class="flex items-center justify-between gap-4">
        <div>
          <div class="text-lg text-text">Achievements</div>
          <div class="text-sm text-sub">
            A barebones read-only overview of profile milestones.
          </div>
        </div>
        <div class="text-sm text-sub">
          {achievements().filter((it) => it.unlocked).length}/
          {achievements().length} unlocked
        </div>
      </div>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <For each={achievements()}>
          {(achievement) => <AchievementCard achievement={achievement} />}
        </For>
      </div>
    </div>
  );
}

function AchievementCard(props: { achievement: Achievement }): JSXElement {
  return (
    <div
      class={cn(
        "grid gap-3 rounded bg-bg p-4 transition-colors",
        props.achievement.unlocked ? "text-text" : "text-sub",
      )}
    >
      <div class="flex items-start gap-3">
        <div
          class={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            props.achievement.unlocked
              ? "bg-main text-bg"
              : "bg-sub-alt text-sub",
          )}
        >
          <Fa icon={props.achievement.icon} />
        </div>
        <div class="min-w-0">
          <div class="font-semibold">{props.achievement.name}</div>
          <div class="text-sm">{props.achievement.description}</div>
        </div>
      </div>
      <div class="flex items-center gap-3 text-xs">
        <Bar
          percent={props.achievement.progressPercent}
          fill={props.achievement.unlocked ? "main" : "text"}
          bg="sub-alt"
        />
        <div class="shrink-0">{props.achievement.progressLabel}</div>
      </div>
    </div>
  );
}
