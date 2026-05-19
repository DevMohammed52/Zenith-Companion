export type ZenithNotificationTone = "tip" | "success" | "warning" | "contact";

export type ZenithNotification = {
  title: string;
  body: string;
  tone?: ZenithNotificationTone;
};

export const ZENITH_NOTIFY_EVENT = "zenith-notify";

export function notifyZenith(detail: ZenithNotification) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ZenithNotification>(ZENITH_NOTIFY_EVENT, { detail }));
}
