// temporal component, to be removed when page is converted to solid

import { JSXElement } from "solid-js";
import { promiseWithResolvers } from "../../utils/misc";

import { isAuthenticated } from "../../signals/user";
import Loader from "../common/Loader";
import { BlockingLoader } from "../common/BlockingLoader";

import { getActivePage } from "../../signals/core";

import { friends, pendingConnections } from "../../signals/connections";

const { promise: friendPageDonePromise, resolve: loadDone } =
  promiseWithResolvers();

export { friendPageDonePromise };

export function FriendsPageLoader(): JSXElement {
  return (
    <Loader
      active={() => isAuthenticated() && getActivePage() === "friends"}
      load={() => ({
        friends: {
          store: friends,
          keyframe: { percentage: 50, text: "Downloading friends..." },
        },
        pendingConnections: {
          store: pendingConnections,
          keyframe: {
            percentage: 90,

            text: "Downloading friend requests...",
          },
        },
      })}
      loader={(kf) => <BlockingLoader keyframe={kf} />}
      onComplete={() => loadDone()}
    />
  );
}
