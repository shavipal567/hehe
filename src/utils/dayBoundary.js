// Returns the "effective" date, shifting hours before dayStartHour back to the previous day.
// e.g. if dayStartHour = 4 (4 AM) and it's currently 2:30 AM, this returns yesterday's date.
export function getEffectiveDateStr(dayStartHour = 0, baseDate = new Date()) {
  const d = new Date(baseDate);
  if (d.getHours() < dayStartHour) {
    d.setDate(d.getDate() - 1);
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatHour12(hour) {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const suffix = hour < 12 ? "AM" : "PM";
  return `${h}:00 ${suffix}`;
}