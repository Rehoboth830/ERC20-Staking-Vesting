import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox'; // Chai, Ethers, Upgrades
import '@nomicfoundation/hardhat-chai-matchers';
import '@typechain/hardhat';
import '@openzeppelin/hardhat-upgrades'; // ✅ Added for upgrades support
import * as dotenv from 'dotenv';

dotenv.config();

// --------------------------
// Environment Variables (.env file)
// --------------------------
// PRIVATE_KEY=your_deployer_private_key
// INFURA_API_KEY=your_infura_project_id
// --------------------------

const SEPOLIA_RPC = `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`;
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';

// ✅ Dummy private key for local compile validation
const DUMMY_KEY = '0x0000000000000000000000000000000000000000000000000000000000000000';

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat', // Use local network by default
  solidity: {
    compilers: [
      {
        version: '0.8.30', // Align with Vesting/Staking contracts
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: '0.8.30', // Align with LEAG.sol
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 1337,
      // Removed custom single account → Hardhat will auto-generate 20 accounts
    },
    sepolia: {
      url: SEPOLIA_RPC,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [DUMMY_KEY], // ✅ Dummy key prevents compile errors
      chainId: 11155111,
    },
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v6',
    alwaysGenerateOverloads: true,
    externalArtifacts: [],
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || '',
  },
  mocha: {
    timeout: 600000, // 10 minutes for large tests
  },
};

export default config;
