export const parsePriceToCents = (input: string): number | null => {
  const normalized = input.trim().replace(/\s+/g, '').replace(',', '.');

  if (normalized === '') return null;

  const match = normalized.match(/^(\d*)(?:\.(\d{0,2}))?$/);
  if (!match) return null;

  const dollarsPart = match.at(1) ?? '';
  const centsPart = match.at(2) ?? '';

  if (dollarsPart === '' && centsPart === '') return null;

  const dollars = dollarsPart === '' ? 0 : parseInt(dollarsPart, 10);
  if (!Number.isFinite(dollars)) return null;

  const centsTwoDigits = centsPart.padEnd(2, '0');
  const cents = centsTwoDigits === '' ? 0 : parseInt(centsTwoDigits, 10);
  if (!Number.isFinite(cents)) return null;

  return dollars * 100 + cents;
};
