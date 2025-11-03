🦁🦅 Lion–Eagle LEAG Ecosystem — README.md
1️⃣ Project Overview

Project Name: Lion–Eagle LEAG Ecosystem
Tagline: Empowering community with staking, vesting, and Lion–Eagle tokenomics.

Description:
Lion–Eagle LEAG is a fully-featured ERC20 ecosystem combining:

#LEAG Token: ERC20 with minting, burning, snapshots, and role-based access.

#Staking: Multi-pool LP staking with flexible reward paths (direct mint or vesting).

#Vesting: Multi-grant, cliff-aware vesting system.

-Designed with security, gas efficiency, and upgradeability in mind.

2️⃣ Key Features

| Feature        | Description                                                       |
| -------------- | ----------------------------------------------------------------- |
| ERC20 Token    | Mint, burn, snapshot, selfBurn, role-based control                |
| Staking        | Multi-pool, reward accrual, optional vesting integration          |
| Vesting        | Cliff, duration, multiple grants per user, rounding-safe releases |
| Upgradeable    | UUPS proxy pattern for safe upgrades                              |
| Admin Controls | Recover non-LEAG tokens, manage roles securely                    |

3️⃣ Tokenomics

| Token      | Symbol | Total Supply               | Roles                                        |
| ---------- | ------ | -------------------------- | -------------------------------------------- |
| Lion–Eagle | LEAG   | Configurable at deployment | MINTER_ROLE, BURNER_ROLE, DEFAULT_ADMIN_ROLE |

Notes:

-Rewards are minted dynamically for staking pools.

-Vesting grants release tokens according to cliff & duration.

-Admin roles strictly control minting and burning.

4️⃣ Contracts

#LEAG Token

-ERC20 + roles + snapshots

-Self-burn and admin burn

-Gas-efficient operations

#LionEagleStakingManager

-Multi-pool staking

-Reward distribution: direct or vesting

-Emergency withdraw for LPs

-Handles multiple users and proportional rewards

#VestingLEAG

-Add grants with start, duration, cliff, amount

-Partial & full release

-Multiple grants per user

-Recover mistakenly sent ERC20 (except LEAG)

5️⃣ Deployment

# Install dependencies

npm install

# Compile

npx hardhat compile

# Deploy LEAG token

npx hardhat run scripts/deploy_leag.ts --network <network>

# Deploy VestingLEAG

npx hardhat run scripts/deploy_vesting.ts --network <network>

# Deploy LionEagleStakingManager

npx hardhat run scripts/deploy_staking.ts --network <network>

Post-deployment:

-Grant MINTER_ROLE to StakingManager and VestingLEAG contracts.

-Configure reward rates and LP pools.

-Initialize vesting and staking settings.

6️⃣ Usage

6.1 Staking

await stakingManager.addPool(lpToken, allocPoints);
await stakingManager.deposit(poolId, amount);
await stakingManager.claim(poolId);
await stakingManager.withdraw(poolId, amount);

6.2 Vesting

await vesting.addGrant(user, amount, start, cliff, duration);
await vesting.release(grantId); // user releases vested tokens

6.3 Admin Functions

await leag.grantRole(MINTER_ROLE, stakingManager.address);
await vesting.recoverERC20(nonLEAGToken, admin, amount);

7️⃣ Testing

Run tests:

npx hardhat test

#Coverage:

-LEAG token: minting, burning, snapshots, role management

-Staking: deposits, rewards, emergency withdrawals, multi-user tests

-Vesting: grants, cliff enforcement, partial/full release, multiple users/grants

✅ 22 passing tests, 2 pending optional tests (recoverERC20)

8️⃣ Security & Best Practices

-Upgradeable Contracts: UUPS proxy pattern ensures safe upgrades.

-Role-Based Security: Only admins can mint/burn or add vesting grants.

-Reward Calculations: accRewardPerShare ensures accurate proportional rewards.

-Vesting Safety: Cliff enforces lockup, and rounding errors are handled to release all tokens.

-Gas Optimization: Solidity 0.8.30 + optimizer enabled (200 runs)

9️⃣ Gas Estimates (for Developers)

| Contract       | Avg Gas   | % of Block Limit |
| -------------- | --------- | ---------------- |
| LEAG           | 2,762,838 | 9.2%             |
| StakingManager | 2,324,140 | 7.7%             |
| VestingLEAG    | 1,499,659 | 5%               |

10️⃣ Diagrams

Staking + Vesting Reward Flow:

User -> Deposit LP -> StakingManager
|
V
Rewards Accrue
----------------
| |
Direct Mint Vesting Contract
| |
V V
User User Claims

Vesting Grant Release Flow:

Owner -> Add Grant -> Grant Struct
start, duration, cliff, amount
|
V
Time Passes -> Partial Release -> User Balance
|
V
Full Duration -> All Tokens Released

11️⃣ Contact & Contribution

Lead Developer: Gbengisto

Github Repo: [replace-with-link]

Contribution Guidelines: Follow Lion–Eagle coding & testing standards.

Submit PRs with tests and gas profiling.

### Diagrams

#### 1. Staking + Vesting Flow

![Staking + Vesting Flow](diagrams/staking-vesting-flow.png)

#### 2. Vesting Grant Flow

![Vesting Grant Flow](diagrams/vesting-grant-flow.png)

#### 3. System Architecture

![System Architecture](diagrams/system-architecture.png)
