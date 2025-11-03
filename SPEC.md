🦁🦅 Lion–Eagle ERC20 Project — SPEC.md
1️⃣ Project Overview

Project Name: Lion–Eagle LEAG Ecosystem
Purpose: Full-featured ERC20 ecosystem with staking, vesting, and Lion–Eagle standards for governance, rewards, and token distribution.
Contracts:

Contract Role
LEAG ERC20 token with minting, burning, snapshots, and role-based access control.
LionEagleStakingManager Staking contract supporting LP deposits, reward accrual, and optional vesting integration.
VestingLEAG Vesting contract allowing multiple grants per user, cliff, duration, and partial/total release.

2️⃣ Key Design Principles

1. Upgradeable Contracts:

All contracts use OpenZeppelin UUPS proxy pattern.

Allows safe upgrades without losing state.

2. Role-Based Security:

LEAG: DEFAULT_ADMIN_ROLE, MINTER_ROLE, BURNER_ROLE.

VestingLEAG & StakingManager require admin approval for sensitive functions.

3. Staking + Vesting Integration:

Rewards can either go directly to the user or through vesting contract.

Supports multiple pools and LP tokens.

4. Precision & Gas Optimization:

Solidity 0.8.30

Optimizer enabled, 200 runs

Storage packing used where appropriate.

Gas-efficient reward calculations (accRewardPerShare, rewardDebt).

3️⃣ Contracts & Methods
#LEAG Token

| Method                        | Gas-Avg Purpose |
| ----------------------------- | --------------- | ---------------------------------------------- |
| `mint(address,uint256)`       | 67,653          | Mint new tokens; only MINTER_ROLE              |
| `burn(address,uint256)`       | 50,645          | Burn tokens from any address; only BURNER_ROLE |
| `selfBurn(uint256)`           | 47,809          | Token holder burns own tokens                  |
| `snapshot()`                  | 52,073          | Create a snapshot for balance tracking         |
| `grantRole(bytes32,address)`  | 54,840          | Assign roles to accounts                       |
| `revokeRole(bytes32,address)` | 34,443          | Revoke roles                                   |

#LionEagleStakingManager

| Method                                        | Gas Avg | Purpose                            |
| --------------------------------------------- | ------- | ---------------------------------- |
| `initialize(address,uint256,address,address)` | 175,453 | Initialize staking contract        |
| `addPool(address,uint256)`                    | 144,457 | Add LP pool with allocation points |
| `deposit(uint256,uint256)`                    | 134,671 | Deposit LP tokens                  |
| `withdraw(uint256,uint256)`                   | 164,561 | Withdraw LP tokens                 |
| `claim(uint256)`                              | 124,075 | Claim accrued rewards              |
| `emergencyWithdraw(uint256)`                  | 64,527  | Withdraw LP without rewards        |

Notes:

rewardPerSecond configurable per deployment.

Supports vesting integration for automated reward forwarding.

#VestingLEAG

| Method                                              | Gas Avg | Purpose                |
| --------------------------------------------------- | ------- | ---------------------- |
| `initialize(address,address)`                       | 133,407 | Set token & owner      |
| `addGrant(address,uint256,uint256,uint256,uint256)` | 169,945 | Create a vesting grant |
| `release(uint256)`                                  | 105,256 | Release vested tokens  |

Features:

Multiple grants per user

Cliff & duration enforcement

Handles rounding errors

Owner can recover ERC20 tokens except LEAG

4️⃣ User Flow Diagrams

1. Staking + Vesting Reward Flow:

User -> Deposit LP -> StakingManager
|
V
Rewards Accrue
|
----------------
| |
Direct Mint Vesting Contract
| |
V V
User User Claims

2. Vesting Grant Release:

Owner -> Add Grant -> Grant Struct:
start, duration, cliff, amount
|
V
Time Passes -> Partial Release -> User Balance
|
V
Full Duration -> All Tokens Released

5️⃣ Deployment & Configuration

LEAG Token

npx hardhat run scripts/deploy_leag.ts --network <network>

VestingLEAG

npx hardhat run scripts/deploy_vesting.ts --network <network>

LionEagleStakingManager

npx hardhat run scripts/deploy_staking.ts --network <network>

4. Initialize

Grant MINTER_ROLE to StakingManager and VestingLEAG.

Configure reward rates and LP pools.

6️⃣ Security & Audit Notes

Upgradeable Contracts: Use UUPS; verify with OpenZeppelin upgrades plugin.

Role Restrictions: Only admin accounts can mint, burn, or add grants.

Reward Calculations: Uses accRewardPerShare to prevent rounding errors.

Vesting Safety: Cliff ensures no premature withdrawals; full release guarantees token completion.

7️⃣ Gas Estimates Summary

| Contract                | Avg Gas Usage | % of Block Limit |
| ----------------------- | ------------- | ---------------- |
| LEAG                    | 2,762,838     | 9.2%             |
| LionEagleStakingManager | 2,324,140     | 7.7%             |
| VestingLEAG             | 1,499,659     | 5%               |

8️⃣ Testing Coverage

All core features fully tested: minting, burning, snapshot, staking, reward calculation, vesting, multiple users & grants.

Pending: recoverERC20 optional tests.

✅ 22 passing / 2 pending (non-critical)

### Diagrams

#### 1. Staking + Vesting Flow

![Staking + Vesting Flow](diagrams/staking-vesting-flow.png)

#### 2. Vesting Grant Flow

![Vesting Grant Flow](diagrams/vesting-grant-flow.png)

#### 3. System Architecture

![System Architecture](diagrams/system-architecture.png)
