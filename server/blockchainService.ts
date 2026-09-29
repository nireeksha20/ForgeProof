import "dotenv/config";
import { ethers } from "ethers";
import {
  BlockchainCommitment,
  VerificationVerdict,
} from "../src/types/veriwork";

export interface ChainTransaction {
  txHash: string;
  blockNumber: number;
  timestamp: string;
  from: string;
  to: string;
  method: string;
  params: Record<string, unknown>;
  status: "SUCCESS" | "REVERTED";
  gasUsed: number;
  blockHash?: string;
  explorerUrl?: string;
}

export interface ChainBlock {
  blockNumber: number;
  blockHash: string;
  timestamp: string;
  transactionsCount: number;
}

export interface BlockchainStatus {
  connected: boolean;
  network: string;
  chainId: string;
  contractAddress: string;
  walletAddress: string;
  walletBalance: string;
  latestBlock: number;
  statusMessage: string;
  explorerBaseUrl: string;
}

const VERIWORK_REGISTRY_ABI = [
  "function createTask(string memory _taskId, string memory _assetId) external",
  "function assignTask(string memory _taskId, string memory _technicianId) external",
  "function startTask(string memory _taskId) external",
  "function submitEvidenceCommitment(string memory _taskId, string memory _packageId, bytes32 _evidenceHash) external",
  "function recordVerification(string memory _taskId, bytes32 _evidenceHash, uint8 _verdict, uint8 _integrityScore, string memory _engineVersion) external",
  "function challengeVerification(string memory _taskId, string memory _reason) external",
  "function resolveChallenge(string memory _taskId, string memory _resolutionNotes) external",
  "function closeTask(string memory _taskId) external",
  "function getTask(string memory _taskId) external view returns (tuple(string taskId, string assetId, string technicianId, uint8 state, bytes32 evidenceHash, uint8 verdict, uint256 createdAt, uint256 committedAt, uint256 verifiedAt, uint256 closedAt, bool exists))",
  "function getCommitment(string memory _taskId) external view returns (tuple(string taskId, string packageId, bytes32 evidenceHash, uint256 timestamp, address committedBy, string technicianId))",
  "function getVerification(string memory _taskId) external view returns (tuple(string taskId, bytes32 evidenceHash, uint8 verdict, uint8 integrityScore, uint256 timestamp, address verifiedBy, string verificationEngineVersion))",
  "function totalCommitments() external view returns (uint256)",
  "function totalVerifications() external view returns (uint256)",
  "function totalChallenges() external view returns (uint256)",
  "event TaskCreated(string indexed taskId, string assetId, uint256 timestamp, address indexed creator)",
  "event TaskAssigned(string indexed taskId, string technicianId, uint256 timestamp, address indexed assigner)",
  "event TaskStarted(string indexed taskId, uint256 timestamp, address indexed technician)",
  "event EvidenceCommitted(string indexed taskId, string packageId, bytes32 indexed evidenceHash, uint256 timestamp, address indexed submitter)",
  "event VerificationRecorded(string indexed taskId, bytes32 indexed evidenceHash, uint8 verdict, uint8 integrityScore, uint256 timestamp)",
  "event TaskClosed(string indexed taskId, uint256 timestamp, address indexed closer)",
  "event ChallengeRaised(string indexed taskId, address indexed challenger, string reason, uint256 timestamp)",
  "event ChallengeResolved(string indexed taskId, address indexed resolver, string resolutionNotes, uint256 timestamp)",
];

const VERIWORK_INTERFACE = new ethers.Interface(VERIWORK_REGISTRY_ABI);
const HISTORY_BLOCK_WINDOW = 10000;

class BlockchainService {
  private rpcUrl: string;
  private chainId: string;
  private contractAddress: string;
  private privateKey: string;
  private explorerBaseUrl: string = "https://testnet.mstscan.com";

  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private contract: ethers.Contract | null = null;

  // Recent transactions and commitments cache for audit UI
  private transactions: Map<string, ChainTransaction> = new Map();
  private commitments: Map<string, BlockchainCommitment> = new Map();

  constructor() {
    this.rpcUrl =
      process.env.MST_RPC_URL || "https://testnetrpc.mstblockchain.com";
    this.chainId = process.env.MST_CHAIN_ID || "91562037";
    this.contractAddress = process.env.MST_CONTRACT_ADDRESS || "";
    this.privateKey = process.env.MST_PRIVATE_KEY || "";

    this.initializeEthers();
  }

