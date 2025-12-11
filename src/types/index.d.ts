// src/types/index.d.ts

import { Address } from "viem";
import { BigNumberish } from "ethers"; // ✅ ethers v6 compatible

// -----------------------------
// Token & Contract Interfaces
// -----------------------------
export interface ERC20 {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  balanceOf: (account: Address) => Promise<bigint>; // replaced BigNumber
  approve: (spender: Address, amount: BigNumberish) => Promise<void>; // BigNumberish works for inputs
  allowance: (owner: Address, spender: Address) => Promise<bigint>;
  transfer: (to: Address, amount: BigNumberish) => Promise<void>;
}

export interface StakingPool {
  pid: number;
  lpToken: ERC20;
  allocPoint: number;
  accRewardPerShare: bigint; // replaced BigNumber
  lastRewardTime: number;
  exists: boolean;
}

export interface UserInfo {
  amount: bigint;
  rewardDebt: bigint;
}

// -----------------------------
// Vesting Interfaces
// -----------------------------
export interface Grant {
  amount: bigint;
  start: number;
  cliff: number;
  duration: number;
  released: bigint;
}

export interface VestingInfo {
  beneficiary: Address;
  grants: Grant[];
}

// -----------------------------
// Wallet & Context Types
// -----------------------------
export interface WalletContextType {
  address: Address | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isConnected: boolean;
}

// -----------------------------
// Notifications & UI
// -----------------------------
export type NotificationType = "success" | "error" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number; // in milliseconds
}
