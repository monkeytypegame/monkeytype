import { navigate } from "../../controllers/route-controller";
import { isAuthenticated } from "../../firebase";
import { getTribeMode, toggleFullscreen } from "../../utils/misc";
import { Command } from "../types";

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
    id: "viewTribe",
    display: "View Tribe Page",
    alias: "navigate go to",
    icon: "fa-crown",
    minimumSearchQuery: "tribe",
    available: (): boolean => {
      return getTribeMode() !== "disabled";
    },
    exec: (): void => {
      void navigate("/tribe");
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
