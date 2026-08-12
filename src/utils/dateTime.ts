const HAS_TIME_ZONE = /(Z|[+-]\d{2}:?\d{2})$/i;

/**
 * API timestamps are persisted as UTC in SQL Server datetime2 columns.
 * datetime2 has no zone marker, so append Z before JavaScript parses it.
 */
export const parseUtcTimestamp = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const normalized = HAS_TIME_ZONE.test(value) ? value : `${value}Z`;
  const result = new Date(normalized);
  return Number.isNaN(result.getTime()) ? null : result;
};

/** Parse a SQL datetime2 value stored as Vietnam local wall-clock time. */
export const parseVietnamTimestamp = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const normalized = HAS_TIME_ZONE.test(value) ? value : `${value}+07:00`;
  const result = new Date(normalized);
  return Number.isNaN(result.getTime()) ? null : result;
};

export const vietnamDateKeyFromUtc = (value: string | null | undefined): string => {
  const date = parseUtcTimestamp(value);
  if (!date) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};
