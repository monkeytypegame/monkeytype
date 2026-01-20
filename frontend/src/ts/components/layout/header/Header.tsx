import { JSXElement } from "solid-js";

import { Logo } from "./Logo";
import { Nav } from "./Nav";

export function Header(): JSXElement {
  return (
    <header class="flex place-items-center gap-2">
      <Logo />
      <Nav />
    </header>
  );
}
