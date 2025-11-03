import { ethers } from "ethers";
import { CONTRACTS } from "./contracts";

let provider: ethers.BrowserProvider;
let signer: ethers.Signer;

/**
 * Initialize provider from window.ethereum (MetaMask)
 */
export const initProvider = async (): Promise<ethers.BrowserProvider> => {
  if (typeof window !== "undefined" && window.ethereum) {
    provider = new ethers.BrowserProvider(window.ethereum);
    return provider;
  } else {
    throw new Error("No Ethereum provider found. Install MetaMask.");
  }
};

/**
 * Request wallet connection
 */
export const connectWallet = async (): Promise<string> => {
  if (!provider) await initProvider();

  const accounts = await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();

  return accounts[0];
};

/**
 * Get signer for sending transactions
 */
export const getSigner = (): ethers.Signer => {
  if (!signer) throw new Error("Wallet not connected.");
  return signer;
};

/**
 * Get contract instance with read-only provider or connected signer
 */
export const getContract = (
  contractKey: keyof typeof CONTRACTS,
  useSigner: boolean = false
) => {
  const contractData = CONTRACTS[contractKey];
  if (!provider) throw new Error("Provider not initialized.");

  const contractProvider = useSigner ? getSigner() : provider;
  return new ethers.Contract(contractData.address, contractData.abi, contractProvider);
};