  private initializeEthers() {
    if (!this.rpcUrl) return;

    try {
      this.provider = new ethers.JsonRpcProvider(
        this.rpcUrl,
        parseInt(this.chainId, 10),
      );

      if (this.privateKey) {
        this.wallet = new ethers.Wallet(this.privateKey, this.provider);
        if (this.contractAddress && ethers.isAddress(this.contractAddress)) {
          this.contract = new ethers.Contract(
            this.contractAddress,
            VERIWORK_REGISTRY_ABI,
            this.wallet,
          );
        }
      }
    } catch (err) {
      console.warn(
        "[VERIWORK BLOCKCHAIN] Ethers initialization warning:",
        (err as Error).message,
      );
    }
  }

  public async getBlockchainStatus(): Promise<BlockchainStatus> {
    if (!this.rpcUrl || !this.privateKey) {
      return {
        connected: false,
        network: "MST Testnet",
        chainId: this.chainId,
        contractAddress: this.contractAddress,
        walletAddress: "",
        walletBalance: "0 tMSTC",
        latestBlock: 0,
        statusMessage: "MST NOT CONFIGURED",
        explorerBaseUrl: this.explorerBaseUrl,
      };
    }

    if (!this.contractAddress || !ethers.isAddress(this.contractAddress)) {
      return {
        connected: false,
        network: "MST Testnet",
        chainId: this.chainId,
        contractAddress: this.contractAddress,
        walletAddress: this.wallet ? this.wallet.address : "",
        walletBalance: "0 tMSTC",
        latestBlock: 0,
        statusMessage: "INVALID CONTRACT CONFIGURATION",
        explorerBaseUrl: this.explorerBaseUrl,
      };
    }

    try {
      if (!this.provider || !this.wallet) {
        this.initializeEthers();
      }

      if (!this.provider || !this.wallet) {
        return {
          connected: false,
          network: "MST Testnet",
          chainId: this.chainId,
          contractAddress: this.contractAddress,
          walletAddress: "",
          walletBalance: "0 tMSTC",
          latestBlock: 0,
          statusMessage: "MST CONNECTION FAILED",
          explorerBaseUrl: this.explorerBaseUrl,
        };
      }

      const latestBlock = await this.provider.getBlockNumber();
      const balance = await this.provider.getBalance(this.wallet.address);
      const balanceFormatted = ethers.formatEther(balance) + " tMSTC";

      if (balance === 0n) {
        return {
          connected: false,
          network: "MST Testnet",
          chainId: this.chainId,
          contractAddress: this.contractAddress,
          walletAddress: this.wallet.address,
          walletBalance: balanceFormatted,
          latestBlock,
          statusMessage: "INSUFFICIENT MST TESTNET BALANCE",
          explorerBaseUrl: this.explorerBaseUrl,
        };
      }

      return {
        connected: true,
        network: "MST Testnet",
        chainId: this.chainId,
        contractAddress: this.contractAddress,
        walletAddress: this.wallet.address,
        walletBalance: balanceFormatted,
        latestBlock,
        statusMessage: "LIVE MST TESTNET",
        explorerBaseUrl: this.explorerBaseUrl,
      };
    } catch (err) {
      console.error(
        "[VERIWORK BLOCKCHAIN] Status RPC error:",
        (err as Error).message,
      );
      return {
        connected: false,
        network: "MST Testnet",
        chainId: this.chainId,
        contractAddress: this.contractAddress,
        walletAddress: this.wallet ? this.wallet.address : "",
        walletBalance: "0 tMSTC",
        latestBlock: 0,
        statusMessage: "MST CONNECTION FAILED",
        explorerBaseUrl: this.explorerBaseUrl,
      };
    }
  }

  public async getNetworkInfo() {
    const status = await this.getBlockchainStatus();

    let recentTransactions: ChainTransaction[] = [];
    try {
      recentTransactions = await this.getRecentTransactions(50);
    } catch (error) {
      console.warn(
        "[VERIWORK BLOCKCHAIN] Could not load historical transactions:",
        (error as Error).message,
      );
    }

    return {
      network: status.network,
      chainId: status.chainId,
      contractAddress: status.contractAddress,
      isLiveRpc: status.connected,
      statusMessage: status.statusMessage,
      walletAddress: status.walletAddress,
      walletBalance: status.walletBalance,
      currentBlockNumber: status.latestBlock,
      totalTransactions: recentTransactions.length,
      totalCommitments: this.commitments.size,
      rpcEndpoint: this.rpcUrl,
      explorerBaseUrl: this.explorerBaseUrl,
    };
  }

