import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

async function testConnection() {
  console.log("=== TESTING MST TESTNET RPC CONNECTION ===");
  const rpcUrl = process.env.MST_RPC_URL || "https://testnetrpc.mstblockchain.com";
  const chainIdExpected = parseInt(process.env.MST_CHAIN_ID || "91562037", 10);

  console.log("RPC URL:", rpcUrl);
  console.log("Expected Chain ID:", chainIdExpected);

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl, chainIdExpected);
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();

    console.log("\n✓ RPC Connection Successful!");
    console.log("Chain ID returned by RPC:", network.chainId.toString());
    console.log("Latest Block Number:", blockNumber);

    if (process.env.MST_PRIVATE_KEY) {
      const wallet = new ethers.Wallet(process.env.MST_PRIVATE_KEY, provider);
      console.log("\nWallet Address:", wallet.address);
      const balance = await provider.getBalance(wallet.address);
      console.log("Wallet Balance:", ethers.formatEther(balance), "tMSTC");
    } else {
      console.log("\nℹ️ MST_PRIVATE_KEY is not configured in .env");
    }

    if (process.env.MST_CONTRACT_ADDRESS) {
      console.log("\nContract Address:", process.env.MST_CONTRACT_ADDRESS);
      const code = await provider.getCode(process.env.MST_CONTRACT_ADDRESS);
      console.log("Contract Bytecode Length:", code.length);
    } else {
      console.log("\nℹ️ MST_CONTRACT_ADDRESS is not configured in .env");
    }
  } catch (err) {
    console.error("\n❌ RPC Connection Failed:", (err as Error).message);
  }
}

testConnection();
