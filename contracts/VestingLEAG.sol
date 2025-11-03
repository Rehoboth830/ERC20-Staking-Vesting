// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./LEAG.sol";


/// @title Lion-Eagle Token Vesting (Upgradeable & Multi-Grant)
/// @notice Fully upgradeable vesting with multi-grant support, integrated with LEAG token
contract VestingLEAG is OwnableUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
    LEAG public token;

    struct Grant {
        uint256 amount;      // 32 bytes
        uint128 start;       // 16 bytes
        uint128 cliff;       // 16 bytes
        uint128 duration;    // 16 bytes
        uint256 released;    // 32 bytes
    }

    // Support multiple grants per beneficiary
    mapping(address => Grant[]) public grants;

    event GrantAdded(address indexed beneficiary, uint256 indexed grantIndex, uint256 amount, uint128 start, uint128 cliff, uint128 duration);
    event TokensReleased(address indexed beneficiary, uint256 indexed grantIndex, uint256 amount);
    event ContractUpgraded(address indexed newImplementation);

    /// @notice Initialize vesting contract
    function initialize(LEAG _token, address owner_) external initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        require(address(_token) != address(0), "VestingLEAG: zero token address");
        token = _token;

        // Ensure vesting contract has MINTER_ROLE
        require(token.hasRole(token.MINTER_ROLE(), address(this)), "VestingLEAG: must have minter role");

        _transferOwnership(owner_);
    }

    /// @notice Add a new grant for a beneficiary
    function addGrant(
        address beneficiary,
        uint256 amount,
        uint128 start,
        uint128 cliff,
        uint128 duration
    ) external onlyOwner {
        require(beneficiary != address(0), "VestingLEAG: zero address");
        require(amount > 0, "VestingLEAG: amount zero");
        require(duration > 0, "VestingLEAG: duration zero");
        require(cliff <= duration, "VestingLEAG: cliff exceeds duration");

        grants[beneficiary].push(Grant({
            amount: amount,
            start: start,
            cliff: cliff,
            duration: duration,
            released: 0
        }));

        uint256 grantIndex = grants[beneficiary].length - 1;
        emit GrantAdded(beneficiary, grantIndex, amount, start, cliff, duration);

        // Mint tokens directly to vesting contract
        token.mint(address(this), amount);
    }

    /// @notice Release vested tokens for a specific grant
    function release(uint256 grantIndex) external nonReentrant {
        Grant storage grant = grants[msg.sender][grantIndex];
        require(grant.amount > 0, "VestingLEAG: no grant");

        uint256 vested = _vestedAmount(grant);
        uint256 unreleased = vested - grant.released;
        require(unreleased > 0, "VestingLEAG: no tokens to release");

        grant.released += unreleased;
        token.transfer(msg.sender, unreleased);

        emit TokensReleased(msg.sender, grantIndex, unreleased);
    }

    /// @notice View vested amount for a specific grant
    function vestedAmount(address beneficiary, uint256 grantIndex) external view returns (uint256) {
        Grant storage grant = grants[beneficiary][grantIndex];
        return _vestedAmount(grant);
    }

    /// @notice Internal linear vesting calculation
    function _vestedAmount(Grant memory grant) internal view returns (uint256) {
        uint128 currentTime = uint128(block.timestamp);
        if (currentTime < grant.start + grant.cliff) {
            return 0;
        } else if (currentTime >= grant.start + grant.duration) {
            return grant.amount;
        } else {
            uint256 timeElapsed = currentTime - grant.start;
            return (grant.amount * timeElapsed) / grant.duration;
        }
    }

    /// @notice UUPS upgrade authorization
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        require(newImplementation != address(0), "VestingLEAG: invalid upgrade address");
        emit ContractUpgraded(newImplementation);
    }
}
