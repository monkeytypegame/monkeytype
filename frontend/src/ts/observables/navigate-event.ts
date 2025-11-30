type NavigateOptions = {
  force?: boolean;
  tribeOverride?: boolean;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface NavigationService {
  navigate(url: string, options?: NavigateOptions): void;
}

let service: NavigationService | undefined;

export function setNavigationService(s: NavigationService): void {
  if (service !== undefined) {
    throw new Error("NavigationService already initialized");
  }
  service = s;
}

export function navigate(url: string, options?: NavigateOptions): void {
  if (service === undefined) {
    throw new Error("NavigationService not initialized");
  }
  service.navigate(url, options);
}
