/**
 * Helper to parse showDate and showTime and determine if a show has already passed.
 */

export function parseShowDateTime(showDate, showTime) {
  if (!showDate) return null;

  let dateStr = '';
  if (typeof showDate === 'string') {
    dateStr = showDate.split('T')[0].trim();
  } else if (showDate instanceof Date) {
    const y = showDate.getFullYear();
    const m = String(showDate.getMonth() + 1).padStart(2, '0');
    const d = String(showDate.getDate()).padStart(2, '0');
    dateStr = `${y}-${m}-${d}`;
  }

  const parts = dateStr.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return null;
  }
  const [year, month, day] = parts;

  let hours = 0;
  let minutes = 0;

  if (showTime && typeof showTime === 'string') {
    const trimmed = showTime.trim();
    const isPM = /pm/i.test(trimmed);
    const isAM = /am/i.test(trimmed);

    const cleaned = trimmed.replace(/[^0-9:]/g, '');
    const timeParts = cleaned.split(':').map(Number);
    let h = !isNaN(timeParts[0]) ? timeParts[0] : 0;
    let m = !isNaN(timeParts[1]) ? timeParts[1] : 0;

    if (isPM && h < 12) {
      h += 12;
    } else if (isAM && h === 12) {
      h = 0;
    }

    hours = h;
    minutes = m;
  }

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

/**
 * Returns true if the show's date and time is before the current timestamp
 */
export function isShowExpired(showDate, showTime) {
  const showDateTime = parseShowDateTime(showDate, showTime);
  if (!showDateTime) return false;
  return showDateTime.getTime() <= Date.now();
}

/**
 * Normalizes time string to standard 12-hour format: '10:30 AM', '01:00 PM', etc.
 */
export function formatDisplayTime(showTime) {
  if (!showTime) return '18:00';
  const trimmed = showTime.trim();
  if (/am|pm/i.test(trimmed)) return trimmed;

  const parts = trimmed.split(':').map(Number);
  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    const h = parts[0];
    const m = String(parts[1]).padStart(2, '0');
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${String(displayH).padStart(2, '0')}:${m} ${period}`;
  }
  return trimmed;
}
