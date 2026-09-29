import React from 'react';
import { 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  AlertOctagon, 
  Layers, 
  Cpu, 
  FileCode, 
  Radio, 
  Terminal,
  Activity,
  Play
} from 'lucide-react';

interface HeroLandingProps {
  onOpenApp: () => void;
  onOpenDemo: (scenarioId: string) => void;
}

export const HeroLanding: React.FC<HeroLandingProps> = ({ onOpenApp, onOpenDemo }) => {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-800/80 bg-gradient-to-b from-[#0e1422] to-[#0b0f17]">
        {/* Subtle background grid pattern */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>MST EVM VERIFIABLE AUDIT INFRASTRUCTURE</span>
            </div>

            <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              Don't just record maintenance.{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
                Verify it.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 mb-10 leading-relaxed font-normal">
              VeriWork is an enterprise verification platform for physical maintenance claims. Combining AI-assisted evidence analysis, cross-evidence verification, replay detection, and tamper-evident audit trails anchored on the MST blockchain.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onOpenApp}
                className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Open Command Center</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onOpenDemo('1')}
                className="w-full sm:w-auto px-7 py-3.5 text-sm font-semibold text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 text-cyan-400" />
                <span>Run Verification Demo</span>
              </button>
            </div>

            <div className="mt-8 text-xs text-slate-400 flex items-center justify-center gap-3">
              <span>Deterministic Anomaly Engine</span>
              <span>·</span>
              <span>Perceptual Replay Detection</span>
              <span>·</span>
              <span>Tamper-Evident SHA-256 Commitments</span>
            </div>
          </div>

          {/* Visual Pipeline Showcase */}
          <div className="mt-16 p-1 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 max-w-5xl mx-auto shadow-2xl">
            <div className="bg-[#0b0f17] rounded-[15px] p-6 sm:p-8 border border-slate-800">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-6 text-center">
                VeriWork Verification Pipeline
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                {/* Step 1 */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-lg bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center mb-3">
                    <Layers className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200 mb-1">1. CLAIM</span>
                  <span className="text-[11px] text-slate-400">Task requirements, asset spec, priority & required evidence types</span>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-lg bg-blue-950/60 border border-blue-800/60 flex items-center justify-center mb-3">
                    <Radio className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200 mb-1">2. EVIDENCE</span>
                  <span className="text-[11px] text-slate-400">Before/after photos, NFC badge, NTP time-lock & declared materials</span>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-lg bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center mb-3">
                    <Cpu className="w-5 h-5 text-indigo-400" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200 mb-1">3. AI & INTEGRITY</span>
                  <span className="text-[11px] text-slate-400">Cross-evidence check, timeline causality & perceptual replay engine</span>
                </div>

                {/* Step 4 */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200 mb-1">4. VERDICT</span>
                  <span className="text-[11px] text-slate-400">Explainable scoring: VERIFIED, PARTIAL, or SUSPICIOUS</span>
                </div>

                {/* Step 5 */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-lg bg-purple-950/60 border border-purple-800/60 flex items-center justify-center mb-3">
                    <FileCode className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200 mb-1">5. MST COMMITMENT</span>
                  <span className="text-[11px] text-slate-400">Canonical SHA-256 package hash anchored in tamper-evident block</span>
                </div>
              </div>

              {/* Crucial Position statement */}
              <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-xs text-slate-400 font-mono">
                "AI and evidence analysis evaluate the submitted evidence. MST provides a tamper-evident and independently auditable record of the evidence commitment and workflow history."
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Core Problem & Solution */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-xs font-mono text-cyan-400 mb-2 uppercase">The Operational Dilemma</div>
            <h2 className="font-display text-3xl font-bold text-white mb-6">
              Existing systems merely RECORD maintenance claims. They don't verify them.
            </h2>
            <p className="text-slate-300 leading-relaxed mb-6">
              In apartments, universities, hospitals, factories, and public utilities, work orders are routinely marked "Completed" with zero verifiable proof. Fraudulent claims, reused photographs from earlier repairs, inverted timelines, and altered records slip through uninspected.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-slate-200">Evidence Replay & Reuse</div>
                  <div className="text-xs text-slate-400">Technicians submitting identical photos from previous jobs to claim multiple billable hours.</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <AlertOctagon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-slate-200">Timeline Sequence Inversions</div>
                  <div className="text-xs text-slate-400">Completed timestamps that predate dispatch, or multiple distant tasks marked finished at the exact same minute.</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <AlertOctagon className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-slate-200">Post-Submission Tampering</div>
                  <div className="text-xs text-slate-400">Disputed work orders altered after contractor billing without an immutable audit trail.</div>
                </div>
              </div>
            </div>
          </div>

          {/* VeriWork Solution Card */}
          <div className="p-8 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl">
            <div className="text-xs font-mono text-emerald-400 mb-2 uppercase">The VeriWork Architecture</div>
            <h3 className="font-display text-2xl font-bold text-white mb-4">
              Cryptographic Grounding & Explainable Evidence Analysis
            </h3>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              VeriWork isolates raw evidence (large photos, videos, telemetry) safely OFF-CHAIN, while synthesizing a canonical manifest whose SHA-256 fingerprint is permanently anchored to the MST EVM blockchain.
            </p>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-cyan-400 block mb-1">// Canonical Package Manifest</span>
                <span className="text-slate-300">
                  SHA256( taskId + assetId + techId + evidenceHashes + declaration + nonce )
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-emerald-400 block mb-1">// MST Smart Contract State Machine</span>
                <span className="text-slate-300">
                  CREATED → ASSIGNED → IN_PROGRESS → EVIDENCE_SUBMITTED → VERIFIED → CLOSED
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-indigo-400 block mb-1">// Explainable AI Verdict</span>
                <span className="text-slate-300">
                  Confidence Score · Integrity Breakdown · Anomaly Diagnostics · Dispute Logs
                </span>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={onOpenApp}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors cursor-pointer"
              >
                Inspect Live Claims
              </button>
              <button
                onClick={() => onOpenDemo('5')}
                className="px-5 py-2.5 text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800 rounded-lg transition-colors cursor-pointer"
              >
                Simulate Tamper Attack
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Future Physical Hardware Integration (NEURICK / IoT) */}
      <section className="py-16 border-t border-slate-800/80 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/40 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase mb-2">
                <Radio className="w-3.5 h-3.5" />
                <span>Future Physical Evidence Layer (NEURICK / IoT)</span>
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">
                Designed to ingest physical device and autonomous sensor telemetry
              </h3>
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                The current MVP is software-first and works independently of hardware. As IoT devices or physical telemetry nodes (like NEURICK) deploy, their cryptographic environmental signatures, vibration sensors, and device identities feed seamlessly into VeriWork's unified evidence package.
              </p>
            </div>
            <button
              onClick={onOpenApp}
              className="px-6 py-3 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg whitespace-nowrap transition-colors cursor-pointer"
            >
              Explore Architecture
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
