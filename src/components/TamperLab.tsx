import React, { useState } from 'react';
import { MaintenanceTask } from '../types/veriwork';
import { 
  AlertOctagon, 
  ShieldCheck, 
  RotateCcw, 
  Flame, 
  Terminal, 
  CheckCircle2, 
  Layers, 
  Hash,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface TamperLabProps {
  tasks: MaintenanceTask[];
  selectedTaskId: string;
  onSelectTaskId: (taskId: string) => void;
  onTamperTask: (taskId: string, field: string) => void;
  onRestoreTask: (taskId: string) => void;
}

export const TamperLab: React.FC<TamperLabProps> = ({
  tasks,
  selectedTaskId,
  onSelectTaskId,
  onTamperTask,
  onRestoreTask,
}) => {
  const [selectedField, setSelectedField] = useState<string>('materialsUsed');

  const currentTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];
  const isTampered = currentTask?.isTampered;
  const originalHash = currentTask?.anchoredEvidenceHash || '0x8f4d1e992b8a7c645231e0b54321fedcba0987654321abcdef0123456789abcd';
  const currentHash = currentTask?.currentEvidenceHash || originalHash;

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      
      {/* Title & Concept */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-400" />
            <h2 className="font-display text-2xl font-bold text-white tracking-tight">
              Evidence Tamper-Detection Simulator
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Demonstrating cryptographic zero-trust integrity: when off-chain maintenance evidence is altered, it instantly fails against the MST blockchain commitment.
          </p>
        </div>

        {/* Task Selector */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
          <span className="text-slate-400 px-2">Target Task:</span>
          <select
            value={selectedTaskId}
            onChange={(e) => onSelectTaskId(e.target.value)}
            className="bg-transparent text-slate-100 font-medium focus:outline-none cursor-pointer pr-2"
          >
            {tasks.map((t) => (
              <option key={t.id} value={t.id} className="bg-slate-900 text-slate-100">
                {t.id}: {t.title.slice(0, 30)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Comparison Stage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
        {/* Left: MST On-Chain Immutable Anchor */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span className="font-mono text-xs font-semibold text-slate-200 uppercase">
                  1. MST Blockchain Commitment
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                IMMUTABLE ANCHOR
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Recorded on MST block #{currentTask?.blockchainCommitment?.blockNumber || 140224} during contractor submission. This on-chain cryptographic commitment can never be altered or forged.
            </p>

            <div className="space-y-1">
              <span className="text-[11px] font-mono text-slate-400">ANCHORED SHA-256 DIGEST:</span>
              <div className="font-mono text-xs text-purple-300 bg-slate-950/90 p-3 rounded-lg border border-purple-900/50 break-all select-all font-semibold">
                {originalHash}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex justify-between items-center mt-6">
            <span>Contract: 0x71C9...40B8</span>
            <span className="text-purple-400">EVM State Confirmed</span>
          </div>
        </div>

        {/* Right: Live Current Evidence Package Hash */}
        <div className={`p-6 rounded-2xl border transition-colors shadow-xl flex flex-col justify-between ${
          isTampered 
            ? 'bg-rose-950/40 border-rose-600/80 shadow-rose-950/30' 
            : 'bg-slate-900/60 border-slate-800'
        }`}>
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
              <div className="flex items-center gap-2">
                {isTampered ? (
                  <AlertOctagon className="w-4 h-4 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                <span className="font-mono text-xs font-semibold text-slate-200 uppercase">
                  2. Current Off-Chain Evidence Package
                </span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                isTampered 
                  ? 'text-rose-300 bg-rose-900/60 border-rose-700' 
                  : 'text-emerald-300 bg-emerald-900/60 border-emerald-700'
              }`}>
                {isTampered ? 'MUTATED POST-ANCHOR' : 'PRISTINE MATCH'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Recalculated in real-time from the canonical JSON manifest. If any field, photograph, or declaration is tampered with, the SHA-256 digest changes completely.
            </p>

            <div className="space-y-1">
              <span className="text-[11px] font-mono text-slate-400">CURRENT COMPUTED HASH:</span>
              <div className={`font-mono text-xs p-3 rounded-lg border break-all select-all font-semibold ${
                isTampered 
                  ? 'text-rose-300 bg-slate-950 border-rose-500/80' 
                  : 'text-cyan-300 bg-slate-950/90 border-slate-800'
              }`}>
                {currentHash}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-[11px] font-mono flex justify-between items-center mt-6">
            <span className="text-slate-400">Canonical Key Sorting</span>
            <span className={isTampered ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
              {isTampered ? 'MISMATCH DETECTED' : 'EXACT DIGEST MATCH'}
            </span>
          </div>
        </div>

      </div>

      {/* VERDICT BOX: LOUD AUDIT ALERT */}
      {isTampered ? (
        <div className="p-6 rounded-2xl bg-rose-950/90 border-2 border-rose-600 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 animate-pulse">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-900 border border-rose-500 text-white font-mono text-xs">
              <AlertOctagon className="w-4 h-4" />
              <span>🚨 EVIDENCE INTEGRITY FAILURE</span>
            </div>
            <h3 className="font-display text-xl font-bold text-white">
              This evidence no longer matches the commitment recorded on MST.
            </h3>
            <p className="text-xs text-rose-200 leading-relaxed max-w-2xl font-mono">
              Tampered Field: <span className="underline font-bold text-white">{currentTask?.tamperFieldModified}</span>. The cryptographic commitment anchored on-chain proves this record was altered post-submission.
            </p>
          </div>

          <button
            onClick={() => onRestoreTask(currentTask.id)}
            className="px-5 py-2.5 bg-white text-slate-900 hover:bg-slate-200 rounded-xl font-bold text-xs shadow-lg transition-colors flex items-center gap-2 cursor-pointer shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restore Pristine Evidence</span>
          </button>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-emerald-950/30 border border-emerald-800/60 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-emerald-300 text-sm">
                Cryptographic Evidence Verified
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                The computed SHA-256 canonical package digest matches the immutable MST blockchain commitment byte-for-byte.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-3 py-1.5 rounded-lg border border-emerald-800">
            INTEGRITY: 100%
          </span>
        </div>
      )}

      {/* Interactive Tamper Attack Triggers */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-rose-400" />
          <h3 className="font-display text-base font-bold text-white">
            Trigger Attack Simulation (Judge Demo)
          </h3>
        </div>
        <p className="text-xs text-slate-300">
          Simulate a malicious contractor or unauthorized internal actor altering the work order data after submission:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          
          <button
            onClick={() => onTamperTask(currentTask.id, 'materialsUsed')}
            className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500 hover:bg-rose-950/20 text-left transition-all group cursor-pointer"
          >
            <div className="text-xs font-semibold text-slate-200 group-hover:text-rose-300 mb-1 flex items-center justify-between">
              <span>Substitute Material</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-[11px] text-slate-400 leading-relaxed">
              Injects unauthorized cheap PVC gasket into declared materials.
            </div>
          </button>

          <button
            onClick={() => onTamperTask(currentTask.id, 'hoursSpent')}
            className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500 hover:bg-rose-950/20 text-left transition-all group cursor-pointer"
          >
            <div className="text-xs font-semibold text-slate-200 group-hover:text-rose-300 mb-1 flex items-center justify-between">
              <span>Inflate Labor Hours</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-[11px] text-slate-400 leading-relaxed">
              Alters contractor invoice billing hours from 1.8 to 17.3 hrs.
            </div>
          </button>

          <button
            onClick={() => onTamperTask(currentTask.id, 'photoHash')}
            className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500 hover:bg-rose-950/20 text-left transition-all group cursor-pointer"
          >
            <div className="text-xs font-semibold text-slate-200 group-hover:text-rose-300 mb-1 flex items-center justify-between">
              <span>Swap Photo Artifact</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-[11px] text-slate-400 leading-relaxed">
              Replaces the before-photo hash with altered photo bytes.
            </div>
          </button>

          <button
            onClick={() => onTamperTask(currentTask.id, 'statement')}
            className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500 hover:bg-rose-950/20 text-left transition-all group cursor-pointer"
          >
            <div className="text-xs font-semibold text-slate-200 group-hover:text-rose-300 mb-1 flex items-center justify-between">
              <span>Alter Declaration</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-[11px] text-slate-400 leading-relaxed">
              Modifies the certified technician sign-off statement.
            </div>
          </button>

        </div>
      </div>

    </div>
  );
};
