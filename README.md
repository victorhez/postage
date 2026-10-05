<div align="center">

<img src="web/public/logo.svg" width="84" alt="Postage logo" />

# Postage

**Attention, priced.**

Send a message with a refundable USDC bond. The recipient is paid only if they answer.<br/>
If they don't, every cent comes back to you. Spam gets expensive. Real messages get read.

[**Live app**](__SITE_URL__) · [**Contract on Arcscan**](https://explorer.arc.io/address/__CONTRACT__) · [MIT licensed](LICENSE)

</div>

---

## The problem

Sending a message costs nothing, so everyone sends to everyone. The people worth hearing from (founders, investors, creators, experts, recruiters) are buried under volume, and the only tools they have are filters that block real senders along with spammers, or paywalls that make honest senders pay for nothing.

Nobody has priced the one thing that matters: **a stranger's first message.**

## The idea

Postage turns a message into a **bonded letter**.

1. **Seal.** The sender writes a message. It is encrypted in their browser to the recipient's public key, so only the recipient can ever read it.
2. **Bond.** The sender attaches postage in USDC, at or above the recipient's published rate card. One transaction; the funds sit in the contract.
3. **Settle.**
   - The recipient **replies** and collects the bond.
   - The recipient **declines** and the sender is refunded instantly.
   - The recipient **ignores** it, and the sender reclaims the bond after their chosen deadline (1 to 14 days).

Honest senders lose nothing. Mass senders cannot afford the volume. Recipients get paid for attention they actually spend.

## Why Arc

A 50-cent bond only works if the fee is not 50 cents. Postage depends on properties that are native to Arc:

| Arc property | What Postage does with it |
| --- | --- |
| **USDC is the gas token** | The bond is plain native value. A letter is one transaction with no ERC-20 approval and no swap. |
| **Predictable, sub-cent fees** | Bonds as low as a few cents are economically sensible. |
| **Sub-second finality** | Sending, replying and refunding feel like email, not like waiting on a chain. |

## Architecture

```
 browser (Next.js)                         Arc mainnet (chain 5042)
┌──────────────────────────┐              ┌───────────────────────────┐
│ nacl.box seal / open     │  send(bond)  │  Postage.sol              │
│ key derived from wallet  ├─────────────►│  profiles  (key, price)   │
│ signature (never stored) │  reply()     │  letters   (escrowed USDC)│
│                          │  decline()   │  events    (ciphertext)   │
│ reads state via logs     │◄─────────────┤  no owner · no fee · no   │
└──────────────────────────┘  reclaim()   │  upgrade · no admin keys  │
                                          └───────────────────────────┘
```

- **Contract**: [`contracts/contracts/Postage.sol`](contracts/contracts/Postage.sol). A single ~130-line contract. Bonds are held as native USDC. State changes happen before transfers, reentrancy is guarded, and there is no owner, fee switch or upgrade path.
- **Encryption**: each user's X25519 keypair is derived deterministically from a wallet signature (`personal_sign` of a fixed message). The private key exists only in memory in the browser. The public key is published on-chain with the user's rate card. Letters and replies are `nacl.box` ciphertexts emitted as events; the chain never sees plaintext.
- **Frontend**: Next.js (App Router), Tailwind CSS, viem. No backend and no database: the app reads and writes the contract directly through any injected wallet.

### Contract interface

| Function | Who | Effect |
| --- | --- | --- |
| `setProfile(encKey, minPostage, handle)` | anyone | Publish sealing key and minimum postage |
| `send(to, cipher, ttl)` *payable* | sender | Escrow `msg.value` against a sealed letter |
| `reply(id, cipher)` | recipient | Release the bond to the recipient and post a sealed reply |
| `decline(id)` | recipient | Refund the bond to the sender immediately |
| `reclaim(id)` | sender | Refund the bond after the deadline if unanswered |

## Deployment

| | |
| --- | --- |
| Network | Arc mainnet, chain ID `5042`, RPC `https://rpc.mainnet.arc.io` |
| Contract | [`__CONTRACT__`](https://explorer.arc.io/address/__CONTRACT__) |
| Deploy tx | [`__TX__`](https://explorer.arc.io/tx/__TX__) |
| App | __SITE_URL__ |

## Run it locally

```bash
# contracts
cd contracts
npm install
npm test                      # 5 tests: reply, decline, reclaim, rate card, access control

# web
cd ../web
npm install
cp .env.example .env.local    # set NEXT_PUBLIC_POSTAGE_ADDRESS
npm run dev
```

To deploy your own instance, set `DEPLOYER_PRIVATE_KEY` in `contracts/.env`, fund that address with a little USDC on Arc, and run `npm run deploy` in `contracts/`.

## Security notes

- Funds are only ever released to the letter's recipient (on `reply`) or its sender (on `decline` / `reclaim`); each letter settles exactly once.
- Message contents are public ciphertext on-chain. Metadata (who wrote to whom, when, and the bond size) is public by nature of the chain.
- This is an unaudited prototype built for Arc Microgrants. Use small amounts.

## Roadmap

- Email and social bridges, so a bonded letter can arrive in a normal inbox with a one-click claim.
- Recipient-side tiers (allow-lists, free passes for people you know).
- Optional group and team postboxes with shared rate cards.
- Sender reputation that lets repeat honest senders attach smaller bonds.

## License

[MIT](LICENSE)