  private async checkReadyContract(): Promise<ethers.Contract> {
    const status = await this.getBlockchainStatus();
    if (!status.connected) {
      throw new Error(
        `MST Blockchain Error: ${status.statusMessage}. On-chain transaction halted.`,
      );
    }
    if (!this.contract) {
      this.initializeEthers();
    }
    if (!this.contract) {
      throw new Error(
        "MST Blockchain Error: Contract instance not initialized.",
      );
    }
    return this.contract;
  }

  public async getTaskOnChain(taskId: string): Promise<{
    taskId: string;
    assetId: string;
    technicianId: string;
    state: number;
    evidenceHash: string;
    verdict: number;
    createdAt: number;
    committedAt: number;
    verifiedAt: number;
    closedAt: number;
    exists: boolean;
  } | null> {
    const contract = await this.checkReadyContract();

    try {
      const task = await contract.getTask(taskId);

      return {
        taskId: String(task.taskId),
        assetId: String(task.assetId),
        technicianId: String(task.technicianId),
        state: Number(task.state),
        evidenceHash: String(task.evidenceHash),
        verdict: Number(task.verdict),
        createdAt: Number(task.createdAt),
        committedAt: Number(task.committedAt),
        verifiedAt: Number(task.verifiedAt),
        closedAt: Number(task.closedAt),
        exists: Boolean(task.exists),
      };
    } catch (error) {
      const err = error as {
        code?: string;
        reason?: string;
        shortMessage?: string;
      };

      const message =
        `${err.reason || ""} ${err.shortMessage || ""}`.toLowerCase();

      if (
        err.code === "CALL_EXCEPTION" &&
        message.includes("task does not exist")
      ) {
        return null;
      }

      throw error;
    }
  }

  private formatBytes32Hash(hash: string): string {
    if (!hash || typeof hash !== "string") {
      throw new Error("Invalid SHA-256 hash: hash must be a non-empty string.");
    }
    let clean = hash.trim();
    if (clean.startsWith("0x") || clean.startsWith("0X")) {
      clean = clean.slice(2);
    }
    if (!/^[0-9a-fA-F]{64}$/.test(clean)) {
      throw new Error(
        `Invalid SHA-256 hash digest "${hash}". Expected exactly 64 hexadecimal characters (optional 0x prefix).`,
      );
    }
    return ethers.hexlify(ethers.getBytes("0x" + clean));
  }

  public async createTaskOnChain(
    taskId: string,
    assetId: string,
    creatorAddress?: string,
  ): Promise<ChainTransaction> {
    const contract = await this.checkReadyContract();
    const txResponse = await contract.createTask(taskId, assetId);
    const receipt = await txResponse.wait();

    const tx: ChainTransaction = {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      timestamp: new Date().toISOString(),
      from: creatorAddress || this.wallet?.address || receipt.from,
      to: this.contractAddress,
      method: "createTask",
      params: { taskId, assetId },
      status: receipt.status === 1 ? "SUCCESS" : "REVERTED",
      gasUsed: Number(receipt.gasUsed),
      blockHash: receipt.blockHash,
      explorerUrl: `${this.explorerBaseUrl}/tx/${receipt.hash}`,
    };

    this.transactions.set(receipt.hash, tx);
    return tx;
  }

  public async assignTaskOnChain(
    taskId: string,
    technicianId: string,
  ): Promise<ChainTransaction> {
    const contract = await this.checkReadyContract();
    const txResponse = await contract.assignTask(taskId, technicianId);
    const receipt = await txResponse.wait();

    const tx: ChainTransaction = {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      timestamp: new Date().toISOString(),
      from: this.wallet?.address || receipt.from,
      to: this.contractAddress,
      method: "assignTask",
      params: { taskId, technicianId },
      status: receipt.status === 1 ? "SUCCESS" : "REVERTED",
      gasUsed: Number(receipt.gasUsed),
      blockHash: receipt.blockHash,
      explorerUrl: `${this.explorerBaseUrl}/tx/${receipt.hash}`,
    };

    this.transactions.set(receipt.hash, tx);
    return tx;
  }

