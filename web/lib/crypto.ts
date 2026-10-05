import nacl from "tweetnacl";
import { bytesToHex, hexToBytes, sha256, type Hex } from "viem";

const KEY_MESSAGE =
  "Postage postbox key\n\nSign to unlock your private postbox. This does not cost anything and never leaves your device.";

export const keyMessage = KEY_MESSAGE;

/** Derive a deterministic X25519 keypair from a wallet signature. */
export function keypairFromSignature(sig: Hex) {
  const seed = hexToBytes(sha256(sig));
  return nacl.box.keyPair.fromSecretKey(seed);
}

const enc = new TextEncoder();
const dec = new TextDecoder();

export type Message = { subject: string; body: string };

/** Seal a message to a recipient's public key. Layout: ephPub(32) | nonce(24) | box. */
export function seal(msg: Message, recipientPub: Hex): Hex {
  const eph = nacl.box.keyPair();
  const nonce = nacl.randomBytes(24);
  const box = nacl.box(enc.encode(JSON.stringify(msg)), nonce, hexToBytes(recipientPub), eph.secretKey);
  const out = new Uint8Array(32 + 24 + box.length);
  out.set(eph.publicKey, 0);
  out.set(nonce, 32);
  out.set(box, 56);
  return bytesToHex(out);
}

export function open(cipher: Hex, secretKey: Uint8Array): Message | null {
  try {
    const b = hexToBytes(cipher);
    const plain = nacl.box.open(b.slice(56), b.slice(32, 56), b.slice(0, 32), secretKey);
    if (!plain) return null;
    const m = JSON.parse(dec.decode(plain));
    return { subject: String(m.subject ?? ""), body: String(m.body ?? "") };
  } catch {
    return null;
  }
}

export const toHexKey = (pub: Uint8Array) => bytesToHex(pub);
