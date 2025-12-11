import LEAG_ABI from "../abis/LEAG.json";
import LION_EAGLE_STAKING_ABI from "../abis/LionEagleStakingManager.json";
import VESTING_LEAG_ABI from "../abis/VestingLEAG.json";

// ----------------------------
// Network Config (ENV-Driven)
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
// Use env-driven addresses
// ----------------------------
export const CONTRACT_ADDRESSES = {
  LEAG:
    process.env.NEXT_PUBLIC_DEFAULT_NETWORK === "sepolia"
      ? process.env.NEXT_PUBLIC_SEPOLIA_LEAG_ADDRESS!
      : process.env.NEXT_PUBLIC_LOCAL_LEAG_ADDRESS!,

  STAKING_MANAGER:
    process.env.NEXT_PUBLIC_DEFAULT_NETWORK === "sepolia"
      ? process.env.NEXT_PUBLIC_SEPOLIA_STAKING_ADDRESS!
      : process.env.NEXT_PUBLIC_LOCAL_STAKING_ADDRESS!,

  VESTING:
    process.env.NEXT_PUBLIC_DEFAULT_NETWORK === "sepolia"
      ? process.env.NEXT_PUBLIC_SEPOLIA_VESTING_ADDRESS!
      : process.env.NEXT_PUBLIC_LOCAL_VESTING_ADDRESS!,
};

// ----------------------------
// Export contract objects with ABIs
// ----------------------------
export const CONTRACTS = {
  LEAG: {
    address: CONTRACT_ADDRESSES.LEAG,
    abi: LEAG_ABI.abi,
  },
  STAKING_MANAGER: {
    address: CONTRACT_ADDRESSES.STAKING_MANAGER,
    abi: LION_EAGLE_STAKING_ABI.abi,
  },
  VESTING: {
    address: CONTRACT_ADDRESSES.VESTING,
    abi: VESTING_LEAG_ABI.abi,
  },
};
