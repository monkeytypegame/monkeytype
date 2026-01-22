import { createStore } from "solid-js/store";

type AuthenticatedUserSignal = {
  uid: string;
  name: string;
  xp: number;
  discordAvatar?: string;
  discordId?: string;
};

type UserStore =
  | {
      available: false;
      user?: never;
    }
  | {
      available: true;
      user: AuthenticatedUserSignal;
    };

const [getStore, setStore] = createStore<UserStore>({
  available: false,
});

export function getUserStore(): UserStore {
  return getStore;
}

export function getAuthenticatedUser(): AuthenticatedUserSignal | null {
  return getStore.available ? getStore.user : null;
}

export function isAuthenticated(): boolean {
  return getStore.available;
}

export function setAuthenticatedUser(user: AuthenticatedUserSignal): void {
  setStore({
    available: true,
    user,
  });
}
