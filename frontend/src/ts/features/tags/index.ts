export type { TagItem } from "./store";
export {
  seedFromUserData,
  getTags,
  getTag,
  getActiveTags,
  insertTag,
  updateTag,
  deleteTag,
} from "./store";

export {
  saveActiveToLocalStorage,
  toggleTagActive,
  setTagActive,
  clearActiveTags,
} from "./active";

export {
  getLocalTagPB,
  saveLocalTagPB,
  updateLocalTagPB,
  getActiveTagsPB,
} from "./personal-bests";

// Side-effect: registers authEvent listener for loading active tags from localStorage
import "./active";
