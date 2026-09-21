/**
 * Custom Indian currency formatter and minor-unit monetary math
 */

// Formats a number of paise into Indian grouping string without the currency symbol
export function formatIndianNumber(paise: number): string {
  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const rupees = Math.floor(absPaise / 100);
  const remainderPaise = absPaise % 100;
  const paiseStr = remainderPaise.toString().padStart(2, '0');

  const rupeesStr = rupees.toString();
  if (rupeesStr.length <= 3) {
    return `${isNegative ? '-' : ''}${rupeesStr}.${paiseStr}`;
  }

  // Last 3 digits
  const lastThree = rupeesStr.slice(-3);
  const remaining = rupeesStr.slice(0, -3);

  // Remaining digits are grouped in pairs of 2 from right to left
  const parts: string[] = [];
  let current = remaining;
  while (current.length > 2) {
    parts.unshift(current.slice(-2));
    current = current.slice(0, -2);
  }
  if (current.length > 0) {
    parts.unshift(current);
  }

  const groupedRupees = `${parts.join(',')},${lastThree}`;
  return `${isNegative ? '-' : ''}${groupedRupees}.${paiseStr}`;
}

// Formats minor units (paise) with Rupee symbol: e.g. ₹2,716.00
export function formatMoney(amountMinor: number, currencySymbol: string = '₹'): string {
  return `${currencySymbol}${formatIndianNumber(amountMinor)}`;
}

// Formats table cells (WITHOUT currency symbol, with 2 decimals and Indian grouping)
export function formatTableCell(amountMinor: number): string {
  return formatIndianNumber(amountMinor);
}

// Parses a string amount entered by user (e.g. "1200", "1,200.50", "34900") into integer paise
export function parseAmountToMinor(input: string): number | null {
  if (!input) return null;
  // Clean commas, spaces, currency symbols
  const cleaned = input.replace(/[₹\s,]/g, '');
  if (!cleaned) return null;

  // Validate format: digits with optional . and up to 2 decimal places
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    return null;
  }

  const parts = cleaned.split('.');
  const rupees = parseInt(parts[0], 10);
  if (isNaN(rupees) || rupees < 0) return null;

  // Max 12 digits before decimal
  if (parts[0].length > 12) return null;

  let paise = 0;
  if (parts.length > 1 && parts[1]) {
    paise = parseInt(parts[1].padEnd(2, '0').slice(0, 2), 10);
  }

  const total = rupees * 100 + paise;
  if (total <= 0) return null; // zero is invalid
  return total;
}

// Converts paise to string input format (e.g. 120000 -> "1200.00" or "1200")
export function minorToInputValue(amountMinor: number): string {
  const rupees = Math.floor(amountMinor / 100);
  const paise = amountMinor % 100;
  if (paise === 0) {
    return rupees.toString();
  }
  return `${rupees}.${paise.toString().padStart(2, '0')}`;
}

// Short unit formatting for charts (e.g. 3K, 6K, 15K, 1L, 1Cr)
export function formatShortMoney(amountMinor: number): string {
  const rupees = Math.floor(amountMinor / 100);
  if (rupees === 0) return '0';
  if (rupees >= 10000000) {
    const cr = rupees / 10000000;
    return `${Number(cr.toFixed(1))}Cr`;
  }
  if (rupees >= 100000) {
    const l = rupees / 100000;
    return `${Number(l.toFixed(1))}L`;
  }
  if (rupees >= 1000) {
    const k = rupees / 1000;
    return `${Number(k.toFixed(1))}K`;
  }
  return rupees.toString();
}
