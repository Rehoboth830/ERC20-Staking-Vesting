import LEAG_ABI from "../abis/LEAG.json";
import LION_EAGLE_STAKING_ABI from "../abis/LionEagleStakingManager.json";
import VESTING_LEAG_ABI from "../abis/VestingLEAG.json";

// Replace these with your actual deployed contract addresses
export const CONTRACT_ADDRESSES = {
  LEAG: process.env.NEXT_PUBLIC_LEAG_ADDRESS || "0xYourLEAGTokenAddress",
  STAKING_MANAGER:
    process.env.NEXT_PUBLIC_STAKING_MANAGER_ADDRESS ||
    "0xYourStakingManagerAddress",
  VESTING: process.env.NEXT_PUBLIC_VESTING_ADDRESS || "0xYourVestingAddress",
};

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
