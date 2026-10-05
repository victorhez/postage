// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Postage
/// @notice Attention you can price. A sender attaches a refundable USDC bond to an
///         encrypted message. The recipient is paid only if they answer; if they
///         decline or the deadline passes, the sender gets every cent back.
/// @dev On Arc, USDC is the native gas token, so a bond is plain `msg.value`
///      (18 decimals) and a letter is a single transaction, with no approvals.
contract Postage {
    enum Status { None, Pending, Answered, Declined, Reclaimed }

    struct Profile {
        bytes32 encKey;     // X25519 public key letters to this address are sealed to
        uint128 minPostage; // minimum bond (18-decimal native USDC) accepted
        bool exists;
        string handle;      // optional display name
    }

    struct Letter {
        address from;
        address to;
        uint128 amount;
        uint64 expiry;
        Status status;
    }

    uint64 public constant MIN_TTL = 1 hours;
    uint64 public constant MAX_TTL = 30 days;
    uint256 public constant MAX_CIPHER = 4096;

    mapping(address => Profile) public profiles;
    mapping(uint256 => Letter) public letters;
    uint256 public nextId = 1;

    /// lifetime totals for the public ledger
    uint256 public totalBonded;
    uint256 public totalEarned;
    uint256 public totalRefunded;

    event ProfileSet(address indexed owner, bytes32 encKey, uint128 minPostage, string handle);
    event Sent(uint256 indexed id, address indexed from, address indexed to, uint128 amount, uint64 expiry, bytes cipher);
    event Replied(uint256 indexed id, address indexed from, address indexed to, uint128 amount, bytes cipher);
    event Declined(uint256 indexed id, address indexed from, address indexed to, uint128 amount);
    event Reclaimed(uint256 indexed id, address indexed from, address indexed to, uint128 amount);

    error NoProfile();
    error BondTooSmall(uint128 required);
    error BadTtl();
    error BadCipher();
    error NotRecipient();
    error NotSender();
    error NotPending();
    error Expired();
    error NotExpired();
    error TransferFailed();

    uint256 private _lock = 1;

    modifier nonReentrant() {
        require(_lock == 1, "reentrancy");
        _lock = 2;
        _;
        _lock = 1;
    }

    /// @notice Publish (or update) your postbox: your sealing key and your price.
    function setProfile(bytes32 encKey, uint128 minPostage, string calldata handle) external {
        require(encKey != bytes32(0), "key");
        require(bytes(handle).length <= 32, "handle");
        profiles[msg.sender] = Profile(encKey, minPostage, true, handle);
        emit ProfileSet(msg.sender, encKey, minPostage, handle);
    }

    /// @notice Send a sealed message with a refundable bond (msg.value).
    function send(address to, bytes calldata cipher, uint64 ttl) external payable returns (uint256 id) {
        Profile storage p = profiles[to];
        if (!p.exists) revert NoProfile();
        if (msg.value == 0 || msg.value < p.minPostage || msg.value > type(uint128).max) {
            revert BondTooSmall(p.minPostage);
        }
        if (ttl < MIN_TTL || ttl > MAX_TTL) revert BadTtl();
        if (cipher.length == 0 || cipher.length > MAX_CIPHER) revert BadCipher();

        id = nextId++;
        uint64 expiry = uint64(block.timestamp) + ttl;
        letters[id] = Letter(msg.sender, to, uint128(msg.value), expiry, Status.Pending);
        totalBonded += msg.value;
        emit Sent(id, msg.sender, to, uint128(msg.value), expiry, cipher);
    }

    /// @notice Answer a letter and take the bond.
    function reply(uint256 id, bytes calldata cipher) external nonReentrant {
        Letter storage l = letters[id];
        if (l.status != Status.Pending) revert NotPending();
        if (msg.sender != l.to) revert NotRecipient();
        if (block.timestamp > l.expiry) revert Expired();
        if (cipher.length == 0 || cipher.length > MAX_CIPHER) revert BadCipher();

        l.status = Status.Answered;
        totalEarned += l.amount;
        emit Replied(id, l.from, l.to, l.amount, cipher);
        _pay(l.to, l.amount);
    }

    /// @notice Turn a letter down. The sender is refunded in full, immediately.
    function decline(uint256 id) external nonReentrant {
        Letter storage l = letters[id];
        if (l.status != Status.Pending) revert NotPending();
        if (msg.sender != l.to) revert NotRecipient();

        l.status = Status.Declined;
        totalRefunded += l.amount;
        emit Declined(id, l.from, l.to, l.amount);
        _pay(l.from, l.amount);
    }

    /// @notice Take your bond back once the deadline has passed unanswered.
    function reclaim(uint256 id) external nonReentrant {
        Letter storage l = letters[id];
        if (l.status != Status.Pending) revert NotPending();
        if (msg.sender != l.from) revert NotSender();
        if (block.timestamp <= l.expiry) revert NotExpired();

        l.status = Status.Reclaimed;
        totalRefunded += l.amount;
        emit Reclaimed(id, l.from, l.to, l.amount);
        _pay(l.from, l.amount);
    }

    function _pay(address to, uint256 amount) private {
        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
