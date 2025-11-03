// scripts/deploy.ts
import { ethers, upgrades } from 'hardhat'; // ✅ upgrades import fixed
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('🦁🦅 Deploying Lion-Eagle contracts with account:', deployer.address);

  const rewardPerSecond = process.env.REWARD_PER_SECOND
    ? ethers.parseUnits(process.env.REWARD_PER_SECOND, 18)
    : ethers.parseUnits('1', 18);

  let leag: any;
  let vesting: any;
  let staking: any;

  try {
    // --------------------------
    // 1️⃣ Deploy LEAG token
    // --------------------------
    const LEAG = await ethers.getContractFactory('LEAG');
    leag = await upgrades.deployProxy(LEAG, [], { initializer: 'initialize' });
    console.log(`✅ LEAG deployed at: ${leag.target}`);

    // --------------------------
    // 2️⃣ Deploy VestingLEAG WITHOUT initialize
    // --------------------------
    const VestingLEAG = await ethers.getContractFactory('VestingLEAG');
    vesting = await upgrades.deployProxy(VestingLEAG, [], { initializer: false }); // Skip init
    console.log(`✅ VestingLEAG deployed at: ${vesting.target}`);

    // --------------------------
    // 3️⃣ Deploy Staking Manager WITHOUT initialize
    // --------------------------
    const LionEagleStakingManager = await ethers.getContractFactory('LionEagleStakingManager');
    staking = await upgrades.deployProxy(LionEagleStakingManager, [], { initializer: false });
    console.log(`✅ StakingManager deployed at: ${staking.target}`);

    // --------------------------
    // 4️⃣ Grant MINTER_ROLE to Vesting & Staking
    // --------------------------
    const MINTER_ROLE = await leag.MINTER_ROLE();

    const grantRoleAndVerify = async (contractName: string, address: string) => {
      const tx = await leag.grantRole(MINTER_ROLE, address);
      await tx.wait();
      const hasRole = await leag.hasRole(MINTER_ROLE, address);
      if (!hasRole) throw new Error(`Failed to grant MINTER_ROLE to ${contractName}`);
      console.log(`✅ MINTER_ROLE granted & verified for ${contractName} at ${address}`);
    };

    await grantRoleAndVerify('VestingLEAG', vesting.target);
    await grantRoleAndVerify('StakingManager', staking.target);

    // --------------------------
    // 5️⃣ Initialize Vesting & Staking now that roles are granted
    // --------------------------
    await vesting.initialize(leag.target, deployer.address);
    console.log(`✅ VestingLEAG initialized at: ${vesting.target}`);

    await staking.initialize(leag.target, rewardPerSecond, deployer.address, vesting.target);
    console.log(`✅ StakingManager initialized at: ${staking.target}`);

    console.log('🎯 All Lion-Eagle contracts deployed and integrated successfully!');
  } catch (err) {
    console.error('🛑 Deployment failed:', err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('🛑 Unexpected failure:', err);
  process.exit(1);
});
