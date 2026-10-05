import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const USDC = (n: string) => ethers.parseEther(n);
const key = ethers.id("k");

async function setup() {
  const [alice, bob, eve] = await ethers.getSigners();
  const c = await (await ethers.getContractFactory("Postage")).deploy();
  await c.connect(alice).setProfile(key, USDC("0.5"), "alice");
  await c.connect(bob).setProfile(key, USDC("1"), "bob");
  return { c, alice, bob, eve };
}

describe("Postage", () => {
  it("pays the recipient only when they reply", async () => {
    const { c, alice, bob } = await setup();
    await c.connect(alice).send(bob.address, "0x1234", 86400, { value: USDC("2") });
    const before = await ethers.provider.getBalance(bob.address);
    const tx = await c.connect(bob).reply(1, "0xabcd");
    const r = await tx.wait();
    const after = await ethers.provider.getBalance(bob.address);
    expect(after - before + r!.gasUsed * r!.gasPrice).to.equal(USDC("2"));
    expect((await c.letters(1)).status).to.equal(2);
  });

  it("refunds the sender immediately on decline", async () => {
    const { c, alice, bob } = await setup();
    await c.connect(alice).send(bob.address, "0x12", 86400, { value: USDC("1") });
    await expect(c.connect(bob).decline(1)).to.changeEtherBalances([alice, c], [USDC("1"), -USDC("1")]);
  });

  it("lets the sender reclaim only after expiry", async () => {
    const { c, alice, bob } = await setup();
    await c.connect(alice).send(bob.address, "0x12", 3600, { value: USDC("1") });
    await expect(c.connect(alice).reclaim(1)).to.be.revertedWithCustomError(c, "NotExpired");
    await time.increase(3601);
    await expect(c.connect(bob).reply(1, "0x12")).to.be.revertedWithCustomError(c, "Expired");
    await expect(c.connect(alice).reclaim(1)).to.changeEtherBalances([alice], [USDC("1")]);
    await expect(c.connect(alice).reclaim(1)).to.be.revertedWithCustomError(c, "NotPending");
  });

  it("enforces the recipient's rate card", async () => {
    const { c, alice, bob, eve } = await setup();
    await expect(c.connect(alice).send(bob.address, "0x12", 3600, { value: USDC("0.9") })).to.be.revertedWithCustomError(c, "BondTooSmall");
    await expect(c.connect(alice).send(eve.address, "0x12", 3600, { value: USDC("1") })).to.be.revertedWithCustomError(c, "NoProfile");
    await expect(c.connect(alice).send(bob.address, "0x12", 60, { value: USDC("1") })).to.be.revertedWithCustomError(c, "BadTtl");
  });

  it("blocks strangers from replying, declining or reclaiming", async () => {
    const { c, alice, bob, eve } = await setup();
    await c.connect(alice).send(bob.address, "0x12", 3600, { value: USDC("1") });
    await expect(c.connect(eve).reply(1, "0x12")).to.be.revertedWithCustomError(c, "NotRecipient");
    await expect(c.connect(eve).decline(1)).to.be.revertedWithCustomError(c, "NotRecipient");
    await time.increase(3601);
    await expect(c.connect(eve).reclaim(1)).to.be.revertedWithCustomError(c, "NotSender");
  });
});
