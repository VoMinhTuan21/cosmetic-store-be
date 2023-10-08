export function subtractDays(date: Date, days: number) {
  const tempDate = new Date(date);
  tempDate.setDate(date.getDate() - days);

  return new Date(
    tempDate.getFullYear(),
    tempDate.getMonth(),
    tempDate.getDate(),
  );
}

export function addDays(date: Date, days: number) {
  const tempDate = new Date(date);
  tempDate.setDate(date.getDate() + days);

  return new Date(
    tempDate.getFullYear(),
    tempDate.getMonth(),
    tempDate.getDate(),
  );
}

export function randomlast7Days() {
  const today = new Date();
  const randomSubtractDay = Math.floor(Math.random() * 474);

  const tempDate = new Date(today);
  tempDate.setDate(today.getDate() - randomSubtractDay);

  return tempDate;
}
