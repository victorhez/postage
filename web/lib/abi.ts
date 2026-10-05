import { parseAbi } from "viem";

export const postageAbi = parseAbi([
  "function setProfile(bytes32 encKey, uint128 minPostage, string handle)",
  "function send(address to, bytes cipher, uint64 ttl) payable returns (uint256 id)",
  "function reply(uint256 id, bytes cipher)",
  "function decline(uint256 id)",
  "function reclaim(uint256 id)",
  "function profiles(address) view returns (bytes32 encKey, uint128 minPostage, bool exists, string handle)",
  "function letters(uint256) view returns (address from, address to, uint128 amount, uint64 expiry, uint8 status)",
  "function totalBonded() view returns (uint256)",
  "function totalEarned() view returns (uint256)",
  "function totalRefunded() view returns (uint256)",
  "function nextId() view returns (uint256)",
  "event ProfileSet(address indexed owner, bytes32 encKey, uint128 minPostage, string handle)",
  "event Sent(uint256 indexed id, address indexed from, address indexed to, uint128 amount, uint64 expiry, bytes cipher)",
  "event Replied(uint256 indexed id, address indexed from, address indexed to, uint128 amount, bytes cipher)",
  "event Declined(uint256 indexed id, address indexed from, address indexed to, uint128 amount)",
  "event Reclaimed(uint256 indexed id, address indexed from, address indexed to, uint128 amount)",
]);