  public async startTaskOnChain(taskId: string): Promise<ChainTransaction> {
    const contract = await this.checkReadyContract();
    const txResponse = await contract.startTask(taskId);
    const receipt = await txResponse.wait();

    const tx: ChainTransaction = {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      timestamp: new Date().toISOString(),
      from: this.wallet?.address || receipt.from,
      to: this.contractAddress,
      method: "startTask",
      params: { taskId },
      status: receipt.status === 1 ? "SUCCESS" : "REVERTED",
      gasUsed: Number(receipt.gasUsed),
      blockHash: receipt.blockHash,
      explorerUrl: `${this.explorerBaseUrl}/tx/${receipt.hash}`,
    };

    this.transactions.set(receipt.hash, tx);
    return tx;
  }

  public async commitEvidenceOnChain(
    taskId: string,
    packageId: string,
    evidenceHash: string,
    submitterAddress?: string,
  ): Promise<BlockchainCommitment> {
    const contract = await this.checkReadyContract();
    const bytes32Hash = this.formatBytes32Hash(evidenceHash);

    const txResponse = await contract.submitEvidenceCommitment(
      taskId,
      packageId,
      bytes32Hash,
    );
    const receipt = await txResponse.wait();

    const commitment: BlockchainCommitment = {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      blockTimestamp: new Date().toISOString(),
      gasUsed: Number(receipt.gasUsed),
      network: "MST Testnet (Chain ID: " + this.chainId + ")",
      contractAddress: this.contractAddress,
      evidenceHash: evidenceHash,
      verdictRecorded: "UNVERIFIED",
      committedBy: submitterAddress || this.wallet?.address || receipt.from,
      state: receipt.status === 1 ? "CONFIRMED" : "TAMPER_DETECTED",
      explorerUrl: `${this.explorerBaseUrl}/tx/${receipt.hash}`,
    };

    this.commitments.set(taskId, commitment);

    const tx: ChainTransaction = {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      timestamp: commitment.blockTimestamp,
      from: commitment.committedBy,
      to: this.contractAddress,
      method: "submitEvidenceCommitment",
      params: { taskId, packageId, evidenceHash: bytes32Hash },
      status: receipt.status === 1 ? "SUCCESS" : "REVERTED",
      gasUsed: Number(receipt.gasUsed),
      blockHash: receipt.blockHash,
      explorerUrl: commitment.explorerUrl,
    };
    this.transactions.set(receipt.hash, tx);

    return commitment;
  }

  public async recordVerificationOnChain(
    taskId: string,
    evidenceHash: string,
    verdict: VerificationVerdict,
    integrityScore: number,
  ): Promise<ChainTransaction> {
    const contract = await this.checkReadyContract();
    const bytes32Hash = this.formatBytes32Hash(evidenceHash);

    // Solidity enum VerificationVerdict { NONE=0, VERIFIED=1, PARTIAL=2, SUSPICIOUS=3 }
    let verdictEnum = 1;
    if (verdict === "PARTIAL") verdictEnum = 2;
    if (verdict === "SUSPICIOUS") verdictEnum = 3;

    const txResponse = await contract.recordVerification(
      taskId,
      bytes32Hash,
      verdictEnum,
      Math.min(100, Math.max(0, integrityScore)),
      "VeriWork-Engine-v2.4-EVM",
    );
    const receipt = await txResponse.wait();

    const commitment = this.commitments.get(taskId);
    if (commitment) {
      commitment.verdictRecorded = verdict;
    }

    const tx: ChainTransaction = {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      timestamp: new Date().toISOString(),
      from: this.wallet?.address || receipt.from,
      to: this.contractAddress,
      method: "recordVerification",
      params: { taskId, evidenceHash: bytes32Hash, verdict, integrityScore },
      status: receipt.status === 1 ? "SUCCESS" : "REVERTED",
      gasUsed: Number(receipt.gasUsed),
      blockHash: receipt.blockHash,
      explorerUrl: `${this.explorerBaseUrl}/tx/${receipt.hash}`,
    };

    this.transactions.set(receipt.hash, tx);
    return tx;
  }

