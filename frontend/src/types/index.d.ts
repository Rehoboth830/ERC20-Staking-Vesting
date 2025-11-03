// src/types/index.d.ts

import { Address } from "viem";
import { BigNumber } from "ethers";

// -----------------------------
// Token & Contract Interfaces
// -----------------------------
export interface ERC20 {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  balanceOf: (account: Address) => Promise<BigNumber>;
  approve: (spender: Address, amount: BigNumber) => Promise<void>;
  allowance: (owner: Address, spender: Address) => Promise<BigNumber>;
  transfer: (to: Address, amount: BigNumber) => Promise<void>;
}

export interface StakingPool {
  pid: number;
  lpToken: ERC20;
  allocPoint: number;
  accRewardPerShare: BigNumber;
  lastRewardTime: number;
  exists: boolean;
}

export interface UserInfo {
  amount: BigNumber;
  rewardDebt: BigNumber;
}

// -----------------------------
// Vesting Interfaces
// -----------------------------
export interface Grant {
  amount: BigNumber;
  start: number;
  cliff: number;
  duration: number;
  released: BigNumber;
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
