// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20SnapshotUpgradeable.sol";

/// @title Lion-Eagle Token (LEAG) - Lion-Eagle Standard Upgradeable ERC20
/// @notice Fully upgradeable ERC20 with snapshots, permit, role-based mint/burn, optimized for gas
contract LEAG is
    ERC20Upgradeable,
    ERC20PermitUpgradeable,
    OwnableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    ERC20SnapshotUpgradeable
{
    /// @notice Initial token supply minted to deployer
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 1e18;

    /// @notice Roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    /// @notice Events
    event TokensMinted(address indexed to, uint256 amount, address indexed by);
    event TokensBurned(address indexed from, uint256 amount, address indexed by);
    event ContractUpgraded(address indexed newImplementation);

    /// @notice Initialize contract
    function initialize() public initializer {
        __ERC20_init("Lion-Eagle Token", "LEAG");
        __ERC20Permit_init("Lion-Eagle Token");
        __Ownable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __ERC20Snapshot_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);

        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /// @notice Mint new tokens to an address
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(to != address(0), "LEAG: mint to zero address");
        _mint(to, amount);
        emit TokensMinted(to, amount, msg.sender);
    }

    /// @notice Burn tokens from an address
    function burn(address from, uint256 amount) external onlyRole(BURNER_ROLE) {
        require(from != address(0), "LEAG: burn from zero address");
        _burn(from, amount);
        emit TokensBurned(from, amount, msg.sender);
    }

    /// @notice Self-burn tokens
    function selfBurn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount, msg.sender);
    }

    /// @notice Take a snapshot
    function snapshot() external onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256) {
        return _snapshot();
    }

    /// @dev Override for multiple inheritance
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20Upgradeable, ERC20SnapshotUpgradeable) {
        super._beforeTokenTransfer(from, to, amount);
    }

    /// @dev Support interface for AccessControl
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /// @notice Authorize upgrades (UUPS)
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {
        require(newImplementation != address(0), "LEAG: invalid upgrade address");
        emit ContractUpgraded(newImplementation);
    }
}
