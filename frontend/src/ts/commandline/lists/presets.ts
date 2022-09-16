import * as DB from "../../db";
import * as ModesNotice from "../../elements/modes-notice";
import * as Settings from "../../pages/settings";
import * as PresetController from "../../controllers/preset-controller";
import * as EditPresetPopup from "../../popups/edit-preset-popup";
import { Auth } from "../../firebase";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Presets...",
  list: [],
};

const commands: MonkeyTypes.Command[] = [
  {
    visible: false,
    id: "applyPreset",
    display: "Presets...",
    icon: "fa-sliders-h",
    subgroup,
    beforeSubgroup: (): void => {
      update();
    },
    available: (): boolean => {
      return !!Auth.currentUser;
    },
  },
];

function update(): void {
  const snapshot = DB.getSnapshot();
  subgroup.list = [];
  if (!snapshot || !snapshot.presets || snapshot.presets.length === 0) return;
  snapshot.presets.forEach((preset: MonkeyTypes.Preset) => {
    const dis = preset.display;

    subgroup.list.push({
      id: "applyPreset" + preset._id,
      display: dis,
      exec: (): void => {
        Settings.setEventDisabled(true);
        PresetController.apply(preset._id);
        Settings.setEventDisabled(false);
        Settings.update();
        ModesNotice.update();
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
export { update };
