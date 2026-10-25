/**
 * Checks if a showDate ("YYYY-MM-DD") and showTime (e.g. "10:00 AM", "01:00 PM") have passed
 */
const isShowPast = (showDate, showTime, bufferMinutes = 0) => {
  if (!showDate || !showTime) return false;

  try {
    const dateMatch = showDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
    let year, month, day;

    if (dateMatch) {
      year = parseInt(dateMatch[1], 10);
      month = parseInt(dateMatch[2], 10) - 1;
      day = parseInt(dateMatch[3], 10);
    } else {
      const d = new Date(showDate);
      if (isNaN(d.getTime())) return false;
      year = d.getFullYear();
      month = d.getMonth();
      day = d.getDate();
    }

    const timeMatch = showTime.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!timeMatch) return false;

    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const meridian = timeMatch[3] ? timeMatch[3].toUpperCase() : null;

    if (meridian === "PM" && hours < 12) {
      hours += 12;
    } else if (meridian === "AM" && hours === 12) {
      hours = 0;
    }

    const showDateTime = new Date(year, month, day, hours, minutes, 0, 0);
    const now = new Date();

    return showDateTime.getTime() + bufferMinutes * 60 * 1000 <= now.getTime();
  } catch (err) {
    console.error("[isShowPast Server] Error:", err);
    return false;
  }
};

module.exports = {
  isShowPast,
};
