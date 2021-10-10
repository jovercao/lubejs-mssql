/**
 * 使用本地时区格式化日期为ISO格式
 */
export function formatIsoDateTimeLocale(date: Date): string {
  return formatDate(date) + 'T' + formatTime(date) + formatIsoTzOffset(date);
}

/**
 * 使用UTC时区格式化日期为ISO格式
 */
export function formatIsoDateTimeUtc(date: Date): string {
  return date.toISOString();
}

function formatIsoTzOffset(date: Date): string {
  const offset = date.getTimezoneOffset();
  if (offset === 0) return 'Z';
  return (
    '+' +
    (offset / 60).toString().padStart(2, '0') +
    ':' +
    (offset % 60).toString().padStart(2, '0')
  );
}

export function formatDateTime(date: Date): string {
  return formatDate(date) + ' ' + formatTime(date);
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return (
    y.toString().padStart(4, '0') +
    ':' +
    m.toString().padStart(2, '0') +
    ':' +
    d.toString().padStart(2, '0')
  );
}

export function formatTime(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const s = date.getSeconds();
  const ms = date.getMilliseconds();
  return (
    h.toString().padStart(2, '0') +
    ':' +
    m.toString().padStart(2, '0') +
    ':' +
    s.toString().padStart(2, '0') +
    '.' +
    ms.toString().padStart(3, '0')
  );
}
