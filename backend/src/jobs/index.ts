import updateLeaderboards from "./update-leaderboards";
import deleteOldLogs from "./delete-old-logs";
import logCollectionSizes from "./log-collection-sizes";
import logQueueSizes from "./log-queue-sizes";
import deleteUsers from "./delete-users";

export default [
  updateLeaderboards,
  deleteOldLogs,
  logCollectionSizes,
  logQueueSizes,
  deleteUsers,
];
