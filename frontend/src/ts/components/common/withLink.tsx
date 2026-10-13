import {
  createLink,
  LinkComponent,
  LinkComponentProps,
  RegisteredRouter,
} from "@tanstack/solid-router";
import { Component, JSXElement, Show } from "solid-js";

/**
 * `Plain`, or with `to` an in-app link: a real anchor (href, cmd/ctrl+click
 * opens a new tab) navigating through the router with typed `to`, `params`
 * and `search`.
 *
 * The two call signatures are an intersection type rather than `function`
 * overloads: the dev-only solid-refresh transform rewrites component
 * declarations to `const`, which breaks overload signatures.
 */
export type WithLink<TPlainProps, TAnchor> = ((
  props: TPlainProps & { to?: never },
) => JSXElement) &
  LinkComponent<TAnchor>;

/**
 * Makes a component that renders `Plain`, or a router link rendering
 * `Anchor` (which gets the href and handlers) when given `to`.
 * `linkDefaults` are link props the caller's override.
 */
export function withLink<
  TPlainProps extends object,
  const TAnchor extends (props: never) => JSXElement,
>(
  Plain: Component<TPlainProps>,
  Anchor: TAnchor,
  linkDefaults: Partial<LinkComponentProps<TAnchor>> = {},
): WithLink<TPlainProps, TAnchor> {
  const Link = createLink(Anchor);
  // the link's props, checked by the WithLink signature
  type LinkProps = LinkComponentProps<
    TAnchor,
    RegisteredRouter,
    string,
    undefined,
    string,
    ""
  >;
  const component = (props: TPlainProps | LinkProps): JSXElement => (
    <Show when={"to" in props} fallback={<Plain {...(props as TPlainProps)} />}>
      <Link {...(linkDefaults as LinkProps)} {...(props as LinkProps)} />
    </Show>
  );
  return component as WithLink<TPlainProps, TAnchor>;
}
