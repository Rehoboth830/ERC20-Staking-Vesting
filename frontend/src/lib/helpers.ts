import { ethers } from "ethers";

/**
 * Format a BigNumber or string to readable ETH/Token amount
 * @param value - BigNumber or string value
 * @param decimals - number of decimals of token (default 18)
 * @returns string formatted
 */
export const formatToken = (value: ethers.BigNumberish, decimals = 18): string => {
  try {
    const amount = ethers.formatUnits(value, decimals);
    return Number(amount).toLocaleString(undefined, { maximumFractionDigits: 6 });
  } catch (err) {
    console.error("Error formatting token:", err);
    return "0";
  }
};

/**
 * Parse token input string to BigNumber
 * @param value - string input
 * @param decimals - token decimals (default 18)
 * @returns BigInt
 */
export const parseToken = (value: string, decimals = 18): bigint => {
  try {
    return ethers.parseUnits(value, decimals);
  } catch (err) {
    console.error("Error parsing token:", err);
    return 0n;
  }
};

/**
 * Shorten Ethereum address for display
 * @param address
 * @param chars - number of chars at start/end (default 4)
 */
export const shortenAddress = (address: string, chars = 4): string => {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

/**
 * Sleep for given milliseconds (useful for async waiting)
 * @param ms
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Check if given string is a valid Ethereum address
 * @param address
 */
export const isAddress = (address: string): boolean => {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
};
