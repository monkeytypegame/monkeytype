import { JSXElement } from "solid-js";

import {
  FaBrandIcon,
  FaObject,
  FaRegularIcon,
  FaSolidIcon,
} from "../../types/font-awesome";

export type FaUniversalProps = {
  fixedWidth?: boolean;
  spin?: boolean;
  size?: number;
} & FaObject;

export function Fa(props: FaUniversalProps): JSXElement {
  const variant = props.variant ?? "solid";
  if (variant === "solid") {
    return (
      <FaSolid
        icon={props.icon as FaSolidIcon}
        fixedWidth={props.fixedWidth}
        spin={props.spin}
        size={props.size}
      />
    );
  } else if (variant === "regular") {
    return (
      <FaRegular
        icon={props.icon as FaRegularIcon}
        fixedWidth={props.fixedWidth}
        spin={props.spin}
        size={props.size}
      />
    );
  } else {
    return (
      <FaBrand
        icon={props.icon as FaBrandIcon}
        fixedWidth={props.fixedWidth}
        spin={props.spin}
        size={props.size}
      />
    );
  }
}

export function FaSolid(props: {
  icon: FaSolidIcon;
  fixedWidth?: boolean;
  spin?: boolean;
  size?: number;
}): JSXElement {
  return (
    <i
      class={`fas fa-${props.icon}`}
      classList={{
        ["fa-fw"]: props.fixedWidth === true,
        ["fa-spin"]: props.spin === true,
      }}
      style={{
        "font-size": props.size !== undefined ? `${props.size}em` : undefined,
      }}
    ></i>
  );
}

export function FaRegular(props: {
  icon: FaRegularIcon;
  fixedWidth?: boolean;
  spin?: boolean;
  size?: number;
}): JSXElement {
  return (
    <i
      class={`far fa-${props.icon}`}
      classList={{
        ["fa-fw"]: props.fixedWidth === true,
        ["fa-spin"]: props.spin === true,
      }}
      style={{
        "font-size": props.size !== undefined ? `${props.size}em` : undefined,
      }}
    ></i>
  );
}

export function FaBrand(props: {
  icon: FaBrandIcon;
  fixedWidth?: boolean;
  spin?: boolean;
  size?: number;
}): JSXElement {
  return (
    <i
      class={`fab fa-${props.icon}`}
      classList={{
        ["fa-fw"]: props.fixedWidth === true,
        ["fa-spin"]: props.spin === true,
      }}
      style={{
        "font-size": props.size !== undefined ? `${props.size}em` : undefined,
      }}
    ></i>
  );
}
