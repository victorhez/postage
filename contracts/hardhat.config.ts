import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";
import { subtask } from "hardhat/config";
import { TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD } from "hardhat/builtin-tasks/task-names";

// Use the pure-JS compiler: native solc binaries get quarantined by Windows Defender on some machines.
subtask(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD, async (args: { solcVersion: string }, _hre, runSuper) => {
  if (args.solcVersion === "0.8.24") {
    return { compilerPath: require.resolve("solc/soljson.js"), isSolcJs: true, version: "0.8.24", longVersion: "0.8.24+commit.e11b9ed9" };
  }
  return runSuper();
});

const accounts = process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: "paris" },
  },
  mocha: { timeout: 180000 },
  networks: {
    arc: {
      url: process.env.ARC_RPC ?? "https://rpc.mainnet.arc.io",
      chainId: 5042,
      accounts,
      // Arc enforces a 20 gwei maxFeePerGas floor
      gasPrice: 25_000_000_000,
    },
  },
};

export default config;
