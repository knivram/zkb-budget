/**
 * Formats a Date object to YYYY-MM string format
 * @param date - The date to format
 * @returns String in YYYY-MM format (e.g., "2024-01")
 */
export const formatYearMonth = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};
