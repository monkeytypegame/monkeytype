import { JSXElement, Show } from "solid-js";

import {
  badges,
  UserBadge as UserBadgeType,
} from "../../controllers/badge-controller";
import { Fa } from "./Fa";

export function UserBadge(props: { id?: number; iconOnly?: true }): JSXElement {
  const badge = (): UserBadgeType | undefined =>
    props.id !== undefined ? badges[props.id] : undefined;
  return (
    <Show when={badge() !== undefined}>
      <div
        class="rounded-[0.5em] text-[0.9em]"
        aria-label={badge()?.description}
        data-balloon-pos="right"
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
      </div>
    </Show>
  );
}
