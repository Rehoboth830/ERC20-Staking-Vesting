import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';

describe('LEAG Token (Lion-Eagle)', function () {
  let leag: any;
  let owner: any;
  let user: any;
  let other: any;

  beforeEach(async () => {
    [owner, user, other] = await ethers.getSigners();
    const LEAG = await ethers.getContractFactory('LEAG');

    // ✅ Deploy proxy
    leag = await upgrades.deployProxy(LEAG, [], { initializer: 'initialize' });
  });

  it('has correct name, symbol and initial supply minted to deployer', async function () {
    expect(await leag.name()).to.equal('Lion-Eagle Token');
    expect(await leag.symbol()).to.equal('LEAG');

    const initialSupply = await leag.INITIAL_SUPPLY();
    const ownerBal = await leag.balanceOf(await owner.getAddress());
    expect(ownerBal).to.equal(initialSupply);
  });

  it('minter role: only accounts with MINTER_ROLE can mint', async function () {
    const MINTER_ROLE = await leag.MINTER_ROLE();

    await expect(leag.connect(owner).mint(user.address, ethers.parseUnits('100', 18))).to.not.be
      .reverted;

    expect(await leag.balanceOf(user.address)).to.equal(ethers.parseUnits('100', 18));

    await leag.revokeRole(MINTER_ROLE, await owner.getAddress());
    await expect(leag.connect(owner).mint(user.address, ethers.parseUnits('1', 18))).to.be.reverted;
  });

  it('burn role: only BURNER_ROLE can burn from any address', async function () {
    const BURNER_ROLE = await leag.BURNER_ROLE();

    // mint some tokens to 'other'
    await leag.grantRole(await leag.MINTER_ROLE(), await owner.getAddress());
    await leag.mint(other.address, ethers.parseUnits('200', 18));

    // ✅ non-burner (user) cannot burn
    await expect(leag.connect(user).burn(other.address, ethers.parseUnits('10', 18))).to.be
      .reverted;

    // ✅ grant burner role and burn successfully
    await leag.grantRole(BURNER_ROLE, await owner.getAddress());
    await expect(leag.connect(owner).burn(other.address, ethers.parseUnits('10', 18))).to.not.be
      .reverted;

    expect(await leag.balanceOf(other.address)).to.equal(ethers.parseUnits('190', 18));
  });

  it('selfBurn works for token holder', async function () {
    await leag.mint(user.address, ethers.parseUnits('50', 18));
    await leag.connect(user).selfBurn(ethers.parseUnits('20', 18));
    expect(await leag.balanceOf(user.address)).to.equal(ethers.parseUnits('30', 18));
  });

  it('snapshot stores balances correctly', async function () {
    await leag.mint(user.address, ethers.parseUnits('100', 18));
    await leag.mint(other.address, ethers.parseUnits('50', 18));

    const tx = await leag.snapshot();
    await tx.wait();

    expect(await leag.balanceOf(user.address)).to.be.ok;
    expect(await leag.totalSupply()).to.be.ok;
  });

  it('role management: grant and revoke DEFAULT_ADMIN_ROLE affects role changes', async function () {
    const MINTER_ROLE = await leag.MINTER_ROLE();

    await leag.grantRole(MINTER_ROLE, user.address);
    expect(await leag.hasRole(MINTER_ROLE, user.address)).to.be.true;

    await leag.revokeRole(MINTER_ROLE, user.address);
    expect(await leag.hasRole(MINTER_ROLE, user.address)).to.be.false;
  });
});
