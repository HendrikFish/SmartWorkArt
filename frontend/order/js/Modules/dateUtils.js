// public/js/Modules/dateUtils.js

export function getDateFromWeek(week, year) {
  const tmp = new Date(year, 0, 1 + (week - 1) * 7);
  const dayOfWeek = tmp.getDay() || 7;
  const ISOweekStart = new Date(tmp);
  if (dayOfWeek <= 4) {
    ISOweekStart.setDate(tmp.getDate() - dayOfWeek + 1);
  } else {
    ISOweekStart.setDate(tmp.getDate() + (8 - dayOfWeek));
  }
  return ISOweekStart;
}

export function getISOWeekYear(date) {
  const tmp = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  return tmp.getUTCFullYear();
}

export function getISOWeek(date) {
  const tmp = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
  return weekNo;
}
