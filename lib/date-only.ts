const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDateOnly(value: string): boolean {
  if (!DATE_ONLY_RE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function dateOnlyToLocalDate(value: string): Date | undefined {
  if (!isDateOnly(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function localDateToDateOnly(date: Date | undefined): string {
  if (!date || Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayDateOnly(): string {
  return localDateToDateOnly(new Date());
}

export function addDaysDateOnly(value: string, days: number): string {
  const date = dateOnlyToLocalDate(value);
  if (!date) return "";
  date.setDate(date.getDate() + days);
  return localDateToDateOnly(date);
}

export function formatDateOnly(value: string, options?: Intl.DateTimeFormatOptions): string {
  const date = dateOnlyToLocalDate(value);
  if (!date) return value;
  return date.toLocaleDateString("en-NA", options);
}

export function dateToDateOnly(value: Date | string | null | undefined): string {
  if (!value) return "";
  if (typeof value === "string") {
    if (isDateOnly(value)) return value;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return localDateToDateOnly(date);
  }
  return localDateToDateOnly(value);
}

export function nightsBetweenDateOnly(checkIn: string, checkOut: string): number {
  const start = dateOnlyToLocalDate(checkIn);
  const end = dateOnlyToLocalDate(checkOut);
  if (!start || !end) return 0;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86_400_000));
}
