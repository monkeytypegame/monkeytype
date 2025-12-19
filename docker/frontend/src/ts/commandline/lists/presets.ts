import * as DB from "../../db";
import * as ModesNotice from "../../elements/modes-notice";
import * as Settings from "../../pages/settings";
import * as PresetController from "../../controllers/preset-controller";
import * as EditPresetPopup from "../../modals/edit-preset";
import { isAuthenticated } from "../../firebase";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Presets...",
  list: [],
  beforeList: (): void => {
    update();
  },
};

const commands: Command[] = [
  {
    visible: false,
    id: "applyPreset",
    display: "Presets...",
    icon: "fa-sliders-h",
    subgroup,
    available: (): boolean => {
      return isAuthenticated();
    },
  },
];

function update(): void {
  const snapshot = DB.getSnapshot();
  subgroup.list = [];
  if (!snapshot?.presets || snapshot.presets.length === 0) return;
  snapshot.presets.forEach((preset) => {
    const dis = preset.display;

    subgroup.list.push({
      id: "applyPreset" + preset._id,
      display: dis,
      exec: async (): Promise<void> => {
        Settings.setEventDisabled(true);
        await PresetController.apply(preset._id);
        Settings.setEventDisabled(false);
        void Settings.update();
        void ModesNotice.update();
      },
    });
  });
  subgroup.list.push({
    id: "createPreset",
    display: "Create preset",
    icon: "fa-plus",
    exec: (): void => {
      EditPresetPopup.show("add");
    },
  });
}

export default commands;
