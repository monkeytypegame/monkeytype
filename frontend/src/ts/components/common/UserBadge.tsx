import { JSXElement, Show } from "solid-js";

import {
  badges,
  UserBadge as UserBadgeType,
} from "../../controllers/badge-controller";
import { Balloon, BalloonProps } from "./Balloon";
import { Fa } from "./Fa";

export function UserBadge(props: {
  id?: number;
  iconOnly?: true;
  balloon?: Omit<BalloonProps, "text">;
}): JSXElement {
  const badge = (): UserBadgeType | undefined =>
    props.id !== undefined ? badges[props.id] : undefined;
  return (
    <Show when={badge() !== undefined}>
      <Balloon
        class="rounded-[0.5em] text-[0.9em]"
        text={badge()?.description ?? ""}
        {...props.balloon}
        style={{
          background: badge()?.background ?? "inherit",
          color: badge()?.color ?? "inherit",
          ...badge()?.customStyle,
        }}
      >
        <Show when={badge()?.icon}>
          <Fa
            icon={badge()?.icon ?? "fa-question"}
            fixedWidth={false}
            class="px-[0.75em] py-[0.5em]"
          />
          <Show when={!props.iconOnly}>
            <span class="hidden pr-[0.75em] md:inline">{badge()?.name}</span>
          </Show>
        </Show>
      </Balloon>
    </Show>
  );
}
