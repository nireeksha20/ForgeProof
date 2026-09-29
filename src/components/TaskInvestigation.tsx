import React, { useState } from "react";
import { MaintenanceTask, UserRole } from "../types/veriwork";
import { EvidenceVisualCard } from "./EvidenceVisualCard";
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Clock,
  CheckCircle2,
  Flag,
  Share2,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Link as LinkIcon,
  ArrowLeft,
  Cpu,
} from "lucide-react";

interface TaskInvestigationProps {
  task: MaintenanceTask;
  currentRole: UserRole;
  onBack: () => void;
  onAssignTask: (taskId: string, technicianId: string) => void;
  onStartTask: (taskId: string) => void;
  onSubmitEvidence: (taskId: string) => void;
  onVerifyTask: (taskId: string) => void;
  onChallengeTask: (taskId: string, reason: string) => void;
  onResolveChallenge: (taskId: string, notes: string) => void;
  onCloseTask: (taskId: string) => void;
  onNavigateToGraph: (taskId: string) => void;
  onNavigateToTamper: (taskId: string) => void;
  onNavigateToBlockchain: () => void;
}

export const TaskInvestigation: React.FC<TaskInvestigationProps> = ({
  task,
  currentRole,
  onBack,
  onAssignTask,
  onStartTask,
  onSubmitEvidence,
  onVerifyTask,
  onChallengeTask,
  onResolveChallenge,
  onCloseTask,
  onNavigateToGraph,
  onNavigateToTamper,
  onNavigateToBlockchain,
}) => {
  const [challengeReason, setChallengeReason] = useState("");
  const [isChallenging, setIsChallenging] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  const isVerified = task.status === "VERIFIED";
  const isPartial = task.status === "PARTIAL";
  const isSuspicious = task.status === "SUSPICIOUS";
  const isTampered = task.isTampered;

  const score = task.verificationResult?.integrityScore;

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-12">
      {/* ============================================================
          TOP NAVIGATION / BREADCRUMB
      ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        {/* Back to Claims Registry */}
        <button
          type="button"
          onClick={onBack}
          title="Return to Claims Registry"
          className="flex items-center gap-2 px-3 py-2 -ml-3 rounded-lg text-xs font-semibold text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Claims Registry</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Evidence Graph */}
          <button
            type="button"
            onClick={() => onNavigateToGraph(task.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-300 bg-slate-900 border border-slate-800 hover:border-cyan-800 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Explore Evidence Graph</span>
          </button>

          {/* Tamper Lab */}
          <button
            type="button"
            onClick={() => onNavigateToTamper(task.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-300 bg-rose-950/40 border border-rose-800/80 hover:bg-rose-900/40 rounded-lg transition-colors cursor-pointer"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Test Tamper Attack</span>
          </button>
        </div>
      </div>

      {/* ============================================================
          TAMPER ALERT
      ============================================================ */}
      {isTampered && (
        <div className="p-5 rounded-2xl bg-rose-950/80 border-2 border-rose-600 shadow-2xl shadow-rose-950/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertOctagon className="w-8 h-8 text-rose-400 shrink-0 mt-0.5" />

            <div>
              <div className="text-base font-extrabold text-white uppercase tracking-wider font-mono">
                EVIDENCE INTEGRITY FAILURE
              </div>

              <p className="text-xs text-rose-200 mt-1 max-w-2xl leading-relaxed">
                Off-chain evidence package was modified post-anchoring.
                Calculated hash ({task.currentEvidenceHash?.slice(0, 16)}...) no
                longer matches the tamper-evident commitment anchored on MST (
                {task.anchoredEvidenceHash?.slice(0, 16)}...).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToTamper(task.id)}
            className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg shadow whitespace-nowrap cursor-pointer"
          >
            Open Tamper Lab
          </button>
        </div>
      )}

      {/* ============================================================
          MAIN TASK HEADER
      ============================================================ */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-sm font-bold text-cyan-400">
                {task.id}
              </span>

              <span className="text-slate-600">/</span>

              <span className="text-xs text-slate-400 font-mono">
                PRIORITY: {task.priority}
              </span>

              <span className="text-slate-600">/</span>

              <span className="text-xs text-slate-400">
                Created {new Date(task.createdAt).toLocaleString()}
              </span>
            </div>

            <h1 className="font-display text-2xl font-bold text-white tracking-tight">
              {task.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
              {task.description}
            </p>
          </div>

          {/* Workflow State */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div
              className={`px-3 py-1 rounded-lg border font-mono text-xs flex items-center gap-2 ${
                isVerified
                  ? "text-emerald-300 bg-emerald-950/50 border-emerald-700/80"
                  : isPartial
                    ? "text-amber-300 bg-amber-950/50 border-amber-700/80"
                    : isSuspicious
                      ? "text-rose-300 bg-rose-950/50 border-rose-700/80"
                      : "text-slate-300 bg-slate-800/80 border-slate-700"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isVerified
                    ? "bg-emerald-400"
                    : isPartial
                      ? "bg-amber-400"
                      : isSuspicious
                        ? "bg-rose-400"
                        : "bg-slate-400"
                }`}
              />

              <span className="font-bold">{task.status}</span>
            </div>

            {task.blockchainCommitment && (
              <button
                type="button"
                onClick={onNavigateToBlockchain}
                className="text-[11px] font-mono text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
              >
                <span>MST Block #{task.blockchainCommitment.blockNumber}</span>

                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* ============================================================
            EQUIPMENT / PERSONNEL
        ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-500 block mb-0.5">
              Asset Identification
            </span>

            <span className="font-semibold text-slate-200">
              {task.asset.name}
            </span>

            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              {task.asset.id} · {task.asset.type}
            </div>
          </div>

          <div>
            <span className="text-slate-500 block mb-0.5">
              Physical Location
            </span>

            <span className="font-semibold text-slate-200">
              {task.asset.location}
            </span>

            <div className="text-[11px] text-slate-400 mt-0.5">
              {task.asset.building}, {task.asset.facility}
            </div>
          </div>

          <div>
            <span className="text-slate-500 block mb-0.5">
              Assigned Technician
            </span>

            <span className="font-semibold text-slate-200">
              {task.assignedTechnician
                ? task.assignedTechnician.name
                : "Unassigned"}
            </span>

            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              {task.assignedTechnician
                ? `${task.assignedTechnician.id} · ${task.assignedTechnician.organization}`
                : "Awaiting dispatch"}
            </div>
          </div>
        </div>

        {/* ============================================================
            WORKFLOW ACTIONS
        ============================================================ */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs text-slate-400">
            Current Stage:{" "}
            <span className="font-mono text-slate-200">{task.status}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* CREATED → ASSIGN */}
            {task.status === "CREATED" &&
              currentRole === "FACILITY_MANAGER" && (
                <button
                  type="button"
                  onClick={() => onAssignTask(task.id, "TECH-09")}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Assign to Marcus Vance (TECH-09)
                </button>
              )}

            {/* ASSIGNED → START */}
            {task.status === "ASSIGNED" && (
              <button
                type="button"
                onClick={() => onStartTask(task.id)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Start On-Site Work
              </button>
            )}

            {/* IN_PROGRESS → SUBMIT EVIDENCE */}
            {task.status === "IN_PROGRESS" && (
              <button
                type="button"
                onClick={() => onSubmitEvidence(task.id)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Submit Evidence Package
              </button>
            )}

            {/* ========================================================
                EVIDENCE_SUBMITTED / UNDER_VERIFICATION → VERIFY
            ======================================================== */}
            {(task.status === "EVIDENCE_SUBMITTED" ||
              task.status === "UNDER_VERIFICATION") && (
              <button
                type="button"
                onClick={() => onVerifyTask(task.id)}
                title="Run the VeriWork verification engine"
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md shadow-cyan-950/30 transition-all"
              >
                <Cpu className="w-4 h-4" />

                <span>Execute VeriWork Verification Engine</span>
              </button>
            )}

            {/* ========================================================
                VERIFIED / PARTIAL / SUSPICIOUS → RE-VERIFY
            ======================================================== */}
            {(task.status === "VERIFIED" ||
              task.status === "PARTIAL" ||
              task.status === "SUSPICIOUS") && (
              <button
                type="button"
                onClick={() => onVerifyTask(task.id)}
                title="Run verification again"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />

                <span>Re-Run Verification</span>
              </button>
            )}

            {/* VERIFIED / PARTIAL → CLOSE */}
            {(task.status === "VERIFIED" || task.status === "PARTIAL") &&
              currentRole === "FACILITY_MANAGER" && (
                <button
                  type="button"
                  onClick={() => onCloseTask(task.id)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Accept & Close Task
                </button>
              )}
          </div>
        </div>
      </div>

      {/* ============================================================
          VERIFICATION RESULTS
      ============================================================ */}
      {task.verificationResult && (
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-cyan-400" />
              </div>

              <div>
                <h2 className="font-display text-lg font-bold text-white">
                  VeriWork Explainable Verification Engine
                </h2>

                <div className="text-xs text-slate-400">
                  Deterministic Integrity Protocol + Gemini 3.8 Multi-Artifact
                  Analysis
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">
                  Overall Integrity Score
                </span>

                <span className="text-xl font-bold font-mono text-cyan-300">
                  {score?.totalScore}/100
                </span>
              </div>

              <div
                className={`px-4 py-2 rounded-xl border text-sm font-bold font-mono ${
                  isVerified
                    ? "text-emerald-300 bg-emerald-950/40 border-emerald-700/80"
                    : isPartial
                      ? "text-amber-300 bg-amber-950/40 border-amber-700/80"
                      : "text-rose-300 bg-rose-950/40 border-rose-700/80"
                }`}
              >
                {task.verificationResult.verdict}
              </div>
            </div>
          </div>

          {/* ==========================================================
              SCORE BREAKDOWN
          ========================================================== */}
          {score && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-1">
                  Completeness
                </span>
                <div className="text-base font-bold text-slate-100 font-mono">
                  {score.completeness}%
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-1">
                  Uniqueness (Replay)
                </span>
                <div className="text-base font-bold text-slate-100 font-mono">
                  {score.uniqueness}%
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-1">
                  Timeline Causality
                </span>
                <div className="text-base font-bold text-slate-100 font-mono">
                  {score.timeline}%
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-1">
                  Metadata Alignment
                </span>
                <div className="text-base font-bold text-slate-100 font-mono">
                  {score.metadata}%
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-1">
                  Visual Delta
                </span>
                <div className="text-base font-bold text-slate-100 font-mono">
                  {score.crossEvidence}%
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-1">
                  MST Hash Anchor
                </span>
                <div className="text-base font-bold text-slate-100 font-mono">
                  {score.blockchainIntegrity}%
                </div>
              </div>
            </div>
          )}

          {/* ==========================================================
              AI EXPLANATION
          ========================================================== */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>VeriWork Explainability Synthesis</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line">
              {task.verificationResult.aiExplanation}
            </p>

            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-900 font-mono">
              Recommendation:{" "}
              <span className="text-slate-200">
                {task.verificationResult.recommendation}
              </span>
            </div>
          </div>

          {/* ==========================================================
              ANOMALIES
          ========================================================== */}
          {task.verificationResult.anomalies.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase text-rose-400 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4" />
                <span>
                  Flagged Anomalies ({task.verificationResult.anomalies.length})
                </span>
              </div>

              <div className="space-y-2.5">
                {task.verificationResult.anomalies.map((anom) => (
                  <div
                    key={anom.id}
                    className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-900/60 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-rose-300">
                          {anom.title}
                        </span>

                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-900 text-rose-200">
                          {anom.severity}
                        </span>
                      </div>

                      <p className="text-slate-300 leading-relaxed">
                        {anom.description}
                      </p>
                    </div>

                    {anom.conflictingTaskId && (
                      <button
                        type="button"
                        onClick={() => onNavigateToGraph(task.id)}
                        className="px-2.5 py-1 text-[11px] font-mono bg-rose-900/60 text-rose-200 rounded border border-rose-700/80 hover:bg-rose-800 transition-colors shrink-0 cursor-pointer self-start sm:self-center"
                      >
                        Inspect Conflict in Graph →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==========================================================
              DETERMINISTIC CHECKS
          ========================================================== */}
          <div className="space-y-3">
            <div className="text-xs font-mono uppercase text-slate-400">
              Deterministic Verification Checks
            </div>

            <div className="rounded-xl border border-slate-800 overflow-hidden text-xs overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 text-[11px] font-mono">
                  <tr>
                    <th className="py-2.5 px-4">Verification Check</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Score</th>
                    <th className="py-2.5 px-4">Result Details</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/80">
                  {task.verificationResult.checks.map((chk) => (
                    <tr key={chk.id} className="hover:bg-slate-950/40">
                      <td className="py-2.5 px-4 font-medium text-slate-200">
                        <div className="flex items-center gap-2">
                          {chk.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                          )}

                          <span>{chk.name}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-4 font-mono text-slate-400 text-[11px]">
                        {chk.category}
                      </td>

                      <td className="py-2.5 px-4 font-mono tabular-nums text-slate-200">
                        {chk.score}%
                      </td>

                      <td className="py-2.5 px-4 text-slate-300">
                        {chk.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          CANONICAL EVIDENCE PACKAGE
      ============================================================ */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <h2 className="font-display text-lg font-bold text-white">
              Canonical Evidence Package
            </h2>

            <p className="text-xs text-slate-400 mt-1">
              Off-chain evidence artifacts anchored by canonical SHA-256
              manifest.
            </p>
          </div>

          {task.evidencePackage && (
            <div className="text-xs font-mono text-cyan-300 bg-cyan-950/30 px-3 py-1.5 rounded-lg border border-cyan-900/60">
              PACKAGE ID: {task.evidencePackage.packageId}
            </div>
          )}
        </div>

        {task.evidencePackage ? (
          <div className="space-y-6">
            {/* Artifact Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {task.evidencePackage.evidenceItems.map((item) => {
                const isFlagged = task.verificationResult?.anomalies.some((a) =>
                  a.flaggedEvidenceIds?.includes(item.id),
                );

                return (
                  <EvidenceVisualCard
                    key={item.id}
                    item={item}
                    isFlagged={isFlagged}
                  />
                );
              })}
            </div>

            {/* Completion Declaration */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between items-center text-slate-400 font-mono text-[11px]">
                <span>FORMAL TECHNICIAN COMPLETION DECLARATION</span>

                <span>
                  Signed:{" "}
                  {task.evidencePackage.completionDeclaration.signedBy ||
                    "None"}
                </span>
              </div>

              <p className="text-slate-200 italic leading-relaxed">
                "
                {task.evidencePackage.completionDeclaration.statement ||
                  "No formal statement submitted."}
                "
              </p>

              <div className="flex flex-wrap gap-4 text-slate-400 pt-2 border-t border-slate-900 font-mono text-[11px]">
                <div>
                  Declared Hours:{" "}
                  <span className="text-slate-200">
                    {task.evidencePackage.completionDeclaration.hoursSpent} hrs
                  </span>
                </div>

                <div>
                  Materials:{" "}
                  <span className="text-slate-200">
                    {task.evidencePackage.completionDeclaration.materialsUsed.join(
                      ", ",
                    ) || "None declared"}
                  </span>
                </div>
              </div>
            </div>

            {/* SHA-256 Commitment */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-mono">
                  CANONICAL SHA-256 EVIDENCE DIGEST
                </span>

                <span className="text-purple-400 font-mono text-[11px]">
                  MST Commitment Status:{" "}
                  {task.blockchainCommitment?.state || "CONFIRMED"}
                </span>
              </div>

              <div className="font-mono text-xs text-cyan-300 bg-slate-900 p-2.5 rounded border border-slate-800 break-all select-all">
                {task.currentEvidenceHash}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs">
            No evidence package submitted yet. Technician must submit artifacts
            before verification can proceed.
          </div>
        )}
      </div>

      {/* ============================================================
          CHALLENGE / DISPUTE
      ============================================================ */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-purple-400" />

            <h3 className="font-display text-base font-bold text-white">
              Verification Challenge & Dispute History
            </h3>
          </div>

          {task.challenge ? (
            <span
              className={`text-xs font-mono px-2 py-0.5 rounded border ${
                task.challenge.status === "OPEN"
                  ? "text-rose-300 bg-rose-950/60 border-rose-800"
                  : "text-emerald-300 bg-emerald-950/60 border-emerald-800"
              }`}
            >
              DISPUTE: {task.challenge.status}
            </span>
          ) : (
            <span className="text-xs font-mono text-slate-500">
              NO ACTIVE CHALLENGE
            </span>
          )}
        </div>

        {task.challenge ? (
          <div className="p-4 rounded-xl bg-slate-950/70 border border-purple-900/50 space-y-3 text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span>
                Challenged by:{" "}
                <span className="text-slate-200">
                  {task.challenge.challenger} ({task.challenge.challengerRole})
                </span>
              </span>

              <span className="font-mono">
                {new Date(task.challenge.challengedAt).toLocaleString()}
              </span>
            </div>

            <div className="text-slate-300">
              <span className="text-slate-500 block mb-0.5">
                Dispute Reason:
              </span>
              "{task.challenge.reason}"
            </div>

            {task.challenge.status === "RESOLVED" && (
              <div className="pt-2 border-t border-slate-900 text-slate-300">
                <span className="text-emerald-400 block mb-0.5">
                  Resolution Notes ({task.challenge.resolvedBy}):
                </span>

                {task.challenge.resolutionNotes}
              </div>
            )}

            {task.challenge.status === "OPEN" && currentRole === "AUDITOR" && (
              <div className="pt-3 border-t border-slate-900 space-y-2">
                <span className="text-slate-400 block">
                  Auditor Resolution:
                </span>

                <input
                  type="text"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Enter formal audit resolution findings..."
                  className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                />

                <button
                  type="button"
                  onClick={() => {
                    if (!resolutionNotes.trim()) return;

                    setIsResolving(true);

                    onResolveChallenge(task.id, resolutionNotes);

                    setResolutionNotes("");
                    setIsResolving(false);
                  }}
                  disabled={isResolving || !resolutionNotes.trim()}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Resolve Dispute on MST
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-slate-400">
            <p>
              If an auditor or facility manager detects inconsistency in
              physical evidence, a cryptographic challenge can be raised against
              this claim.
            </p>

            {(currentRole === "FACILITY_MANAGER" ||
              currentRole === "AUDITOR") && (
              <button
                type="button"
                onClick={() => setIsChallenging(!isChallenging)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ml-4"
              >
                Challenge Verification
              </button>
            )}
          </div>
        )}

        {isChallenging && !task.challenge && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs animate-fade-in">
            <span className="font-semibold text-slate-200 block">
              State Dispute Grounds:
            </span>

            <textarea
              rows={2}
              value={challengeReason}
              onChange={(e) => setChallengeReason(e.target.value)}
              placeholder="e.g. After-photo shows inconsistent flange color; physical site review indicates residual moisture..."
              className="w-full p-2.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsChallenging(false);
                  setChallengeReason("");
                }}
                className="px-3 py-1.5 text-slate-400 hover:text-slate-200 text-xs"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  const reason = challengeReason.trim();

                  if (!reason) return;

                  onChallengeTask(task.id, reason);

                  setChallengeReason("");
                  setIsChallenging(false);
                }}
                disabled={!challengeReason.trim()}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg cursor-pointer"
              >
                Submit Challenge to MST
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================
          AUDIT TRAIL
      ============================================================ */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />

            <h3 className="font-display text-base font-bold text-white">
              Immutable-Style Audit Trail
            </h3>
          </div>

          <span className="text-xs font-mono text-slate-400">
            {task.auditHistory.length} Recorded Events
          </span>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {task.auditHistory.map((evt, idx) => (
            <div key={evt.id || idx} className="relative group text-xs">
              <div className="absolute -left-[1.8rem] top-1 w-3 h-3 rounded-full bg-slate-800 border-2 border-cyan-500 group-hover:scale-125 transition-transform" />

              <div className="flex items-baseline justify-between gap-4">
                <span className="font-semibold text-slate-200 text-sm">
                  {evt.action}
                </span>

                <span className="text-[11px] font-mono text-slate-400 shrink-0">
                  {new Date(evt.timestamp).toLocaleString()}
                </span>
              </div>

              <p className="text-slate-300 mt-1 leading-relaxed">
                {evt.description}
              </p>

              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 mt-1.5">
                <span>
                  Actor: {evt.actor} ({evt.actorRole})
                </span>

                {evt.blockchainTxRef && (
                  <span className="text-purple-400 flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" />
                    Tx: {evt.blockchainTxRef.slice(0, 10)}...
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
