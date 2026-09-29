import React, { useState, useEffect } from "react";
import {
  MaintenanceTask,
  UserRole,
  DashboardMetrics,
  CanonicalEvidencePackage,
} from "./types/veriwork";
import { Header } from "./components/Header";
import { HeroLanding } from "./components/HeroLanding";
import { DashboardOverview } from "./components/DashboardOverview";
import { TaskList } from "./components/TaskList";
import { TaskInvestigation } from "./components/TaskInvestigation";
import { EvidenceGraphView } from "./components/EvidenceGraphView";
import { TamperLab } from "./components/TamperLab";
import { MstExplorer } from "./components/MstExplorer";
import { DemoScenariosModal } from "./components/DemoScenariosModal";
import { CreateTaskModal } from "./components/CreateTaskModal";
import { SubmitEvidenceModal } from "./components/SubmitEvidenceModal";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function App() {
  const [currentTab, setCurrentTab] = useState<
    | "landing"
    | "overview"
    | "tasks"
    | "investigation"
    | "graph"
    | "tamper"
    | "blockchain"
  >("landing");

  const [currentRole, setCurrentRole] = useState<UserRole>("FACILITY_MANAGER");

  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("TASK-1042");

  // Modals
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitEvidenceModalOpen, setIsSubmitEvidenceModalOpen] =
    useState(false);

  // Notification Banner
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "alert";
  } | null>(null);

  // Live MST transaction status
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const showNotification = (
    message: string,
    type: "success" | "alert" = "success",
  ) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  /**
   * Wraps real backend/blockchain actions with a visible MST status.
   *
   * This does NOT simulate blockchain confirmation.
   * The request still waits for the real MST transaction/receipt.
   */
  const runWithBlockchainStatus = async <T,>(
    action: () => Promise<T>,
    initialMessage: string,
  ): Promise<T> => {
    setPendingAction(initialMessage);

    const confirmationTimer = window.setTimeout(() => {
      setPendingAction("Waiting for MST confirmation...");
    }, 900);

    try {
      return await action();
    } finally {
      window.clearTimeout(confirmationTimer);
      setPendingAction(null);
    }
  };

  // Fetch initial tasks & metrics
  const refreshData = async () => {
    try {
      const [tasksRes, statsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/stats"),
      ]);

      const tasksJson = await tasksRes.json();
      const statsJson = await statsRes.json();

      if (tasksJson.success) {
        setTasks(tasksJson.tasks);
      }

      if (statsJson.success) {
        setMetrics(statsJson.metrics);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];

  // Action: Select Task and open Investigation
  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setCurrentTab("investigation");
  };

  // Action: Run Guided Demo Scenario
  const handleSelectScenario = async (scenarioId: string) => {
    try {
      const res = await fetch("/api/demo/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId }),
      });

      const json = await res.json();

      if (json.success) {
        await refreshData();
        setSelectedTaskId(json.targetTaskId);

        if (scenarioId === "5" || scenarioId === "TAMPER_ATTACK") {
          setCurrentTab("tamper");
          showNotification(
            "Activated Scenario 5: Tampering Attack Simulated",
            "alert",
          );
        } else {
          setCurrentTab("investigation");
          showNotification(
            `Activated Scenario: ${json.task?.title || "Loaded"}`,
          );
        }
      } else {
        showNotification(json.error || "Failed to activate scenario", "alert");
      }
    } catch (err) {
      console.error("Failed to trigger scenario:", err);
      showNotification("Failed to activate scenario", "alert");
    }
  };

  // Action: Assign Task
  const handleAssignTask = async (taskId: string, technicianId: string) => {
    try {
      const res = await runWithBlockchainStatus(
        () =>
          fetch(`/api/tasks/${taskId}/assign`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ technicianId }),
          }),
        "Recording task assignment on MST...",
      );

      const json = await res.json();

      if (json.success) {
        await refreshData();

        showNotification(
          `Task ${taskId} assigned. Tx anchored on MST: ${json.txHash?.slice(
            0,
            12,
          )}...`,
        );
      } else {
        showNotification(json.error || "Failed to assign task", "alert");
      }
    } catch (err) {
      console.error(err);
      showNotification("Failed to assign task", "alert");
    }
  };

  // Action: Start Task
  const handleStartTask = async (taskId: string) => {
    try {
      const res = await runWithBlockchainStatus(
        () =>
          fetch(`/api/tasks/${taskId}/start`, {
            method: "POST",
          }),
        "Recording on-site start on MST...",
      );

      const json = await res.json();

      if (json.success) {
        await refreshData();

        showNotification(
          "Technician checked in on-site. Work marked IN_PROGRESS on MST.",
        );
      } else {
        showNotification(json.error || "Failed to start task", "alert");
      }
    } catch (err) {
      console.error(err);
      showNotification("Failed to start task", "alert");
    }
  };

  // Action: Submit Evidence
  const handleSubmitEvidence = async (
    taskId: string,
    pkg: CanonicalEvidencePackage,
  ) => {
    try {
      const res = await runWithBlockchainStatus(
        () =>
          fetch(`/api/tasks/${taskId}/evidence`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ evidencePackage: pkg }),
          }),
        "Submitting evidence commitment to MST...",
      );

      const json = await res.json();

      if (json.success) {
        await refreshData();

        showNotification(
          `Canonical evidence package committed & anchored on MST Block #${json.commitment?.blockNumber}.`,
        );
      } else {
        showNotification(json.error || "Failed to submit evidence", "alert");
      }
    } catch (err) {
      console.error(err);
      showNotification("Evidence submission failed", "alert");
    }
  };

  // Action: Run Verification Engine
  const handleVerifyTask = async (taskId: string) => {
    try {
      showNotification("Executing VeriWork Verification Engine...", "success");

      const res = await runWithBlockchainStatus(
        () =>
          fetch(`/api/tasks/${taskId}/verify`, {
            method: "POST",
          }),
        "Submitting verification to MST...",
      );

      const json = await res.json();

      if (json.success) {
        await refreshData();

        const verdict = json.verificationResult.verdict;

        showNotification(
          `Verification Complete: ${verdict} (Score: ${json.verificationResult.integrityScore.totalScore}/100)`,
          verdict === "SUSPICIOUS" ? "alert" : "success",
        );
      } else {
        showNotification(json.error || "Verification failed", "alert");
      }
    } catch (err) {
      console.error(err);
      showNotification("Verification request failed", "alert");
    }
  };

  // Action: Challenge Task
  const handleChallengeTask = async (taskId: string, reason: string) => {
    try {
      const res = await runWithBlockchainStatus(
        () =>
          fetch(`/api/tasks/${taskId}/challenge`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason }),
          }),
        "Recording verification challenge on MST...",
      );

      const json = await res.json();

      if (json.success) {
        await refreshData();

        showNotification(
          "Verification challenge raised and recorded on MST.",
          "alert",
        );
      } else {
        showNotification(json.error || "Failed to raise challenge", "alert");
      }
    } catch (err) {
      console.error(err);
      showNotification("Failed to raise verification challenge", "alert");
    }
  };

  // Action: Resolve Challenge
  const handleResolveChallenge = async (taskId: string, notes: string) => {
    try {
      const res = await runWithBlockchainStatus(
        () =>
          fetch(`/api/tasks/${taskId}/resolve-challenge`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resolutionNotes: notes }),
          }),
        "Recording challenge resolution on MST...",
      );

      const json = await res.json();

      if (json.success) {
        await refreshData();

        showNotification("Challenge dispute resolved and logged on MST.");
      } else {
        showNotification(json.error || "Failed to resolve challenge", "alert");
      }
    } catch (err) {
      console.error(err);
      showNotification("Failed to resolve challenge", "alert");
    }
  };

  // Action: Close Task
  const handleCloseTask = async (taskId: string) => {
    try {
      const res = await runWithBlockchainStatus(
        () =>
          fetch(`/api/tasks/${taskId}/close`, {
            method: "POST",
          }),
        "Recording task closure on MST...",
      );

      const json = await res.json();

      if (json.success) {
        await refreshData();

        showNotification(`Task ${taskId} formally closed and archived on MST.`);
      } else {
        showNotification(json.error || "Failed to close task", "alert");
      }
    } catch (err) {
      console.error(err);
      showNotification("Failed to close task", "alert");
    }
  };

  // Action: Tamper Task (Simulation)
  const handleTamperTask = async (taskId: string, field: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/tamper`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldToTamper: field }),
      });

      const json = await res.json();

      if (json.success) {
        await refreshData();

        showNotification(
          `Tamper simulated: Field "${field}" altered. SHA-256 mismatch detected!`,
          "alert",
        );
      } else {
        showNotification(json.error || "Failed to simulate tampering", "alert");
      }
    } catch (err) {
      console.error(err);
      showNotification("Failed to simulate tampering", "alert");
    }
  };

  // Action: Restore Task
  const handleRestoreTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/restore`, {
        method: "POST",
      });

      const json = await res.json();

      if (json.success) {
        await refreshData();

        showNotification(
          "Evidence package restored to pristine verified state.",
        );
      } else {
        showNotification(json.error || "Failed to restore task", "alert");
      }
    } catch (err) {
      console.error(err);
      showNotification("Failed to restore evidence package", "alert");
    }
  };

  // Action: Create Task
  const handleCreateTask = async (data: any) => {
    try {
      const res = await runWithBlockchainStatus(
        () =>
          fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }),
        "Creating task and anchoring on MST...",
      );

      const json = await res.json();

      if (json.success) {
        await refreshData();

        setSelectedTaskId(json.task.id);
        setCurrentTab("investigation");

        showNotification(
          `Created ${json.task.id}. Initial state anchored on MST block.`,
        );
      } else {
        showNotification(json.error || "Failed to create task", "alert");
      }
    } catch (err) {
      console.error(err);
      showNotification("Failed to create task", "alert");
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        currentRole={currentRole}
        onChangeRole={(role) => setCurrentRole(role)}
        onOpenDemoModal={() => setIsDemoModalOpen(true)}
      />

      {/* Live MST Transaction Status */}
      {pendingAction && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-cyan-500/30 bg-slate-950/95 backdrop-blur-xl shadow-2xl shadow-cyan-950/30">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />

            <div>
              <div className="text-[10px] font-semibold tracking-wider text-cyan-300">
                MST TESTNET
              </div>

              <div className="text-sm text-slate-200">{pendingAction}</div>
            </div>

            <div className="ml-2 w-4 h-4 border-2 border-slate-600 border-t-cyan-400 rounded-full animate-spin" />
          </div>
        </div>
      )}

      {/* Dynamic Alert/Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`p-4 rounded-xl shadow-2xl border flex items-center gap-3 text-xs font-medium ${
              notification.type === "alert"
                ? "bg-rose-950/95 border-rose-600 text-rose-200 shadow-rose-950/40"
                : "bg-emerald-950/95 border-emerald-600 text-emerald-200 shadow-emerald-950/40"
            }`}
          >
            {notification.type === "alert" ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}

            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Viewport Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === "landing" && (
          <HeroLanding
            onOpenApp={() => setCurrentTab("overview")}
            onOpenDemo={(scenarioId) => handleSelectScenario(scenarioId)}
          />
        )}

        {currentTab === "overview" && (
          <DashboardOverview
            metrics={metrics}
            tasks={tasks}
            onSelectTask={(id) => handleSelectTask(id)}
            onOpenDemo={(scenarioId) => handleSelectScenario(scenarioId)}
            onNavigateToTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === "tasks" && (
          <TaskList
            tasks={tasks}
            onSelectTask={(id) => handleSelectTask(id)}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            currentRole={currentRole}
          />
        )}

        {currentTab === "investigation" && selectedTask && (
          <TaskInvestigation
            task={selectedTask}
            currentRole={currentRole}
            onBack={() => setCurrentTab("tasks")}
            onAssignTask={handleAssignTask}
            onStartTask={handleStartTask}
            onSubmitEvidence={(id) => {
              setSelectedTaskId(id);
              setIsSubmitEvidenceModalOpen(true);
            }}
            onVerifyTask={handleVerifyTask}
            onChallengeTask={handleChallengeTask}
            onResolveChallenge={handleResolveChallenge}
            onCloseTask={handleCloseTask}
            onNavigateToGraph={(id) => {
              setSelectedTaskId(id);
              setCurrentTab("graph");
            }}
            onNavigateToTamper={(id) => {
              setSelectedTaskId(id);
              setCurrentTab("tamper");
            }}
            onNavigateToBlockchain={() => setCurrentTab("blockchain")}
          />
        )}

        {currentTab === "graph" && (
          <EvidenceGraphView
            tasks={tasks}
            selectedTaskId={selectedTaskId}
            onSelectTaskId={(id) => setSelectedTaskId(id)}
          />
        )}

        {currentTab === "tamper" && (
          <TamperLab
            tasks={tasks}
            selectedTaskId={selectedTaskId}
            onSelectTaskId={(id) => setSelectedTaskId(id)}
            onTamperTask={handleTamperTask}
            onRestoreTask={handleRestoreTask}
          />
        )}

        {currentTab === "blockchain" && <MstExplorer />}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950/70 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-slate-400">
              VERIWORK
            </span>

            <span>·</span>

            <span>
              Evidence-Based Verification of Physical Maintenance Claims
            </span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>MST EVM Consensus</span>
            <span>·</span>
            <span>SHA-256 Canonical Digests</span>
            <span>·</span>
            <span>Zero-Trust Physical Audit</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <DemoScenariosModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onSelectScenario={handleSelectScenario}
      />

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateTask={handleCreateTask}
      />

      {selectedTask && (
        <SubmitEvidenceModal
          task={selectedTask}
          isOpen={isSubmitEvidenceModalOpen}
          onClose={() => setIsSubmitEvidenceModalOpen(false)}
          onSubmit={handleSubmitEvidence}
        />
      )}
    </div>
  );
}
