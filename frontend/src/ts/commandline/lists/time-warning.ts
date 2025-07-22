// import {
//   PlayTimeWarning,
//   PlayTimeWarningSchema,
// } from "@monkeytype/schemas/configs";
// import * as UpdateConfig from "../../config";
// import * as SoundController from "../../controllers/sound-controller";
// import { Command, CommandsSubgroup } from "../types";
import { buildCommandForConfigKey } from "../util";

// const subgroup: CommandsSubgroup = {
//   title: "Time warning...",
//   configKey: "playTimeWarning",
//   list: (Object.keys(PlayTimeWarningSchema.Values) as PlayTimeWarning[]).map(
//     (time) => ({
//       id: `setPlayTimeWarning${time}`,
//       display:
//         time === "off" ? "off" : `${time} second${time !== "1" ? "s" : ""}`,
//       configValue: time,
//       exec: (): void => {
//         UpdateConfig.setPlayTimeWarning(time);
//         if (time !== "off") {
//           void SoundController.playTimeWarning();
//         }
//       },
//     })
//   ),
// };

// const commands: Command[] = [
//   {
//     id: "changePlayTimeWarning",
//     display: "Time warning...",
//     icon: "fa-exclamation-triangle",
//     subgroup,
//   },
// ];

// export default commands;

export default [buildCommandForConfigKey("playTimeWarning")];
