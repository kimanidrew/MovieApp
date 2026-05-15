export const HISTORY_KEY = 'movieflix-history';
export const SETTINGS_KEY = 'movieflix-settings';

export const formatTime = (time: number) => {
  const s = Math.floor(time || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  return h > 0
    ? `${h}:${m < 10 ? '0' : ''}${m}:${sec < 10 ? '0' : ''}${sec}`
    : `${m}:${sec < 10 ? '0' : ''}${sec}`;
};