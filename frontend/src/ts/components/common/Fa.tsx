import { JSXElement } from "solid-js";

import { FaObject } from "../../types/font-awesome";
import { cn } from "../../utils/cn";

export type FaProps = {
  fixedWidth?: boolean;
  spin?: boolean;
  size?: number;
  class?: string;
} & FaObject;

export function Fa(props: FaProps): JSXElement {
  const variant = (): string => props.variant ?? "solid";
  return (
    <i
      class={cn(
        props.icon,
        {
          fas: variant() === "solid",
          far: variant() === "regular",
          fab: variant() === "brand",
          "fa-fw": props.fixedWidth,
          "fa-spin": props.spin,
        },
        props.class,
      )}
      style={{
        "font-size": props.size !== undefined ? `${props.size}em` : undefined,
      }}
    ></i>
  );
}
