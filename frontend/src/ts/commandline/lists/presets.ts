import * as ModesNotice from "../../elements/modes-notice";
import * as PresetController from "../../controllers/preset-controller";
import { isAuthenticated } from "../../states/core";
import { Command, CommandsSubgroup } from "../types";
import { __nonReactive } from "../../collections/presets";
import { showModal } from "../../states/modals";

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
  const presets = __nonReactive.getPresets();
  subgroup.list = [];
  if (presets.length === 0) return;
  presets.forEach((preset) => {
    subgroup.list.push({
      id: `applyPreset${preset._id}`,
      display: preset.name,
      exec: async (): Promise<void> => {
        await PresetController.apply(preset._id);
        void ModesNotice.update();
      },
    });
  });
  subgroup.list.push({
    id: "createPreset",
    display: "Create preset",
    icon: "fa-plus",
    exec: (): void => {
      showModal("AddPresetModal");
    },
  });
}

export default commands;