  public async challengeTaskOnChain(
    taskId: string,
    reason: string,
    challengerAddress?: string,
  ): Promise<ChainTransaction> {
    const contract = await this.checkReadyContract();
    const txResponse = await contract.challengeVerification(taskId, reason);
    const receipt = await txResponse.wait();

    const tx: ChainTransaction = {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      timestamp: new Date().toISOString(),
      from: challengerAddress || this.wallet?.address || receipt.from,
      to: this.contractAddress,
      method: "challengeVerification",
      params: { taskId, reason },
      status: receipt.status === 1 ? "SUCCESS" : "REVERTED",
      gasUsed: Number(receipt.gasUsed),
      blockHash: receipt.blockHash,
      explorerUrl: `${this.explorerBaseUrl}/tx/${receipt.hash}`,
    };

    this.transactions.set(receipt.hash, tx);
    return tx;
  }

  public async resolveChallengeOnChain(
    taskId: string,
    resolutionNotes: string,
  ): Promise<ChainTransaction> {
    const contract = await this.checkReadyContract();
    const txResponse = await contract.resolveChallenge(taskId, resolutionNotes);
    const receipt = await txResponse.wait();

    const tx: ChainTransaction = {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      timestamp: new Date().toISOString(),
      from: this.wallet?.address || receipt.from,
      to: this.contractAddress,
      method: "resolveChallenge",
      params: { taskId, resolutionNotes },
      status: receipt.status === 1 ? "SUCCESS" : "REVERTED",
      gasUsed: Number(receipt.gasUsed),
      blockHash: receipt.blockHash,
      explorerUrl: `${this.explorerBaseUrl}/tx/${receipt.hash}`,
    };

    this.transactions.set(receipt.hash, tx);
    return tx;
  }

  public async closeTaskOnChain(taskId: string): Promise<ChainTransaction> {
    const contract = await this.checkReadyContract();
    const txResponse = await contract.closeTask(taskId);
    const receipt = await txResponse.wait();

    const tx: ChainTransaction = {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      timestamp: new Date().toISOString(),
      from: this.wallet?.address || receipt.from,
      to: this.contractAddress,
      method: "closeTask",
      params: { taskId },
      status: receipt.status === 1 ? "SUCCESS" : "REVERTED",
      gasUsed: Number(receipt.gasUsed),
      blockHash: receipt.blockHash,
      explorerUrl: `${this.explorerBaseUrl}/tx/${receipt.hash}`,
    };

    this.transactions.set(receipt.hash, tx);
    return tx;
  }

  public getCommitment(taskId: string): BlockchainCommitment | undefined {
    return this.commitments.get(taskId);
  }

  public setCommitment(taskId: string, commitment: BlockchainCommitment): void {
    this.commitments.set(taskId, commitment);
  }

  public async getTransaction(
    txHash: string,
  ): Promise<ChainTransaction | undefined> {
    const cached = this.transactions.get(txHash);
    if (cached) return cached;

    if (!this.provider || !ethers.isHexString(txHash, 32)) {
      return undefined;
    }

    try {
      const [tx, receipt] = await Promise.all([
        this.provider.getTransaction(txHash),
        this.provider.getTransactionReceipt(txHash),
      ]);

      if (!tx || !receipt) return undefined;

      const block = await this.provider.getBlock(receipt.blockNumber);
      const parsed = tx.data
        ? VERIWORK_INTERFACE.parseTransaction({
            data: tx.data,
            value: tx.value,
          })
        : null;

      const chainTx: ChainTransaction = {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        timestamp: block
          ? new Date(Number(block.timestamp) * 1000).toISOString()
          : new Date().toISOString(),
        from: receipt.from || tx.from,
        to: tx.to || this.contractAddress,
        method: parsed?.name || "contractCall",
        params: parsed
          ? this.normalizeParams(parsed.args, parsed.fragment.inputs)
          : {},
        status: receipt.status === 1 ? "SUCCESS" : "REVERTED",
        gasUsed: Number(receipt.gasUsed),
        blockHash: receipt.blockHash || undefined,
        explorerUrl: `${this.explorerBaseUrl}/tx/${receipt.hash}`,
      };

      this.transactions.set(receipt.hash, chainTx);
      return chainTx;
    } catch (error) {
      console.warn(
        `[VERIWORK BLOCKCHAIN] Failed to inspect transaction ${txHash}:`,
        (error as Error).message,
      );
      return undefined;
    }
  }

