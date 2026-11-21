import { applyPreset } from "../../config/presets";
import { isAuthenticated } from "../../auth/state";
import { Command, CommandsSubgroup } from "../types";
import { getPresets } from "../../queries/presets";
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
    fa: { icon: "fa-sliders-h" },
    subgroup,
    available: (): boolean => {
      return isAuthenticated();
    },
  },
];

function update(): void {
  const presets = getPresets();
  subgroup.list = [];
  if (presets.length === 0) return;
  presets.forEach((preset) => {
    subgroup.list.push({
      id: `applyPreset${preset._id}`,
      display: preset.name,
      exec: async (): Promise<void> => {
        await applyPreset(preset._id);
      },
    });
  });
  subgroup.list.push({
    id: "createPreset",
    display: "Create preset",
    fa: { icon: "fa-plus" },
    exec: (): void => {
      showModal("AddPresetModal");
    },
  });
}

export default commands;
