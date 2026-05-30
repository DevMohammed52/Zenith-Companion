export type BrowserNotificationState = NotificationPermission | "unsupported";

export type BrowserNotificationPayload = {
  title: string;
  body: string;
  tag?: string;
};

function getNotificationApi(): typeof Notification | null {
  if (typeof window === "undefined" || !("Notification" in window)) return null;
  return window.Notification;
}

export function getBrowserNotificationState(): BrowserNotificationState {
  const notificationApi = getNotificationApi();
  return notificationApi ? notificationApi.permission : "unsupported";
}

export async function requestBrowserNotificationPermission(): Promise<BrowserNotificationState> {
  const notificationApi = getNotificationApi();
  if (!notificationApi) return "unsupported";
  return notificationApi.requestPermission();
}

export function showBrowserNotification(payload: BrowserNotificationPayload): boolean {
  const notificationApi = getNotificationApi();
  if (!notificationApi || notificationApi.permission !== "granted") return false;

  try {
    new notificationApi(payload.title, {
      body: payload.body,
      tag: payload.tag,
    });
    return true;
  } catch {
    return false;
  }
}
