import { IconDefinition } from "@fortawesome/fontawesome-common-types";
import { createMemo, JSXElement, Show } from "solid-js";

import style from "./Fa.module.css";

export type FaProps = {
  fixedWidth?: boolean;
  spin?: boolean;
  size?: number;
  icon: IconDefinition;
};

export function Fa(props: FaProps): JSXElement {
  const i = createMemo(() => props.icon?.icon);

  return (
    // <div
    // class="flex items-center justify-center"
    //   style={{
    //     "font-size": props.size !== undefined ? `${props.size}em` : undefined,
    //   }}
    // >
    <svg
      classList={{
        [style["spin"] as string]: props.spin === true,
      }}
      style={{
        display: "inline",
        height: "1em",
        "vertical-align": "-0.125em",
        "transform-origin": "center center",
        "font-size": props.size !== undefined ? `${props.size}em` : undefined,
        overflow: "visible",
        width: props.fixedWidth === true ? "1.25em" : undefined,
      }}
      viewBox={`0 0 ${i()[0]} ${i()[1]}`}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g>
        {/* <g transform={`translate(${i()[0] / 2} ${i()[1] / 2})`}> */}
        <Show
          when={typeof i()[4] === "string"}
          fallback={
            <>
              <path
                d={i()[4][0]}
                // transform={`translate(${i()[0] / -2} ${i()[1] / -2})`}
              ></path>
              <path
                d={i()[4][1]}
                fill={"currentColor"}
                // transform={`translate(${i()[0] / -2} ${i()[1] / -2})`}
              ></path>
            </>
          }
        >
          <path
            d={i()[4] as string}
            fill={"currentColor"}
            // transform={`translate(${i()[0] / -2} ${i()[1] / -2})`}
          ></path>
        </Show>
      </g>
    </svg>
    // </div>
  );
}
