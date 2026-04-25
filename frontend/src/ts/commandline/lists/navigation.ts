import { navigate } from "../../controllers/route-controller";
import { isAuthenticated } from "../../states/core";
import { toggleFullscreen } from "../../utils/misc";
import { Command, withValidation } from "../types";
import { remoteValidation } from "../../utils/remote-validation";
import { UserNameSchema } from "@monkeytype/schemas/users";
import Ape from "../../ape";

const commands: Command[] = [
  {
    id: "viewTypingPage",
    display: "View Typing Page",
    alias: "navigate go to start begin type test",
    icon: "fa-keyboard",
    exec: (): void => {
      void navigate("/");
    },
  },
  {
    id: "viewLeaderboards",
    display: "View Leaderboards",
    alias: "navigate go to",
    icon: "fa-crown",
    exec: (): void => {
      void navigate("/leaderboards");
    },
  },
  {
    id: "viewAbout",
    display: "View About Page",
    alias: "navigate go to",
    icon: "fa-info",
    exec: (): void => {
      void navigate("/about");
    },
  },
  {
    id: "viewSettings",
    display: "View Settings Page",
    alias: "navigate go to",
    icon: "fa-cog",
    exec: (): void => {
      void navigate("/settings");
    },
  },

  {
    id: "viewAccount",
    display: "View Account Page",
    alias: "navigate go to stats",
    icon: "fa-user",
    exec: (): void => {
      isAuthenticated() ? void navigate("/account") : void navigate("/login");
    },
  },
  withValidation({
    id: "searchProfile",
    display: "Search Profile",
    alias: "profile user search find lookup",
    icon: "fa-search",
    input: true,
    validation: {
      schema: UserNameSchema,
      debounceDelay: 1000,
      isValid: remoteValidation(
        async (name) => Ape.users.getProfile({ params: { uidOrName: name } }),
        {
          on4xx: () => "Unknown user",
        },
      ),
    },
    exec: ({ input }): void => {
      const username = input?.trim();
      if (username === undefined || username === "") return;
      void navigate(`/profile/${username}`);
    },
  }),
  {
    id: "toggleFullscreen",
    display: "Toggle Fullscreen",
    icon: "fa-expand",
    exec: (): void => {
      toggleFullscreen();
    },
  },
];

export default commands;
