import Ape from "../../../ape";
import { getSnapshot, setSnapshot } from "../../../db";
import { showSimpleModal } from "../../../states/simple-modal";

export function showUnlinkDiscordModal(): void {
  showSimpleModal({
    title: "Unlink Discord",
    text: "Are you sure you want to unlink your Discord account?",
    buttonText: "unlink",
    execFn: async () => {
      const snap = getSnapshot();
      if (!snap) {
        return {
          status: "error",
          message: "Failed to unlink Discord: no snapshot",
        };
      }

      const response = await Ape.users.unlinkDiscord();
      if (response.status !== 200) {
        return {
          status: "error",
          message: "Failed to unlink Discord",
          notificationOptions: { response },
        };
      }

      snap.discordAvatar = undefined;
      snap.discordId = undefined;
      setSnapshot(snap);

      return {
        status: "success",
        message: "Discord unlinked",
      };
    },
  });
}
