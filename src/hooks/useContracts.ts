// src/hooks/useContracts.ts
import { useState, useEffect, useMemo } from "react";
import { BrowserProvider, Contract, JsonRpcSigner } from "ethers";
import LEAG_ABI from "../abis/LEAG.json";
import Staking_ABI from "../abis/LionEagleStakingManager.json";
import Vesting_ABI from "../abis/VestingLEAG.json";
import { useWallet } from "./useWallet";

/**
 * Network-based contract addresses
 */
const NETWORK_ADDRESSES = {
  LOCAL: {
    LEAG: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    STAKING: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
    VESTING: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  },
  SEPOLIA: {
    LEAG: "0x81bC25AD516a97f6FC70609f97117858781822D0",
    STAKING: "0xAa2C27a993a2221E5f0F92547bc7FF0b94995238",
    VESTING: "0x8216B9568d05ccEA31F41d4a0FD87e57e6853450",
  },
};


/**
 * Get contract address dynamically:
 * 1. First try environment variable
 * 2. Fallback to selected network
 */
const getContractAddress = (
  envVar: string,
  network: "LOCAL" | "SEPOLIA",
  contract: "LEAG" | "STAKING" | "VESTING"
): string => {
  const envAddress = process.env[envVar];
  if (envAddress && envAddress !== "") return envAddress;
  return NETWORK_ADDRESSES[network][contract];
};

interface UseContractsReturn {
  LEAG: Contract | null;
  LionEagleStakingManager: Contract | null;
  VestingLEAG: Contract | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  error: string | null;
}

export const useContracts = (): UseContractsReturn => {
  const { address, isConnected } = useWallet() as {
    address: string;
    isConnected: boolean;
  };
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Choose network (from env or default to LOCAL)
  const NETWORK: "LOCAL" | "SEPOLIA" =
    process.env.NEXT_PUBLIC_NETWORK === "SEPOLIA" ? "SEPOLIA" : "LOCAL";

  // Reset contracts on disconnect
  useEffect(() => {
    if (!isConnected) {
      setSigner(null);
      setError(null);
    }
  }, [isConnected]);

  // Initialize provider and signer
  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      setError("MetaMask not detected. Please install MetaMask.");
      return;
    }

    const initProviderAndSigner = async () => {
      try {
        const web3Provider = new BrowserProvider((window as any).ethereum);
        setProvider(web3Provider);

        const signerInstance = isConnected
          ? await web3Provider.getSigner()
          : null;
        setSigner(signerInstance);
      } catch (err: any) {
        console.error("❌ Provider/Signer initialization failed:", err);
        setError(err?.message || "Failed to initialize provider or signer.");
      }
    };

    initProviderAndSigner();
  }, [isConnected]);

  // Memoized contracts
  const LEAG = useMemo(() => {
    if (!provider) return null;
    const signerOrProvider = signer || provider;
    const LEAG_ADDRESS = getContractAddress(
      "NEXT_PUBLIC_LEAG_ADDRESS",
      NETWORK,
      "LEAG"
    );
    return new Contract(LEAG_ADDRESS, LEAG_ABI.abi, signerOrProvider);
  }, [provider, signer, NETWORK]);

  const LionEagleStakingManager = useMemo(() => {
    if (!provider) return null;
    const signerOrProvider = signer || provider;
    const STAKING_ADDRESS = getContractAddress(
      "NEXT_PUBLIC_STAKING_ADDRESS",
      NETWORK,
      "STAKING"
    );
    return new Contract(STAKING_ADDRESS, Staking_ABI.abi, signerOrProvider);
  }, [provider, signer, NETWORK]);

  const VestingLEAG = useMemo(() => {
    if (!provider) return null;
    const signerOrProvider = signer || provider;
    const VESTING_ADDRESS = getContractAddress(
      "NEXT_PUBLIC_VESTING_ADDRESS",
      NETWORK,
      "VESTING"
    );
    return new Contract(VESTING_ADDRESS, Vesting_ABI.abi, signerOrProvider);
  }, [provider, signer, NETWORK]);

  return {
    LEAG,
    LionEagleStakingManager,
    VestingLEAG,
    provider,
    signer,
    error,
  };
};

export default useContracts;
