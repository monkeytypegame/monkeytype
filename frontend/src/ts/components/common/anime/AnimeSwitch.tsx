import { JSXElement, ParentProps, Switch } from "solid-js";

import { AnimePresence } from "./AnimePresence";

export function AnimeSwitch(props: ParentProps): JSXElement {
  // const duration = () => props.duration ?? 250;

  return (
    <AnimePresence exitBeforeEnter>
      <Switch>{props.children}</Switch>
    </AnimePresence>
  );
}
