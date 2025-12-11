// scripts/setupFullTestData.ts
import { ethers } from 'hardhat';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  // --------------------------
  // 1️⃣ Get signer (deployer)
  // --------------------------
  const [deployer] = await ethers.getSigners();
  console.log('🦁🦅 Setting up test data with account:', deployer.address);

  // --------------------------
  // 2️⃣ Connect to deployed proxies
  // --------------------------
  const LEAG_ADDRESS = process.env.LEAG_ADDRESS!;
  const VESTING_ADDRESS = process.env.VESTING_ADDRESS!;
  const STAKING_ADDRESS = process.env.STAKING_ADDRESS!;

  if (!LEAG_ADDRESS || !VESTING_ADDRESS || !STAKING_ADDRESS) {
    throw new Error('Please set LEAG_ADDRESS, VESTING_ADDRESS, STAKING_ADDRESS in .env');
  }

  // Upgradeable proxies might require 'as any' for .target
  const leag = (await ethers.getContractAt('LEAG', LEAG_ADDRESS)) as any;
  const vesting = (await ethers.getContractAt('VestingLEAG', VESTING_ADDRESS)) as any;
  const staking = (await ethers.getContractAt('LionEagleStakingManager', STAKING_ADDRESS)) as any;

  console.log('✅ Contracts connected');

  // --------------------------
  // 3️⃣ Add a staking pool
  // --------------------------
  const LP_TOKEN = LEAG_ADDRESS; // ✅ Use LEAG as LP token for test
  const ALLOC_POINT = 1000;

  console.log(`Adding staking pool with LP token: ${LP_TOKEN}`);
  const addPoolTx = await staking.addPool(LP_TOKEN, ALLOC_POINT);
  await addPoolTx.wait();
  console.log('✅ Staking pool added');

  // --------------------------
  // 4️⃣ Add vesting grants
  // --------------------------
  const now = Math.floor(Date.now() / 1000);

  const testGrants = [
    {
      user: deployer,
      amount: ethers.parseUnits('1000', 18),
      cliff: 60 * 60 * 24 * 30,      // 1 month
      duration: 60 * 60 * 24 * 365,  // 1 year
    },
    {
      user: deployer,
      amount: ethers.parseUnits('500', 18),
      cliff: 60 * 60 * 24 * 7,       // 1 week
      duration: 60 * 60 * 24 * 90,   // 3 months
    },
  ];

  for (const grant of testGrants) {
    const tx = await vesting.addGrant(
      grant.user.address,
      grant.amount,
      now,              // start timestamp
      grant.cliff,      // cliff duration
      grant.duration    // vesting duration
    );
    await tx.wait();
    console.log(`✅ Vesting grant added for ${grant.user.address}: ${ethers.formatUnits(grant.amount, 18)} LEAG`);
  }

  console.log('🎯 Full test data setup complete!');
}

main().catch((err) => {
  console.error('🛑 Setup failed:', err);
  process.exit(1);
});
