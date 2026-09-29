import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Link2, 
  ExternalLink, 
  FileCode, 
  Layers, 
  CheckCircle2, 
  Cpu, 
  Shield, 
  RefreshCw,
  Terminal,
  Copy
} from 'lucide-react';

export const MstExplorer: React.FC = () => {
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [recentBlocks, setRecentBlocks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'transactions' | 'blocks' | 'contract'>('transactions');
  const [copiedContract, setCopiedContract] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/blockchain/stats');
        const json = await res.json();
        if (json.success) {
          setNetworkInfo(json.network);
          setRecentTransactions(json.recentTransactions || []);
          setRecentBlocks(json.recentBlocks || []);
        }
      } catch (err) {
        console.error('Failed to fetch blockchain stats:', err);
      }
    }
    fetchStats();
  }, []);

  const contractAddress = networkInfo?.contractAddress || '0x71C94B2a6136d4A93c04229614f1d43fE67140B8';

  const copyContractAddress = () => {
    navigator.clipboard.writeText(contractAddress);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-purple-400" />
            <h2 className="font-display text-2xl font-bold text-white tracking-tight">
              MST Blockchain Infrastructure Explorer
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident audit trail & cryptographic state transitions anchored on MST EVM.
          </p>
        </div>

        {/* Contract Address Card */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono">
          <span className="text-slate-400">Registry Contract:</span>
          <span className="text-cyan-300">{contractAddress.slice(0, 10)}...{contractAddress.slice(-6)}</span>
          <button
            onClick={copyContractAddress}
            className="p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
            title="Copy Contract Address"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          {copiedContract && <span className="text-[10px] text-emerald-400">Copied!</span>}
        </div>
      </div>

      {/* Network Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Target Network</span>
          <div className="text-base font-bold text-slate-100 font-mono">
            {networkInfo?.network || 'MST Testnet'}
          </div>
          <span className="text-[11px] text-purple-400 font-mono mt-1 block">Chain ID: {networkInfo?.chainId || '91562037'}</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Current Block Height</span>
          <div className="text-base font-bold text-cyan-300 font-mono tabular-nums">
            #{networkInfo?.currentBlockNumber || 0}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">MST Testnet RPC</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Anchored Commitments</span>
          <div className="text-base font-bold text-emerald-400 font-mono tabular-nums">
            {networkInfo?.totalCommitments || 0} Packages
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">SHA-256 digests on-chain</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">RPC Integration Mode</span>
          <div className={`text-xs font-bold font-mono px-2 py-1 rounded inline-block border ${
            networkInfo?.isLiveRpc 
              ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300' 
              : 'bg-rose-950/80 border-rose-600 text-rose-300'
          }`}>
            {networkInfo?.isLiveRpc ? 'LIVE MST TESTNET' : (networkInfo?.statusMessage || 'MST NOT CONFIGURED')}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {networkInfo?.walletBalance || '0 tMSTC'}
          </span>
        </div>

      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'transactions' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Recent Transactions
        </button>
        <button
          onClick={() => setActiveTab('blocks')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'blocks' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Mined Blocks
        </button>
        <button
          onClick={() => setActiveTab('contract')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'contract' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          VeriWorkRegistry.sol (Smart Contract)
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'transactions' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4">Tx Hash</th>
                  <th className="py-3 px-4">Method Invoked</th>
                  <th className="py-3 px-4">Block #</th>
                  <th className="py-3 px-4">From</th>
                  <th className="py-3 px-4">Gas Used</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      Transactions will appear here as tasks are created, evidence committed, and verified on MST Testnet.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((tx) => (
                    <tr key={tx.txHash} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-cyan-400 font-semibold">
                        <a
                          href={tx.explorerUrl || `https://testnet.mstscan.com/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline inline-flex items-center gap-1"
                        >
                          <span>{tx.txHash.slice(0, 10)}...{tx.txHash.slice(-6)}</span>
                          <ExternalLink className="w-3 h-3 text-cyan-400 shrink-0" />
                        </a>
                      </td>
                      <td className="py-3 px-4 text-slate-200">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-purple-300 text-[11px]">
                          {tx.method}()
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        #{tx.blockNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {tx.from ? `${tx.from.slice(0, 8)}...` : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {tx.gasUsed ? tx.gasUsed.toLocaleString() : 'N/A'} units
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-emerald-400 text-[11px] font-bold">
                          ✓ CONFIRMED
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'blocks' && (
        <div className="space-y-4">
          {recentBlocks.map((block) => (
            <div key={block.blockNumber} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="font-bold text-cyan-300 text-sm">BLOCK #{block.blockNumber}</span>
                <span className="text-slate-400">{new Date(block.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-800">
                <div>
                  <span className="text-slate-500 block">Block Hash:</span>
                  <span className="text-slate-300 break-all">{block.blockHash}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Merkle Root:</span>
                  <span className="text-purple-300 break-all">{block.merkleRoot}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'contract' && (
        <div className="space-y-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-slate-400 block mb-0.5">Solidity Contract Source:</span>
              <span className="text-cyan-300 font-bold">contracts/VeriWorkRegistry.sol</span>
            </div>
            <span className="px-2.5 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[11px]">
              Solidity ^0.8.20
            </span>
          </div>

          <pre className="p-4 rounded-xl bg-[#070a10] border border-slate-800 text-slate-300 overflow-x-auto text-[11px] leading-relaxed max-h-[420px]">
{`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VeriWorkRegistry {
    enum TaskWorkflowState { CREATED, ASSIGNED, IN_PROGRESS, EVIDENCE_SUBMITTED, UNDER_VERIFICATION, VERIFIED, PARTIAL, SUSPICIOUS, CLOSED }
    enum VerificationVerdict { NONE, VERIFIED, PARTIAL, SUSPICIOUS }
    enum ChallengeStatus { NO_CHALLENGE, OPEN, RESOLVED }

    struct MaintenanceTask {
        string taskId;
        string assetId;
        string technicianId;
        TaskWorkflowState state;
        bytes32 evidenceHash;
        VerificationVerdict verdict;
        uint256 createdAt;
        uint256 committedAt;
        uint256 verifiedAt;
        uint256 closedAt;
        bool exists;
    }

    event TaskCreated(string indexed taskId, string assetId, uint256 timestamp, address indexed creator);
    event TaskAssigned(string indexed taskId, string technicianId, uint256 timestamp, address indexed assigner);
    event TaskStarted(string indexed taskId, uint256 timestamp, address indexed technician);
    event EvidenceCommitted(string indexed taskId, string packageId, bytes32 indexed evidenceHash, uint256 timestamp, address indexed submitter);
    event VerificationRecorded(string indexed taskId, bytes32 indexed evidenceHash, VerificationVerdict verdict, uint8 integrityScore, uint256 timestamp);
    event TaskClosed(string indexed taskId, uint256 timestamp, address indexed closer);
    event ChallengeRaised(string indexed taskId, address indexed challenger, string reason, uint256 timestamp);
    event ChallengeResolved(string indexed taskId, address indexed resolver, string resolutionNotes, uint256 timestamp);

    function createTask(string memory _taskId, string memory _assetId) external;
    function assignTask(string memory _taskId, string memory _technicianId) external;
    function startTask(string memory _taskId) external;
    function submitEvidenceCommitment(string memory _taskId, string memory _packageId, bytes32 _evidenceHash) external;
    function recordVerification(string memory _taskId, bytes32 _evidenceHash, VerificationVerdict _verdict, uint8 _integrityScore, string memory _engineVersion) external;
    function challengeVerification(string memory _taskId, string memory _reason) external;
    function resolveChallenge(string memory _taskId, string memory _resolutionNotes) external;
    function closeTask(string memory _taskId) external;
}`}
          </pre>
        </div>
      )}

    </div>
  );
};
