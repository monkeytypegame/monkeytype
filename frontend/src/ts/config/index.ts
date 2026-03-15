import Config, { getConfig, configLoadPromise } from "./store";
import { setConfig, setQuoteLengthAll, toggleFunbox } from "./setters";
import { applyConfig, resetConfig, getConfigChanges } from "./apply";
import { __testing } from "./testing";
import { updateFromServer } from "./sync";
import { saveFullConfigToLocalStorage } from "./persistence";

export default Config;
export {
  getConfig,
  setConfig,
  setQuoteLengthAll,
  toggleFunbox,
  applyConfig,
  __testing,
  resetConfig,
  getConfigChanges,
  updateFromServer,
  saveFullConfigToLocalStorage,
  configLoadPromise,
};