  private normalizeValue(value: unknown): unknown {
    if (typeof value === "bigint") return value.toString();

    if (Array.isArray(value)) {
      return value.map((item) => this.normalizeValue(item));
    }

    if (value && typeof value === "object") {
      const output: Record<string, unknown> = {};
      for (const [key, item] of Object.entries(
        value as Record<string, unknown>,
      )) {
        if (/^\d+$/.test(key)) continue;
        output[key] = this.normalizeValue(item);
      }
      return output;
    }

    return value;
  }

  private normalizeParams(
    args: ethers.Result,
    inputs: readonly ethers.ParamType[],
  ): Record<string, unknown> {
    const params: Record<string, unknown> = {};

    inputs.forEach((input, index) => {
      const name = input.name || `arg${index}`;
      params[name] = this.normalizeValue(args[index]);
    });

    return params;
  }

  public async getRecentTransactions(limit = 10): Promise<ChainTransaction[]> {
    if (!this.provider || !this.contractAddress) {
      return Array.from(this.transactions.values())
        .sort((a, b) => b.blockNumber - a.blockNumber)
        .slice(0, limit);
    }

    try {
      const latestBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, latestBlock - HISTORY_BLOCK_WINDOW);

      const logs = await this.provider.getLogs({
        address: this.contractAddress,
        fromBlock,
        toBlock: latestBlock,
      });

      const byHash = new Map<string, ChainTransaction>();

      for (const log of logs) {
        let parsedLog: ethers.LogDescription | null = null;

        try {
          parsedLog = VERIWORK_INTERFACE.parseLog({
            topics: log.topics,
            data: log.data,
          });
        } catch {
          continue;
        }

        if (!parsedLog) continue;

        if (byHash.has(log.transactionHash)) continue;

        const tx = await this.provider.getTransaction(log.transactionHash);
        const receipt = await this.provider.getTransactionReceipt(
          log.transactionHash,
        );
        if (!tx || !receipt) continue;

        const block = await this.provider.getBlock(log.blockNumber);

        const parsedTx = tx.data
          ? VERIWORK_INTERFACE.parseTransaction({
              data: tx.data,
              value: tx.value,
            })
          : null;

        const chainTx: ChainTransaction = {
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          timestamp: block
            ? new Date(Number(block.timestamp) * 1000).toISOString()
            : new Date().toISOString(),
          from: receipt.from || tx.from,
          to: tx.to || this.contractAddress,
          method: parsedTx?.name || parsedLog.name || "contractCall",
          params: parsedTx
            ? this.normalizeParams(parsedTx.args, parsedTx.fragment.inputs)
            : { event: parsedLog.name },
          status: receipt.status === 1 ? "SUCCESS" : "REVERTED",
          gasUsed: Number(receipt.gasUsed),
          blockHash: receipt.blockHash || undefined,
          explorerUrl: `${this.explorerBaseUrl}/tx/${log.transactionHash}`,
        };

        byHash.set(log.transactionHash, chainTx);
        this.transactions.set(log.transactionHash, chainTx);
      }

      return Array.from(byHash.values())
        .sort((a, b) => {
          if (b.blockNumber !== a.blockNumber) {
            return b.blockNumber - a.blockNumber;
          }
          return b.timestamp.localeCompare(a.timestamp);
        })
        .slice(0, limit);
    } catch (error) {
      console.warn(
        "[VERIWORK BLOCKCHAIN] Historical transaction scan failed:",
        (error as Error).message,
      );

      return Array.from(this.transactions.values())
        .sort((a, b) => b.blockNumber - a.blockNumber)
        .slice(0, limit);
    }
  }

  public async getRecentBlocks(limit = 6): Promise<ChainBlock[]> {
    try {
      if (!this.provider) return [];
      const latest = await this.provider.getBlockNumber();
      const blocks: ChainBlock[] = [];
      const start = Math.max(0, latest - limit + 1);

      for (let b = latest; b >= start; b--) {
        const block = await this.provider.getBlock(b);
        if (block) {
          blocks.push({
            blockNumber: block.number,
            blockHash: block.hash || "",
            timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
            transactionsCount: block.transactions.length,
          });
        }
      }
      return blocks;
    } catch {
      return [];
    }
  }
}

export const blockchainService = new BlockchainService();
