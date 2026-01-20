import { JSXElement } from "solid-js";

import { getFocus } from "../../../signals/core";
import { cn } from "../../../utils/cn";
import { Button } from "../../common/Button";

export function Nav(): JSXElement {
  return (
    <nav
      class={cn("flex w-full gap-2 transition-opacity", {
        "opacity-0": getFocus(),
      })}
    >
      <Button
        type="text"
        icon="fas fa-fw fa-keyboard"
        onClick={() => {
          //
        }}
      />
      <Button
        type="text"
        icon="fas fa-fw fa-crown"
        onClick={() => {
          //
        }}
      />
      <Button
        type="text"
        icon="fas fa-fw fa-info"
        onClick={() => {
          //
        }}
      />
      <Button
        type="text"
        icon="fas fa-fw fa-cog"
        onClick={() => {
          //
        }}
      />
      <div class="grow"></div>
      <Button
        type="text"
        icon="fas fa-fw fa-bell"
        onClick={() => {
          //
        }}
      />
      <Button
        type="text"
        icon="far fa-fw fa-user"
        onClick={() => {
          //
        }}
      />
    </nav>
  );
}
