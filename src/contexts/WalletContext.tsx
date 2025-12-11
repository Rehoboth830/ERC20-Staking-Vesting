// src/contexts/WalletContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { ethers } from "ethers";

// Allow TypeScript to recognize window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

// ============================
// ENV CONFIG
// ============================
type Network = "local" | "sepolia";

const DEFAULT_NETWORK: Network =
  (process.env.NEXT_PUBLIC_DEFAULT_NETWORK as Network) || "sepolia";

// RPCs (use environment variables if present; fall back to sensible defaults)
const RPC: Record<Network, string> = {
  local: process.env.NEXT_PUBLIC_LOCAL_RPC_URL || "http://127.0.0.1:8545",
  sepolia:
    process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
};

// Chain IDs
const CHAIN: Record<Network, number> = {
  local: Number(process.env.NEXT_PUBLIC_LOCAL_CHAIN_ID) || 1337,
  sepolia: Number(process.env.NEXT_PUBLIC_SEPOLIA_CHAIN_ID) || 11155111,
};

// Contract addresses
// IMPORTANT: FALLBACKS are set to the deployed Sepolia addresses you shared.
// These will be overridden if you set the corresponding NEXT_PUBLIC_ env vars.
const CONTRACTS: Record<
  Network,
  { leag: string; staking: string; vesting: string }
> = {
  local: {
    leag: process.env.NEXT_PUBLIC_LOCAL_LEAG_ADDRESS || "",
    staking: process.env.NEXT_PUBLIC_LOCAL_STAKING_ADDRESS || "",
    vesting: process.env.NEXT_PUBLIC_LOCAL_VESTING_ADDRESS || "",
  },
 sepolia: {
  leag:
    process.env.NEXT_PUBLIC_SEPOLIA_LEAG_ADDRESS ||
    "0x81bC25AD516a97f6FC70609f97117858781822D0",
  staking:
    process.env.NEXT_PUBLIC_SEPOLIA_STAKING_ADDRESS ||
    "0xAa2C27a993a2221E5f0F92547bc7FF0b94995238",
  vesting:
    process.env.NEXT_PUBLIC_SEPOLIA_VESTING_ADDRESS ||
    "0x8216B9568d05ccEA31F41d4a0FD87e57e6853450",
},

};

// ABIs
import LEAG from "../abis/LEAG.json";
import LionEagleStakingManager from "../abis/LionEagleStakingManager.json";
import VestingLEAG from "../abis/VestingLEAG.json";

// ============================
// TYPES
// ============================
interface WalletContextProps {
  provider: ethers.BrowserProvider | ethers.JsonRpcProvider | null;
  signer: ethers.Signer | null;
  address: string | null;
  chainId: number | null;
  network: Network;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  loading: boolean;
  leagContract: ethers.Contract | null;
  stakingContract: ethers.Contract | null;
  vestingContract: ethers.Contract | null;
}

export const WalletContext = createContext<WalletContextProps>(
  {} as WalletContextProps
);

// ============================
// PROVIDER COMPONENT
// ============================
export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [provider, setProvider] =
    useState<ethers.BrowserProvider | ethers.JsonRpcProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [network, setNetwork] = useState<Network>(DEFAULT_NETWORK);
  const [loading, setLoading] = useState<boolean>(false);

  const [leagContract, setLEAGContract] = useState<ethers.Contract | null>(
    null
  );
  const [stakingContract, setStakingContract] =
    useState<ethers.Contract | null>(null);
  const [vestingContract, setVestingContract] =
    useState<ethers.Contract | null>(null);

  // ======================================
  // Initialize STATIC RPC provider
  // (works even WITHOUT wallet connected)
  // ======================================
  useEffect(() => {
    const rpcProvider = new ethers.JsonRpcProvider(RPC[DEFAULT_NETWORK]);
    setProvider(rpcProvider);

    // Bind read-only contracts with RPC provider
    setLEAGContract(
      new ethers.Contract(CONTRACTS[DEFAULT_NETWORK].leag, LEAG.abi, rpcProvider)
    );
    setStakingContract(
      new ethers.Contract(
        CONTRACTS[DEFAULT_NETWORK].staking,
        LionEagleStakingManager.abi,
        rpcProvider
      )
    );
    setVestingContract(
      new ethers.Contract(
        CONTRACTS[DEFAULT_NETWORK].vesting,
        VestingLEAG.abi,
        rpcProvider
      )
    );
  }, []);

  // ============================
  // CONNECT WALLET
  // ============================
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask");
      return;
    }

    try {
      setLoading(true);

      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      await browserProvider.send("eth_requestAccounts", []);
      const signer = await browserProvider.getSigner();
      const address = await signer.getAddress();

      const net = await browserProvider.getNetwork();
      const cid = Number(net.chainId);

      setProvider(browserProvider);
      setSigner(signer);
      setAddress(address);
      setChainId(cid);

      // Choose network config based on chainId
      const chainName: Network =
        (Object.keys(CHAIN).find((key) => CHAIN[key as Network] === cid) as Network) ||
        "sepolia";

      setNetwork(chainName);

      if (chainName) {
        // Bind contracts with signer
        setLEAGContract(
          new ethers.Contract(CONTRACTS[chainName].leag, LEAG.abi, signer)
        );
        setStakingContract(
          new ethers.Contract(
            CONTRACTS[chainName].staking,
            LionEagleStakingManager.abi,
            signer
          )
        );
        setVestingContract(
          new ethers.Contract(CONTRACTS[chainName].vesting, VestingLEAG.abi, signer)
        );
      }
    } catch (error) {
      console.error("Wallet connection failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // DISCONNECT
  // ============================
  const disconnectWallet = () => {
    setSigner(null);
    setAddress(null);
    setChainId(null);
  };

  // ============================
  // HANDLE ACCOUNT CHANGES
  // ============================
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) disconnectWallet();
      else setAddress(accounts[0]);
    };

    const handleChainChanged = () => window.location.reload();

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  return (
    <WalletContext.Provider
      value={{
        provider,
        signer,
        address,
        chainId,
        network,
        connectWallet,
        disconnectWallet,
        loading,
        leagContract,
        stakingContract,
        vestingContract,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
