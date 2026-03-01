import { JSXElement } from "solid-js";

import { Bar } from "../../common/Bar";

type Props = {
  percent: number;
};

export function AccountXpBar(props: Props): JSXElement {
  return (
    <div class="absolute top-full right-0 mt-1 w-full">
      <div class="text-[0.5em]">
        <Bar fill="main" bg="sub-alt" percent={props.percent} />
      </div>
      <div class="p-1 text-right backdrop-blur-sm">+30</div>
    </div>
  );
}
