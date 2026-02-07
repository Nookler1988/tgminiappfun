export type TelegramWebApp = {
  initData: string;
  initDataUnsafe: Record<string, unknown>;
  ready: () => void;
  expand: () => void;
  close: () => void;
};

export const getTelegram = (): TelegramWebApp | null => {
  const tg = (window as { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp;
  return tg || null;
};

export const getInitData = (): string => {
  const tg = getTelegram();
  return tg?.initData || '';
};
