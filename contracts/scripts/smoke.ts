// End-to-end check on the live deployment: open two postboxes, send a bonded letter, reply to it.
import { ethers } from "hardhat";
import nacl from "../../web/node_modules/tweetnacl";
import { readFileSync } from "fs";

const { address } = JSON.parse(readFileSync(__dirname + "/../deployment.json", "utf8"));
const hex = (u: Uint8Array) => "0x" + Buffer.from(u).toString("hex");

function seal(obj: object, pub: string) {
  const eph = nacl.box.keyPair(), nonce = nacl.randomBytes(24);
  const box = nacl.box(Buffer.from(JSON.stringify(obj)), nonce, Buffer.from(pub.slice(2), "hex"), eph.secretKey);
  return hex(Buffer.concat([eph.publicKey, nonce, box]));
}

async function main() {
  const [a] = await ethers.getSigners();
  const b = ethers.Wallet.createRandom().connect(ethers.provider);
  const c = await ethers.getContractAt("Postage", address, a);
  const gasPrice = 25_000_000_000n;
  await (await a.sendTransaction({ to: b.address, value: ethers.parseEther("0.3"), gasPrice })).wait();
  const ka = nacl.box.keyPair(), kb = nacl.box.keyPair();
  await (await c.setProfile(hex(ka.publicKey), ethers.parseEther("0.1"), "Postage", { gasPrice })).wait();
  const cb = c.connect(b) as typeof c;
  await (await cb.setProfile(hex(kb.publicKey), ethers.parseEther("0.1"), "Demo sender", { gasPrice })).wait();
  const t1 = await cb.send(a.address, seal({ subject: "Hello from the first letter", body: "This bonded letter was sent on Arc mainnet." }, hex(ka.publicKey)), 86400, { value: ethers.parseEther("0.1"), gasPrice });
  await t1.wait();
  const t2 = await c.reply(1, seal({ subject: "Re: Hello", body: "Received. The bond is mine." }, hex(kb.publicKey)), { gasPrice });
  await t2.wait();
  console.log("letter", t1.hash, "reply", t2.hash);
  console.log("ledger", (await c.totalBonded()).toString(), (await c.totalEarned()).toString());
  console.log("deployer left", ethers.formatEther(await ethers.provider.getBalance(a.address)));
}
main().catch((e) => { console.error(e); process.exit(1); });
