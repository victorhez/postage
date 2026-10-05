import { createPublicClient, http, type Address, type Hex } from "viem";
import { arc, POSTAGE_ADDRESS, DEPLOY_BLOCK } from "./chain";
import { postageAbi } from "./abi";

export const publicClient = createPublicClient({ chain: arc, transport: http() });

export type Status = "pending" | "answered" | "declined" | "reclaimed";
const STATUS: Status[] = ["pending", "pending", "answered", "declined", "reclaimed"];

export type Letter = {
  id: bigint;
  from: Address;
  to: Address;
  amount: bigint;
  expiry: number;
  status: Status;
  cipher: Hex;
  replyCipher?: Hex;
  block: bigint;
};

export type Profile = { encKey: Hex; minPostage: bigint; exists: boolean; handle: string };

export async function getProfile(addr: Address): Promise<Profile> {
  const [encKey, minPostage, exists, handle] = await publicClient.readContract({
    address: POSTAGE_ADDRESS,
    abi: postageAbi,
    functionName: "profiles",
    args: [addr],
  });
  return { encKey, minPostage, exists, handle };
}

/** Run a getLogs query over the whole range, falling back to chunks if the RPC limits ranges. */
async function logsChunked(fn: (from: bigint, to: bigint) => Promise<any[]>): Promise<any[]> {
  const latest = await publicClient.getBlockNumber();
  try {
    return await fn(DEPLOY_BLOCK, latest);
  } catch {
    const out: any[] = [];
    const step = 20_000n;
    for (let f = DEPLOY_BLOCK; f <= latest; f += step) {
      out.push(...(await fn(f, f + step - 1n > latest ? latest : f + step - 1n)));
    }
    return out;
  }
}

const ev = (name: string) => postageAbi.find((x) => x.type === "event" && x.name === name) as any;

/** All letters sent to or from `addr`, with current on-chain status and reply ciphertext. */
export async function loadLetters(addr: Address): Promise<Letter[]> {
  const sentLogs = (args: { from?: Address; to?: Address }) =>
    logsChunked((fromBlock, toBlock) =>
      publicClient.getLogs({ address: POSTAGE_ADDRESS, event: ev("Sent"), args, fromBlock, toBlock }),
    );
  const [a, b] = await Promise.all([sentLogs({ from: addr }), sentLogs({ to: addr })]);
  const seen = new Map<string, any>();
  [...a, ...b].forEach((l) => seen.set(l.args.id.toString(), l));
  const logs = [...seen.values()];
  if (!logs.length) return [];

  const replies = await logsChunked((fromBlock, toBlock) =>
    publicClient.getLogs({ address: POSTAGE_ADDRESS, event: ev("Replied"), args: { from: addr }, fromBlock, toBlock }),
  ).catch(() => [] as any[]);
  const replyBy = new Map<string, Hex>();
  replies.forEach((r) => replyBy.set(r.args.id.toString(), r.args.cipher));

  const states = await Promise.all(
    logs.map((l) =>
      publicClient.readContract({ address: POSTAGE_ADDRESS, abi: postageAbi, functionName: "letters", args: [l.args.id] }),
    ),
  );
  return logs
    .map((l, i) => ({
      id: l.args.id as bigint,
      from: l.args.from as Address,
      to: l.args.to as Address,
      amount: l.args.amount as bigint,
      expiry: Number(l.args.expiry),
      status: STATUS[states[i][4]],
      cipher: l.args.cipher as Hex,
      replyCipher: replyBy.get(l.args.id.toString()),
      block: l.blockNumber as bigint,
    }))
    .sort((x, y) => (y.id > x.id ? 1 : -1));
}

export async function loadLedger() {
  const read = (functionName: "totalBonded" | "totalEarned" | "totalRefunded" | "nextId") =>
    publicClient.readContract({ address: POSTAGE_ADDRESS, abi: postageAbi, functionName });
  const [bonded, earned, refunded, next] = await Promise.all([
    read("totalBonded"),
    read("totalEarned"),
    read("totalRefunded"),
    read("nextId"),
  ]);
  return { bonded, earned, refunded, letters: next - 1n };
}
