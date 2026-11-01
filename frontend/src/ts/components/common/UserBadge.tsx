import { JSXElement, Show } from "solid-js";

import {
  badges,
  UserBadge as UserBadgeType,
} from "../../controllers/badge-controller";
import { BreakpointKey } from "../../states/breakpoints";
import { cn } from "../../utils/cn";
import { Balloon, BalloonProps } from "./Balloon";
import { Fa } from "./Fa";

export function UserBadge(props: {
  id?: number;
  iconOnly?: true;
  class?: string;
  balloon?: Omit<BalloonProps, "text">;
  hideTextOnWidth?: BreakpointKey | false;
  hideDescription?: boolean;
}): JSXElement {
  const badge = (): UserBadgeType | undefined =>
    props.id !== undefined ? badges[props.id] : undefined;

  const hideClasses: Record<BreakpointKey, string> = {
    xxs: "hidden xs:inline",
    xs: "hidden sm:inline",
    sm: "hidden md:inline",
    md: "hidden lg:inline",
    lg: "hidden xl:inline",
    xl: "hidden 2xl:inline",
    xxl: "hidden 3xl:inline",
  };

  return (
    <Show when={badge() !== undefined}>
      <Balloon
        class={cn(
          "rounded-[0.5em] px-[0.5em] py-[0.25em] text-em-xs whitespace-nowrap",
          props.class,
        )}
        text={props.hideDescription ? "" : (badge()?.description ?? "")}
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
            fixedWidth={props.iconOnly === true}
          />
          <Show when={!props.iconOnly}>
            <span
              class={cn(
                "pl-[0.75em]",
                props.hideTextOnWidth !== false
                  ? hideClasses[props.hideTextOnWidth ?? "md"]
                  : "",
              )}
            >
              {badge()?.name}
            </span>
          </Show>
        </Show>
      </Balloon>
    </Show>
  );
}
