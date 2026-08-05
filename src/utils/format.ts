const decimalsFor = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1) return 2;
  if (abs >= 0.01) return 4;
  if (abs > 0) return 8;
  return 2;
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