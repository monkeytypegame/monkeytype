import { JSXElement } from "solid-js";

import { FaObject } from "../../types/font-awesome";

export type FaProps = {
  fixedWidth?: boolean;
  spin?: boolean;
  size?: number;
} & FaObject;

export function Fa(props: FaProps): JSXElement {
  const variant = (): string => props.variant ?? "solid";
  return (
    <i
      class={props.icon}
      classList={{
        ["fas"]: variant() === "solid",
        ["far"]: variant() === "regular",
        ["fab"]: variant() === "brand",
        ["fa-fw"]: props.fixedWidth === true,
        ["fa-spin"]: props.spin === true,
      }}
      style={{
        "font-size": props.size !== undefined ? `${props.size}em` : undefined,
      }}
    ></i>
  );
}
