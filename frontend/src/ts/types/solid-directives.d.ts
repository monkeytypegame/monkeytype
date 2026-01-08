import type { Accessor } from "solid-js";

export type VisibleDirectiveProps = Accessor<{
  value: boolean;
  withAnimation: boolean;
}>;

declare module "solid-js" {
  namespace JSX {
    // oxlint-disable-next-line consistent-type-definitions
    interface Directives {
      visible: VisibleDirectiveProps;
    }
  }
}
