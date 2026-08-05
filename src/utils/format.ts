// exported so a caller can pick the precision once for a whole column instead of
// per row: mixed decimals inside a column break the alignment of tabular numbers
export const decimalsFor = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1) return 2;
  if (abs >= 0.01) return 4;
  if (abs > 0) return 8;
  return 2;
};

// base-asset quantities span a much wider range than prices (0.0001 BTC vs
// 500M SHIB), so they need their own buckets
export const amountDecimalsFor = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 10000) return 2;
  if (abs >= 100) return 3;
  if (abs >= 1) return 4;
  return 6;
};

// plain number, no currency symbol: the order book labels the assets in its
// header, repeating '$' on every row is just noise
export const formatNumber = (value: number, digits: number) => {
  if (Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
};

export const formatPrice = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const digits = decimalsFor(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
};

export const formatPercent = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};