import { envConfig } from "virtual:env-config";
import { hideLoaderBar, showLoaderBar } from "../states/loader-bar";
import { showErrorNotification } from "../states/notifications";

// Signs in with QUICK_LOGIN_EMAIL / QUICK_LOGIN_PASSWORD from the frontend .env
export async function quickLogin(): Promise<void> {
  if (
    envConfig.quickLoginEmail === undefined ||
    envConfig.quickLoginPassword === undefined
  ) {
    showErrorNotification(
      "Quick login credentials not set. Add QUICK_LOGIN_EMAIL and QUICK_LOGIN_PASSWORD to your frontend .env file.",
    );
    return;
  }
  showLoaderBar();
  try {
    // lazy: auth reads firebase on import, and the debug handle loads eagerly
    const { signIn } = await import("../auth");
    const result = await signIn(
      envConfig.quickLoginEmail,
      envConfig.quickLoginPassword,
      true,
    );
    if (!result.success) {
      showErrorNotification(result.message);
    }
  } catch (error: unknown) {
    showErrorNotification("Quick login failed", { error });
  } finally {
    hideLoaderBar();
  }
}
