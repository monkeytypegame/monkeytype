import { navigate } from "../../controllers/route-controller";
import { isAuthenticated } from "../../firebase";
import { toggleFullscreen } from "../../utils/misc";

const commands: MonkeyTypes.Command[] = [
  {
    id: "viewTypingPage",
    display: "View Typing Page",
    alias: "navigate go to start begin type test",
    icon: "fa-keyboard",
    exec: (): void => {
      navigate("/");
    },
  },
  {
    id: "viewLeaderboards",
    display: "View Leaderboards",
    alias: "navigate go to",
    icon: "fa-crown",
    exec: (): void => {
      $("header nav .textButton.view-leaderboards").trigger("click");
    },
  },
  {
    id: "viewAbout",
    display: "View About Page",
    alias: "navigate go to",
    icon: "fa-info",
    exec: (): void => {
      navigate("/about");
    },
  },
  {
    id: "viewSettings",
    display: "View Settings Page",
    alias: "navigate go to",
    icon: "fa-cog",
    exec: (): void => {
      navigate("/settings");
    },
  },

  {
    id: "viewAccount",
    display: "View Account Page",
    alias: "navigate go to stats",
    icon: "fa-user",
    exec: (): void => {
      isAuthenticated() ? navigate("/account") : navigate("/login");
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
