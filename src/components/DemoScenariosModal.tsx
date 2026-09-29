import React from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Clock, 
  ShieldAlert, 
  Flag,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface DemoScenariosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenarioId: string) => void;
}

export const DemoScenariosModal: React.FC<DemoScenariosModalProps> = ({
  isOpen,
  onClose,
  onSelectScenario,
}) => {
  if (!isOpen) return null;

  const scenarios = [
    {
      id: '1',
      title: 'Scenario 1: Genuine Repair Claim',
      verdict: 'VERIFIED',
      verdictColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
      targetTask: 'TASK-1042 (Chilled Water Pump #7)',
      description: 'Ideal maintenance claim with complete photographic proof, NTP timestamp lock, NFC technician attestation, and ASME sign-off. Passes all deterministic checks with 98% integrity score.',
      keyDemonstration: 'Shows complete automated verification pipeline and cryptographic commitment anchored on MST block #140224.',
    },
    {
      id: '2',
      title: 'Scenario 2: Missing Required Evidence',
      verdict: 'PARTIAL',
      verdictColor: 'text-amber-400 bg-amber-950/60 border-amber-800/80',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      targetTask: 'TASK-1055 (Rooftop AHU-12 Air Filter)',
      description: 'Contractor submitted before/after photos, but neglected mandatory technician NFC identity attestation and signed declaration.',
      keyDemonstration: 'Engine prevents automatic sign-off, flags "Missing Evidence", and sets status to PARTIAL with concrete missing requirements.',
    },
    {
      id: '3',
      title: 'Scenario 3: Suspicious Evidence Reuse (Replay Attack)',
      verdict: 'SUSPICIOUS',
      verdictColor: 'text-rose-400 bg-rose-950/60 border-rose-800/80',
      icon: Copy,
      iconColor: 'text-rose-400',
      targetTask: 'TASK-1071 (Elevator Hoist Motor Bearing)',
      description: 'Technician re-uploaded photographic artifact (E-293) previously submitted for TASK-1042 to claim work on an entirely different asset.',
      keyDemonstration: 'Replay engine detects identical SHA-256 binary hash & pHash fingerprint across historical tasks, flagging fraud alert and linking conflicting tasks in the Evidence Graph.',
    },
    {
      id: '4',
      title: 'Scenario 4: Timeline Sequence Anomaly',
      verdict: 'SUSPICIOUS',
      verdictColor: 'text-rose-400 bg-rose-950/60 border-rose-800/80',
      icon: Clock,
      iconColor: 'text-rose-400',
      targetTask: 'TASK-1089 (Fire Suppression Bank)',
      description: 'Causality sequence inversion: evidence package completion timestamp is recorded 3 hours prior to task dispatch and assignment.',
      keyDemonstration: 'Deterministic timeline validator detects impossible sequence, highlights chronological causality violation, and flags retrofitted evidence.',
    },
    {
      id: '5',
      title: 'Scenario 5: Post-Submission Tampering Attack',
      verdict: 'TAMPER_FAILURE',
      verdictColor: 'text-rose-400 bg-rose-950/60 border-rose-800/80',
      icon: ShieldAlert,
      iconColor: 'text-rose-400',
      targetTask: 'TASK-1042 (Live Tamper Simulator)',
      description: 'Simulates a malicious actor modifying declared materials or billing hours in the off-chain package after blockchain commitment was anchored.',
      keyDemonstration: 'Instant SHA-256 recalculation shows mismatch: "🚨 Current evidence hash does not match immutable MST commitment #140224."',
    },
    {
      id: '6',
      title: 'Scenario 6: Challenge Verification & Dispute',
      verdict: 'DISPUTE_OPEN',
      verdictColor: 'text-purple-400 bg-purple-950/60 border-purple-800/80',
      icon: Flag,
      iconColor: 'text-purple-400',
      targetTask: 'TASK-1042 (Dispute Layer)',
      description: 'Facility Manager audits a verified claim, notices concrete discoloration, and raises an on-chain Challenge Verification dispute.',
      keyDemonstration: 'Demonstrates decentralized dispute logging on MST without altering the original immutable evidence package.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0e1422] border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h2 className="font-display text-lg font-bold text-white">
                Guided Hackathon Demo Scenarios
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select any test case to automatically load the task, trigger the verification engine, and audit the results.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scenario List */}
        <div className="p-6 overflow-y-auto space-y-4">
          {scenarios.map((sc) => {
            const Icon = sc.icon;
            return (
              <div
                key={sc.id}
                onClick={() => {
                  onSelectScenario(sc.id);
                  onClose();
                }}
                className="group p-4 rounded-xl bg-slate-900/40 border border-slate-800/90 hover:border-cyan-500/60 hover:bg-slate-900/80 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className={`w-5 h-5 ${sc.iconColor}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors">
                        {sc.title}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${sc.verdictColor}`}>
                        {sc.verdict}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {sc.targetTask}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                      {sc.description}
                    </p>
                    <div className="text-[11px] text-cyan-400/90 font-mono bg-cyan-950/30 px-2.5 py-1 rounded border border-cyan-900/50 inline-block">
                      💡 Demo Focus: {sc.keyDemonstration}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform self-end md:self-center">
                  <span>Launch Scenario</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Targeting MST EVM Contract: 0x71C9...40B8</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
