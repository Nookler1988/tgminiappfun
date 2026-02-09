export type TelegramWebApp = {
  initData: string;
  initDataUnsafe: Record<string, unknown>;
  colorScheme?: string;
  themeParams?: Record<string, unknown>;
  ready: () => void;
  expand: () => void;
  close: () => void;
  contentSafeAreaInset?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
};

export const getTelegram = (): TelegramWebApp | null => {
  const tg = (window as { Telegram?: { WebApp?: TelegramWebApp } }).Telegram
    ?.WebApp;
  return tg || null;
};

const isTelegramWebView = () => /Telegram/i.test(navigator.userAgent);

export const ensureTelegramScript = async (): Promise<void> => {
  if (getTelegram() || !isTelegramWebView()) return;
  await new Promise<void>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
};

export const getInitData = (): string => {
  const tg = getTelegram();
  return tg?.initData || "";
};

export const getInitDataUnsafe = (): Record<string, unknown> => {
  const tg = getTelegram();
  return (tg?.initDataUnsafe || {}) as Record<string, unknown>;
};

export const applyTelegramSafeArea = (): void => {
  const tg = getTelegram();
  if (!tg?.contentSafeAreaInset) return;

  const { top, right, bottom, left } = tg.contentSafeAreaInset;
  document.documentElement.style.setProperty("--tg-safe-area-top", `${top}px`);
  document.documentElement.style.setProperty(
    "--tg-safe-area-right",
    `${right}px`,
  );
  document.documentElement.style.setProperty(
    "--tg-safe-area-bottom",
    `${bottom}px`,
  );
  document.documentElement.style.setProperty(
    "--tg-safe-area-left",
    `${left}px`,
  );
};
