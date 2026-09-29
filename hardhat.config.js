import "@nomicfoundation/hardhat-ethers";
import dotenv from "dotenv";

dotenv.config();

const MST_RPC_URL = process.env.MST_RPC_URL || "https://testnetrpc.mstblockchain.com";
const MST_CHAIN_ID = parseInt(process.env.MST_CHAIN_ID || "91562037", 10);
const MST_PRIVATE_KEY = process.env.MST_PRIVATE_KEY ? [process.env.MST_PRIVATE_KEY] : [];

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    mstTestnet: {
      type: "http",
      url: MST_RPC_URL,
      chainId: MST_CHAIN_ID,
      accounts: MST_PRIVATE_KEY,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
