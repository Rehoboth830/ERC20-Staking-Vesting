/**
 * Format a number with commas for thousands
 * e.g., 1234567 => "1,234,567"
 * @param value
 * @returns string
 */
export const formatNumber = (value: number | string): string => {
  return Number(value).toLocaleString("en-US");
};

/**
 * Format a token amount with decimals
 * @param value - raw token value
 * @param decimals - number of decimals (default 18)
 * @param precision - number of decimals to show (default 4)
 * @returns string
 */
export const formatTokenAmount = (
  value: number | string,
  decimals = 18,
  precision = 4
): string => {
  const raw = Number(value) / 10 ** decimals;
  return raw.toFixed(precision);
};

/**
 * Format a currency amount in USD
 * @param value
 * @param precision
 * @returns string, e.g., $1,234.56
 */
export const formatCurrency = (value: number | string, precision = 2): string => {
  const num = Number(value);
  return `$${num.toFixed(precision).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
};

/**
 * Format timestamp (in seconds) to readable date
 * @param timestamp
 * @returns string e.g., "Oct 18, 2025"
 */
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Format timestamp to time string
 * @param timestamp
 * @returns string e.g., "14:35:22"
 */
export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString("en-US", { hour12: false });
};

/**
 * Truncate Ethereum address
 * e.g., 0x1234567890abcdef => 0x1234...cdef
 * @param address
 * @param startChars
 * @param endChars
 * @returns string
 */
export const truncateAddress = (address: string, startChars = 6, endChars = 4): string => {
  if (!address) return "";
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};
