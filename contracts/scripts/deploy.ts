import { ethers, network } from "hardhat";
import { writeFileSync } from "fs";
import { join } from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const bal = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer ${deployer.address} balance ${ethers.formatEther(bal)} USDC`);
  const Postage = await ethers.getContractFactory("Postage");
  const c = await Postage.deploy();
  await c.waitForDeployment();
  const address = await c.getAddress();
  const tx = c.deploymentTransaction();
  console.log(`Postage deployed to ${address} on ${network.name} (tx ${tx?.hash})`);
  writeFileSync(
    join(__dirname, "..", "deployment.json"),
    JSON.stringify({ network: network.name, chainId: Number((await ethers.provider.getNetwork()).chainId), address, tx: tx?.hash, deployer: deployer.address }, null, 2),
  );
}
main().catch((e) => { console.error(e); process.exit(1); });
