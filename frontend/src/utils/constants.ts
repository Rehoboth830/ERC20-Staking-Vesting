// ----------------------------
// NETWORK CONFIG
// ----------------------------
export const NETWORKS = {
  SEPOLIA: {
    chainId: 11155111,
    name: "Sepolia Testnet",
    rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID",
  },
  LOCAL: {
    chainId: 31337,
    name: "Hardhat Local",
    rpcUrl: "http://127.0.0.1:8545",
  },
};

// ----------------------------
// CONTRACT ADDRESSES
// Replace with actual deployed addresses
// ----------------------------
export const CONTRACTS = {
  LEAG_TOKEN: "0xYourLEAGTokenAddressHere",
  VESTING: "0xYourVestingLEAGAddressHere",
  STAKING_MANAGER: "0xYourLionEagleStakingManagerAddressHere",
};

// ----------------------------
// TOKEN INFO
// ----------------------------
export const TOKEN = {
  SYMBOL: "LEAG",
  DECIMALS: 18,
};

// ----------------------------
// UI / APP CONSTANTS
// ----------------------------
export const APP_NAME = "Lion-Eagle Dashboard";
export const APP_THEME = {
  primary: "#000000",    // Black
  secondary: "#FFD700",  // Gold
  accent: "#FFBF00",     // Amber glow
};

export const TOAST_DURATION = 4000; // ms

// ----------------------------
// DEFAULT VALUES
// ----------------------------
export const DEFAULT_USER_ADDRESS = "0x0000000000000000000000000000000000000000";
export const DEFAULT_TOKEN_AMOUNT = "0";
