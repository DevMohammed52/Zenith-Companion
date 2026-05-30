export const ZENITH_INSTALL_PROMPT_EVENT = "zenith-install-prompt-change";

export type InstallPromptOutcome = "accepted" | "dismissed";

export type ZenithBeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: InstallPromptOutcome;
    platform: string;
  }>;
};

declare global {
  interface Window {
    __zenithInstallPromptEvent?: ZenithBeforeInstallPromptEvent | null;
  }
}
