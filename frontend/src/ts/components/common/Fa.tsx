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
        variant() === "solid" && "fas",
        variant() === "regular" && "far",
        variant() === "brand" && "fab",
        props.fixedWidth && "fa-fw",
        props.spin && "fa-spin",
        props.class,
      )}
      style={{
        "font-size": props.size !== undefined ? `${props.size}em` : undefined,
      }}
    ></i>
  );
}
