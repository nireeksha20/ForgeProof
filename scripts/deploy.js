import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("==================================================");
  console.log("Deploying VeriWorkRegistry to MST Testnet...");
  console.log("==================================================");

  const rpcUrl = process.env.MST_RPC_URL || "https://testnetrpc.mstblockchain.com";
  const chainId = parseInt(process.env.MST_CHAIN_ID || "91562037", 10);
  const privateKey = process.env.MST_PRIVATE_KEY;

  if (!privateKey) {
    console.error("❌ ERROR: MST_PRIVATE_KEY is missing from environment or .env file.");
    console.error("Please configure MST_PRIVATE_KEY in .env before running deployment.");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl, chainId);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log("Deployer Address:", wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log("Deployer Balance:", ethers.formatEther(balance), "tMSTC");

  if (balance === 0n) {
    console.error("❌ ERROR: Wallet balance is 0 tMSTC. Deployer requires testnet funds to pay transaction gas fees.");
    console.error("Please fund wallet address on MST Testnet before running deployment.");
    process.exit(1);
  }

  // Load contract artifact
  const artifactPath = path.resolve("./artifacts/contracts/VeriWorkRegistry.sol/VeriWorkRegistry.json");
  if (!fs.existsSync(artifactPath)) {
    throw new Error("Contract artifact not found. Please run 'npx hardhat compile' first.");
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

  console.log("Sending contract deployment transaction to MST Testnet...");
  const contract = await factory.deploy();
  console.log("Deployment transaction sent. Waiting for block confirmation...");

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  const txHash = contract.deploymentTransaction()?.hash;

  console.log("\n==================================================");
  console.log("✓ VeriWorkRegistry Deployed Successfully to MST Testnet!");
  console.log("--------------------------------------------------");
  console.log("Contract Address:       ", contractAddress);
  console.log("Deployment Tx Hash:     ", txHash);
  console.log("MST Explorer Tx URL:    ", `https://testnet.mstscan.com/tx/${txHash}`);
  console.log("MST Explorer Contract:  ", `https://testnet.mstscan.com/address/${contractAddress}`);
  console.log("--------------------------------------------------");
  console.log("Add this contract address to your .env file:");
  console.log(`MST_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("==================================================\n");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exit(1);
});
