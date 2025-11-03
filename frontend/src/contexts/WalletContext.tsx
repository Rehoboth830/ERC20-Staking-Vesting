// src/contexts/WalletContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ethers } from 'ethers';

// Allow TypeScript to recognize window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Import ABIs from your project
import LEAG from '../abis/LEAG.json';
import LionEagleStakingManager from '../abis/LionEagleStakingManager.json';
import VestingLEAG from '../abis/VestingLEAG.json';

// Replace with your deployed contract addresses
const LEAG_ADDRESS = "0xYourLEAGAddress";
const STAKING_ADDRESS = "0xYourStakingManagerAddress";
const VESTING_ADDRESS = "0xYourVestingLEAGAddress";

interface WalletContextProps {
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  address: string | null;
  account: string | null;
  network: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  loading: boolean;
  leagContract: ethers.Contract | null;
  stakingContract: ethers.Contract | null;
  vestingContract: ethers.Contract | null;
}

export const WalletContext = createContext<WalletContextProps>({
  provider: null,
  signer: null,
  address: null,
  account: null,
  network: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  loading: false,
  leagContract: null,
  stakingContract: null,
  vestingContract: null,
});

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [leagContract, setLEAGContract] = useState<ethers.Contract | null>(null);
  const [stakingContract, setStakingContract] = useState<ethers.Contract | null>(null);
  const [vestingContract, setVestingContract] = useState<ethers.Contract | null>(null);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    try {
      setLoading(true);

      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      await browserProvider.send('eth_requestAccounts', []);
      const signer = await browserProvider.getSigner();
      const address = await signer.getAddress();
      const network = (await browserProvider.getNetwork()).name;

      setProvider(browserProvider);
      setSigner(signer);
      setAddress(address);
      setNetwork(network);

      // Initialize contracts
      setLEAGContract(new ethers.Contract(LEAG_ADDRESS, LEAG.abi, signer));
      setStakingContract(new ethers.Contract(STAKING_ADDRESS, LionEagleStakingManager.abi, signer));
      setVestingContract(new ethers.Contract(VESTING_ADDRESS, VestingLEAG.abi, signer));

      // Listen for account or network changes
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    } catch (error) {
      console.error('Wallet connection failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAddress(null);
    setNetwork(null);
    setLEAGContract(null);
    setStakingContract(null);
    setVestingContract(null);
    window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
    window.ethereum?.removeListener('chainChanged', handleChainChanged);
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) disconnectWallet();
    else setAddress(accounts[0]);
  };

  const handleChainChanged = async (_chainId: string) => {
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const network = (await browserProvider.getNetwork()).name;
      setNetwork(network);
      if (signer) {
        setLEAGContract(new ethers.Contract(LEAG_ADDRESS, LEAG.abi, signer));
        setStakingContract(new ethers.Contract(STAKING_ADDRESS, LionEagleStakingManager.abi, signer));
        setVestingContract(new ethers.Contract(VESTING_ADDRESS, VestingLEAG.abi, signer));
      }
    } catch (err) {
      console.error('Error switching network:', err);
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await browserProvider.send('eth_accounts', []);
        if (accounts.length > 0) {
          await connectWallet();
        }
      }
    };
    checkConnection();
  }, []);

  return (
    <WalletContext.Provider
      value={{
        provider,
        signer,
        address,
        account: address,
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
