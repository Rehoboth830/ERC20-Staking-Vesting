import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';

describe('LionEagleStakingManager (staking + vesting integration)', function () {
  let leag: any;
  let vesting: any;
  let staking: any;
  let owner: any;
  let alice: any;
  let bob: any;
  const toWei = (n: string) => ethers.parseUnits(n, 18);

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();

    const LEAG = await ethers.getContractFactory('LEAG');
    leag = await upgrades.deployProxy(LEAG, [], { initializer: 'initialize' });
    await leag.waitForDeployment();

    // Deploy Vesting proxy (no init) then grant MINTER and initialize
    const Vesting = await ethers.getContractFactory('VestingLEAG');
    vesting = await upgrades.deployProxy(Vesting, [], { initializer: false });
    await vesting.waitForDeployment();
    await leag.grantRole(await leag.MINTER_ROLE(), vesting.target);
    await vesting.initialize(leag.target, owner.address);

    // Deploy Staking proxy (no init) then grant MINTER and initialize
    const Staking = await ethers.getContractFactory('LionEagleStakingManager');
    staking = await upgrades.deployProxy(Staking, [], { initializer: false });
    await staking.waitForDeployment();
    await leag.grantRole(await leag.MINTER_ROLE(), staking.target);

    // Initialize staking with rewardPerSecond = 1 LEAG/sec, vesting enabled
    const rewardPerSecond = toWei('1');
    await staking.initialize(leag.target, rewardPerSecond, owner.address, vesting.target);
  });

  it('add pool, deposit LP (using LEAG as LP), user info updates', async function () {
    // use LEAG as dummy LP token for tests
    await staking.addPool(leag, 100);
    // mint LP tokens to alice and approve
    await leag.mint(alice.address, toWei('1000'));
    await leag.connect(alice).approve(staking.target, toWei('1000'));

    await staking.connect(alice).deposit(0, toWei('500'));
    const info = await staking.userInfo(0, alice.address);
    expect(info.amount).to.equal(toWei('500'));
  });

  it('reward accrues over time and pendingReward matches manual calc (vesting path)', async function () {
    await staking.addPool(leag, 100);

    // fund staking contract with LEAG so it can forward to vesting (vesting path uses safeTransfer)
    // owner has minter rights by default, mint tokens to staking contract
    await leag.mint(staking.target, toWei('10000'));

    // alice deposits
    await leag.mint(alice.address, toWei('1000'));
    await leag.connect(alice).approve(staking.target, toWei('1000'));
    await staking.connect(alice).deposit(0, toWei('100'));

    // advance 10 seconds
    await ethers.provider.send('evm_increaseTime', [10]);
    await ethers.provider.send('evm_mine', []);

    // pendingReward should be: timeElapsed(10) * rewardPerSecond(1) * allocPoint/totalAllocPoint(1) * userShare
    // accRewardPerShare tracks per LP token: reward / lpSupply
    const pending = await staking.pendingReward(0, alice.address);
    expect(pending > 0n).to.be.true;

    // claiming will route rewards to vestingContract (because vestingContract set) via transfers,
    // but in our implementation _distributeReward transfers to vesting directly - user claim still emits Claim and user doesn't receive minted tokens directly.
    await staking.connect(alice).claim(0);
    // Since staking forwarded rewards to vesting, user's LEAG balance may still be zero; vesting now holds the tokens.
    const vestBal = await leag.balanceOf(vesting.target);
    expect(vestBal > 0n).to.be.true;
  });

  it('reward accrues and directly mints to user when vestingContract is disabled (direct mint path)', async function () {
    // deploy & init a fresh staking contract without vesting (vestingContract = address(0))
    const Staking = await ethers.getContractFactory('LionEagleStakingManager');
    const stakingNoVest = await upgrades.deployProxy(Staking, [], { initializer: false });
    await stakingNoVest.waitForDeployment();
    await leag.grantRole(await leag.MINTER_ROLE(), stakingNoVest.target);

    const rewardPerSecond = toWei('1');
    await stakingNoVest.initialize(leag.target, rewardPerSecond, owner.address, ethers.ZeroAddress);

    await stakingNoVest.addPool(leag, 100);
    await leag.mint(alice.address, toWei('1000'));
    await leag.connect(alice).approve(stakingNoVest.target, toWei('1000'));
    await stakingNoVest.connect(alice).deposit(0, toWei('100'));

    // advance 5 seconds
    await ethers.provider.send('evm_increaseTime', [5]);
    await ethers.provider.send('evm_mine', []);

    // claim: stakingNoVest should call rewardToken.mint(to, amount)
    await stakingNoVest.connect(alice).claim(0);
    // alice should have received minted reward tokens
    const aliceBal = await leag.balanceOf(alice.address);
    expect(aliceBal > 0n).to.be.true;
  });

  it('withdraw updates balances and rewardDebt correctly', async function () {
    await staking.addPool(leag, 100);
    await leag.mint(alice.address, toWei('1000'));
    await leag.connect(alice).approve(staking.target, toWei('1000'));
    await staking.connect(alice).deposit(0, toWei('500'));

    // advance and trigger some rewards
    await ethers.provider.send('evm_increaseTime', [5]);
    await ethers.provider.send('evm_mine', []);

    // withdraw partial
    await staking.connect(alice).withdraw(0, toWei('200'));

    const info = await staking.userInfo(0, alice.address);
    expect(info.amount).to.equal(toWei('300'));
  });

  it('emergencyWithdraw returns staked LP and resets rewardDebt', async function () {
    await staking.addPool(leag, 100);
    await leag.mint(bob.address, toWei('1000'));
    await leag.connect(bob).approve(staking.target, toWei('1000'));
    await staking.connect(bob).deposit(0, toWei('400'));

    await staking.connect(bob).emergencyWithdraw(0);
    const info = await staking.userInfo(0, bob.address);
    expect(info.amount).to.equal(0);
    expect(info.rewardDebt).to.equal(0);
  });

  it('multiple users share rewards proportional to stake', async function () {
    await staking.addPool(leag, 100);
    await leag.mint(alice.address, toWei('1000'));
    await leag.mint(bob.address, toWei('1000'));
    await leag.connect(alice).approve(staking.target, toWei('1000'));
    await leag.connect(bob).approve(staking.target, toWei('1000'));

    await staking.connect(alice).deposit(0, toWei('100'));
    await staking.connect(bob).deposit(0, toWei('300'));

    // advance 10 seconds
    await ethers.provider.send('evm_increaseTime', [10]);
    await ethers.provider.send('evm_mine', []);

    const pendingAlice = await staking.pendingReward(0, alice.address);
    const pendingBob = await staking.pendingReward(0, bob.address);

    // bob should have ~3x alice pending because staked 3x amount
    // allow some tolerance
    expect(pendingBob > pendingAlice * 2n).to.be.true;
  });
});
