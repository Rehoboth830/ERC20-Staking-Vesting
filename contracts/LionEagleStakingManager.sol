// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

// ...existing code...
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
// ...existing code...
interface ILEAG is IERC20Upgradeable {
    function mint(address to, uint256 amount) external;
    function hasRole(bytes32 role, address account) external view returns (bool);
    function MINTER_ROLE() external view returns (bytes32);
}

/// @title Lion-Eagle Staking Manager - Fully Upgradeable & Vesting-Integrated
contract LionEagleStakingManager is OwnableUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    /// @notice Reward token (LEAG)
    ILEAG public rewardToken;

    /// @notice Reward rate per second
    uint256 public rewardPerSecond;

    /// @notice Precision factor
    uint256 private constant ACC_PRECISION = 1e18;

    /// @notice Optional vesting contract
    address public vestingContract;

    /// @notice Pool info
    struct PoolInfo {
        IERC20Upgradeable lpToken;
        uint128 allocPoint;
        uint64 lastRewardTime;
        uint256 accRewardPerShare;
        bool exists;
    }

    /// @notice User staking info
    struct UserInfo {
        uint128 amount;
        uint256 rewardDebt;
    }

    PoolInfo[] public poolInfo;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    uint256 public totalAllocPoint;

    /// @notice Events
    event PoolAdded(uint256 indexed pid, address indexed lpToken, uint128 allocPoint);
    event PoolUpdated(uint256 indexed pid, uint128 allocPoint);
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount, uint256 pendingReward);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount, uint256 pendingReward);
    event Claim(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event RewardPerSecondUpdated(uint256 newRate);
    event Funded(uint256 amount);
    event ContractUpgraded(address indexed newImplementation);

    modifier validPool(uint256 pid) {
        require(pid < poolInfo.length && poolInfo[pid].exists, "Staking: invalid pool");
        _;
    }

    /// @notice Initialize staking manager
    function initialize(
        ILEAG _rewardToken,
        uint256 _rewardPerSecond,
        address _owner,
        address _vestingContract
    ) external initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        require(address(_rewardToken) != address(0), "zero reward token");
        rewardToken = _rewardToken;
        rewardPerSecond = _rewardPerSecond;
        vestingContract = _vestingContract;

        require(
            rewardToken.hasRole(rewardToken.MINTER_ROLE(), address(this)),
            "Staking: must have MINTER_ROLE"
        );

        _transferOwnership(_owner);
    }

    /* ========== POOL MANAGEMENT ========== */

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    function addPool(IERC20Upgradeable _lpToken, uint128 _allocPoint) external onlyOwner {
        require(address(_lpToken) != address(0), "zero lp token");
        uint64 currentTime = uint64(block.timestamp);
        poolInfo.push(PoolInfo({
            lpToken: _lpToken,
            allocPoint: _allocPoint,
            lastRewardTime: currentTime,
            accRewardPerShare: 0,
            exists: true
        }));
        totalAllocPoint += _allocPoint;
        emit PoolAdded(poolInfo.length - 1, address(_lpToken), _allocPoint);
    }

    function setPool(uint256 pid, uint128 _allocPoint) external onlyOwner validPool(pid) {
        totalAllocPoint = totalAllocPoint - poolInfo[pid].allocPoint + _allocPoint;
        poolInfo[pid].allocPoint = _allocPoint;
        emit PoolUpdated(pid, _allocPoint);
    }

    function setRewardPerSecond(uint256 _rewardPerSecond) external onlyOwner {
        rewardPerSecond = _rewardPerSecond;
        emit RewardPerSecondUpdated(_rewardPerSecond);
    }

    function fundRewards(uint256 amount) external onlyOwner {
        IERC20Upgradeable(address(rewardToken)).safeTransferFrom(msg.sender, address(this), amount);
        emit Funded(amount);
    }

    /* ========== STAKING ========== */

    function deposit(uint256 pid, uint256 amount) external nonReentrant validPool(pid) {
        _updatePool(pid);
        UserInfo storage user = userInfo[pid][msg.sender];
        PoolInfo storage pool = poolInfo[pid];

        uint256 pending = (uint256(user.amount) * pool.accRewardPerShare) / ACC_PRECISION - user.rewardDebt;
        if (pending > 0) _distributeReward(msg.sender, pending);

        if (amount > 0) {
            require(user.amount + amount <= type(uint128).max, "deposit overflow");
            pool.lpToken.safeTransferFrom(msg.sender, address(this), amount);
            user.amount += uint128(amount);
        }

        user.rewardDebt = (uint256(user.amount) * pool.accRewardPerShare) / ACC_PRECISION;
        emit Deposit(msg.sender, pid, amount, pending);
    }

    function withdraw(uint256 pid, uint256 amount) external nonReentrant validPool(pid) {
        _updatePool(pid);
        UserInfo storage user = userInfo[pid][msg.sender];
        PoolInfo storage pool = poolInfo[pid];

        require(user.amount >= amount, "withdraw: insufficient");

        uint256 pending = (uint256(user.amount) * pool.accRewardPerShare) / ACC_PRECISION - user.rewardDebt;
        if (pending > 0) _distributeReward(msg.sender, pending);

        if (amount > 0) {
            unchecked { user.amount -= uint128(amount); }
            pool.lpToken.safeTransfer(msg.sender, amount);
        }

        user.rewardDebt = (uint256(user.amount) * pool.accRewardPerShare) / ACC_PRECISION;
        emit Withdraw(msg.sender, pid, amount, pending);
    }

    function claim(uint256 pid) external nonReentrant validPool(pid) {
        _updatePool(pid);
        UserInfo storage user = userInfo[pid][msg.sender];
        PoolInfo storage pool = poolInfo[pid];

        uint256 pending = (uint256(user.amount) * pool.accRewardPerShare) / ACC_PRECISION - user.rewardDebt;
        require(pending > 0, "claim: no rewards");

        _distributeReward(msg.sender, pending);
        user.rewardDebt = (uint256(user.amount) * pool.accRewardPerShare) / ACC_PRECISION;
        emit Claim(msg.sender, pid, pending);
    }

    function emergencyWithdraw(uint256 pid) external nonReentrant validPool(pid) {
        UserInfo storage user = userInfo[pid][msg.sender];
        PoolInfo storage pool = poolInfo[pid];

        uint128 amount = user.amount;
        require(amount > 0, "emergency: no stake");

        user.amount = 0;
        user.rewardDebt = 0;

        pool.lpToken.safeTransfer(msg.sender, amount);
        emit EmergencyWithdraw(msg.sender, pid, amount);
    }

    /* ========== INTERNAL FUNCTIONS ========== */

    function _updatePool(uint256 pid) internal {
        PoolInfo storage pool = poolInfo[pid];
        uint64 ts = uint64(block.timestamp);
        if (ts <= pool.lastRewardTime) return;

        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (lpSupply == 0 || totalAllocPoint == 0) {
            pool.lastRewardTime = ts;
            return;
        }

        uint256 timeElapsed = ts - pool.lastRewardTime;
        uint256 reward = (timeElapsed * rewardPerSecond * pool.allocPoint) / totalAllocPoint;

        pool.accRewardPerShare += (reward * ACC_PRECISION) / lpSupply;
        pool.lastRewardTime = ts;
    }

    function _distributeReward(address to, uint256 amount) internal {
        if (vestingContract != address(0)) {
            IERC20Upgradeable(rewardToken).safeTransfer(vestingContract, amount);
        } else {
            rewardToken.mint(to, amount);
        }
    }

    /* ========== ADMIN RESCUE ========== */

    function rescueTokens(IERC20Upgradeable token, address to, uint256 amount) external onlyOwner {
        require(address(token) != address(rewardToken), "cannot rescue reward token");
        token.safeTransfer(to, amount);
    }

    /* ========== UUPS UPGRADE ========== */

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        require(newImplementation != address(0), "invalid upgrade address");
        emit ContractUpgraded(newImplementation);
    }

    /* ========== VIEW FUNCTIONS ========== */

    /// @notice Pending reward for a user in a pool
    function pendingReward(uint256 pid, address userAddr) external view validPool(pid) returns (uint256) {
        PoolInfo storage pool = poolInfo[pid];
        UserInfo storage user = userInfo[pid][userAddr];

        uint256 accRewardPerShare_ = pool.accRewardPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        uint64 ts = uint64(block.timestamp);

        if (ts > pool.lastRewardTime && lpSupply != 0 && totalAllocPoint != 0) {
            uint256 timeElapsed = ts - pool.lastRewardTime;
            uint256 reward = (timeElapsed * rewardPerSecond * pool.allocPoint) / totalAllocPoint;
            accRewardPerShare_ += (reward * ACC_PRECISION) / lpSupply;
        }

        return (uint256(user.amount) * accRewardPerShare_) / ACC_PRECISION - user.rewardDebt;
    }
}
