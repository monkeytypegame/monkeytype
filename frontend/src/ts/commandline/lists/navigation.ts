import { navigate } from "../../controllers/route-controller";
import { toggleFullscreen } from "../../utils/misc";

const commands: MonkeyTypes.Command[] = [
  {
    id: "viewTypingPage",
    display: "View Typing Page",
    alias: "start begin type test",
    icon: "fa-keyboard",
    exec: (): void => {
      navigate("/");
    },
  },
  {
    id: "viewLeaderboards",
    display: "View Leaderboards",
    icon: "fa-crown",
    exec: (): void => {
      $("#top #menu .textButton.view-leaderboards").trigger("click");
    },
  },
  {
    id: "viewAbout",
    display: "View About Page",
    icon: "fa-info",
    exec: (): void => {
      navigate("/about");
    },
  },
  {
    id: "viewSettings",
    display: "View Settings Page",
    icon: "fa-cog",
    exec: (): void => {
      navigate("/settings");
    },
  },

  {
    id: "viewAccount",
    display: "View Account Page",
    icon: "fa-user",
    alias: "stats",
    exec: (): void => {
      $("#top #menu .textButton.view-account").hasClass("hidden")
        ? navigate("/login")
        : navigate("/account");
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
