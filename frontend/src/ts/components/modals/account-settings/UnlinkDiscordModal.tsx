import { unlinkDiscord } from "../../../collections/user";
import { showSimpleModal } from "../../../states/simple-modal";

export function showUnlinkDiscordModal(): void {
  showSimpleModal({
    title: "Unlink Discord",
    text: "Are you sure you want to unlink your Discord account?",
    buttonText: "unlink",
    execFn: async () => {
      try {
        await unlinkDiscord();
      } catch (error) {
        return {
          status: "error",
          message: "Failed to unlink Discord",
          notificationOptions: { error },
        };
      }

      return {
        status: "success",
        message: "Discord unlinked",
      };
    },
  });
}
