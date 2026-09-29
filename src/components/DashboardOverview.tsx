import React from 'react';
import { 
  DashboardMetrics, 
  MaintenanceTask, 
  VerificationVerdict 
} from '../types/veriwork';
import { 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  FileCheck2, 
  Layers, 
  Link2, 
  Copy, 
  Flag,
  ArrowRight,
  TrendingUp,
  Activity,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface DashboardOverviewProps {
  metrics: DashboardMetrics | null;
  tasks: MaintenanceTask[];
  onSelectTask: (taskId: string) => void;
  onOpenDemo: (scenarioId: string) => void;
  onNavigateToTab: (tab: 'tasks' | 'graph' | 'tamper' | 'blockchain') => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  metrics,
  tasks,
  onSelectTask,
  onOpenDemo,
  onNavigateToTab,
}) => {
  // Recent verifications
  const verifiedOrReviewedTasks = tasks
    .filter((t) => t.verificationResult)
    .slice(0, 4);

  // Suspicious tasks requiring attention
  const suspiciousTasks = tasks.filter(
    (t) => t.status === 'SUSPICIOUS' || t.verificationVerdict === 'SUSPICIOUS'
  );

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Top Banner / Live Hackathon Quick Launcher */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-blue-950/30 border border-cyan-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
              MST EVM Real-Time Cryptographic Verification
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold text-white tracking-tight">
            VeriWork Physical Evidence Verification Center
          </h2>
          <p className="text-sm text-slate-300 max-w-2xl">
            Audit claims across campus equipment. Detecting photo replay, timeline sequence inversions, and missing compliance proofs anchored to MST blocks.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onOpenDemo('1')}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-md shadow-cyan-900/40 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch Genuine Demo</span>
          </button>
          <button
            onClick={() => onNavigateToTab('tamper')}
            className="px-4 py-2.5 text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Tamper Detection Lab</span>
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        
        {/* Active Tasks */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-2">
            <span>Active Claims</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {metrics ? metrics.activeTasks : 4}
          </div>
          <span className="text-[11px] text-slate-400 mt-1">Across 5 key facilities</span>
        </div>

        {/* Verified Claims */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-2">
            <span>Verified Claims</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            {metrics ? metrics.verifiedCount : 1}
          </div>
          <span className="text-[11px] text-emerald-400/80 mt-1">All proofs corroborated</span>
        </div>

        {/* Partial Evidence */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-2">
            <span>Partial Evidence</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono tabular-nums">
            {metrics ? metrics.partialCount : 1}
          </div>
          <span className="text-[11px] text-amber-400/80 mt-1">Missing badge / declaration</span>
        </div>

        {/* Suspicious Claims */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-2">
            <span>Suspicious Claims</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono tabular-nums">
            {metrics ? metrics.suspiciousCount : 2}
          </div>
          <span className="text-[11px] text-rose-400/80 mt-1">Replay or timeline anomaly</span>
        </div>

        {/* MST Commitments */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-2">
            <span>MST Commitments</span>
            <Link2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300 font-mono tabular-nums">
            {metrics ? metrics.blockchainCommitments : 4}
          </div>
          <span className="text-[11px] text-purple-400/80 mt-1">On-chain SHA-256 anchors</span>
        </div>

      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Replay Detection Alerts */}
        <div 
          onClick={() => onNavigateToTab('graph')}
          className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-950/40 border border-rose-800/60 flex items-center justify-center">
              <Copy className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Cross-Task Replay Alerts</div>
              <div className="text-lg font-bold text-slate-100 font-mono">
                {metrics?.evidenceReuseAlerts || 1} Detected
              </div>
            </div>
          </div>
          <span className="text-xs text-rose-400 font-medium group-hover:translate-x-1 transition-transform flex items-center gap-1">
            Graph <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Open Challenges */}
        <div 
          onClick={() => onNavigateToTab('tasks')}
          className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-950/40 border border-indigo-800/60 flex items-center justify-center">
              <Flag className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Open Disputes / Challenges</div>
              <div className="text-lg font-bold text-slate-100 font-mono">
                {metrics?.openChallenges || 0} Open
              </div>
            </div>
          </div>
          <span className="text-xs text-indigo-400 font-medium group-hover:translate-x-1 transition-transform flex items-center gap-1">
            Review <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Average Integrity Score */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-950/40 border border-cyan-800/60 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Avg Evidence Integrity Score</div>
              <div className="text-lg font-bold text-cyan-300 font-mono">
                {metrics?.averageIntegrityScore || 73} / 100
              </div>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">Evaluated</span>
        </div>

      </div>

      {/* Two Column Layout: Suspicious Evidence Alerts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Suspicious Evidence Alerts */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-400" />
                <h3 className="font-display text-base font-bold text-white">
                  Suspicious Evidence & Anomaly Alerts
                </h3>
              </div>
              <span className="text-xs font-mono text-rose-400">Requires Auditor Attention</span>
            </div>

            <div className="space-y-3.5">
              {suspiciousTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onSelectTask(t.id)}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-rose-950/80 hover:border-rose-700/60 transition-colors cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="font-semibold text-sm text-slate-200 group-hover:text-rose-300 transition-colors">
                      {t.title}
                    </span>
                    <span className="text-[10px] font-mono text-rose-400 bg-rose-950/50 px-2 py-0.5 rounded border border-rose-800/70">
                      {t.id}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                    {t.verificationResult?.reasons[0] || 'Anomalies flagged in submitted evidence package.'}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-900">
                    <span>Asset: {t.asset.id}</span>
                    <span className="text-rose-400 group-hover:underline flex items-center gap-1">
                      Investigate Claim <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 flex justify-between items-center">
            <span>Integrity Engine v2.4</span>
            <button
              onClick={() => onNavigateToTab('graph')}
              className="text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
            >
              Explore Evidence Graph →
            </button>
          </div>
        </div>

        {/* Recent Verification Activity */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="font-display text-base font-bold text-white">
                  Recent Verification Activity
                </h3>
              </div>
              <button
                onClick={() => onNavigateToTab('tasks')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
              >
                View All Claims
              </button>
            </div>

            <div className="space-y-3.5">
              {verifiedOrReviewedTasks.map((t) => {
                const verdict = t.verificationResult?.verdict || 'VERIFIED';
                const score = t.verificationResult?.integrityScore.totalScore || 0;
                const isVerified = verdict === 'VERIFIED';
                const isPartial = verdict === 'PARTIAL';

                return (
                  <div
                    key={t.id}
                    onClick={() => onSelectTask(t.id)}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 transition-colors cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-semibold text-sm text-slate-200 group-hover:text-cyan-300 transition-colors">
                        {t.title}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        isVerified 
                          ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60'
                          : isPartial
                          ? 'text-amber-400 bg-amber-950/40 border-amber-800/60'
                          : 'text-rose-400 bg-rose-950/40 border-rose-800/60'
                      }`}>
                        {verdict}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
                      <span>{t.asset.name}</span>
                      <span>·</span>
                      <span className="font-mono">Integrity: {score}/100</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-900">
                      <span>MST Block: #{t.blockchainCommitment?.blockNumber || 140224}</span>
                      <span className="text-slate-400 group-hover:text-cyan-300 transition-colors flex items-center gap-1">
                        View Details <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 flex justify-between items-center">
            <span>MST EVM Contract: 0x71C9...40B8</span>
            <button
              onClick={() => onNavigateToTab('blockchain')}
              className="text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
            >
              Inspect Ledger & Blocks →
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
