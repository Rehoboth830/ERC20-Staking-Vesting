// ----------------------------
// NETWORK CONFIG (ENV-DRIVEN)
// ----------------------------
export const NETWORKS = {
  SEPOLIA: {
    chainId: Number(process.env.NEXT_PUBLIC_SEPOLIA_CHAIN_ID),
    name: "Sepolia Testnet",
    rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL!,
  },
  LOCAL: {
    chainId: Number(process.env.NEXT_PUBLIC_LOCAL_CHAIN_ID),
    name: "Hardhat Local",
    rpcUrl: process.env.NEXT_PUBLIC_LOCAL_RPC_URL!,
  },
};

// ----------------------------
// CONTRACTS (ENV-DRIVEN)
// ----------------------------
export const CONTRACTS = {
  LEAG_TOKEN:
    process.env.NEXT_PUBLIC_DEFAULT_NETWORK === "sepolia"
      ? process.env.NEXT_PUBLIC_SEPOLIA_LEAG_ADDRESS!
      : process.env.NEXT_PUBLIC_LOCAL_LEAG_ADDRESS!,

  VESTING:
    process.env.NEXT_PUBLIC_DEFAULT_NETWORK === "sepolia"
      ? process.env.NEXT_PUBLIC_SEPOLIA_VESTING_ADDRESS!
      : process.env.NEXT_PUBLIC_LOCAL_VESTING_ADDRESS!,

  STAKING_MANAGER:
    process.env.NEXT_PUBLIC_DEFAULT_NETWORK === "sepolia"
      ? process.env.NEXT_PUBLIC_SEPOLIA_STAKING_ADDRESS!
      : process.env.NEXT_PUBLIC_LOCAL_STAKING_ADDRESS!,
};

// ----------------------------
// TOKEN INFO
// ----------------------------
export const TOKEN = {
  SYMBOL: "LEAG",
  DECIMALS: 18,
};

// ----------------------------
// UI CONSTANTS
// ----------------------------
export const APP_NAME = process.env.NEXT_PUBLIC_PROJECT_NAME ?? "Lion-Eagle Dashboard";

export const APP_THEME = {
  primary: "#000000",
  secondary: "#FFD700",
  accent: "#FFBF00",
};

export const TOAST_DURATION = 4000;

// ----------------------------
// DEFAULTS
// ----------------------------
export const DEFAULT_USER_ADDRESS = "0x0000000000000000000000000000000000000000";
export const DEFAULT_TOKEN_AMOUNT = "0";
