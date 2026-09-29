import React from "react";
import { UserRole } from "../types/veriwork";
import { Shield, Sparkles, Database, PlayCircle } from "lucide-react";

interface HeaderProps {
  currentTab:
    | "overview"
    | "tasks"
    | "investigation"
    | "graph"
    | "tamper"
    | "blockchain"
    | "landing";
  onSelectTab: (
    tab:
      | "overview"
      | "tasks"
      | "investigation"
      | "graph"
      | "tamper"
      | "blockchain"
      | "landing",
  ) => void;
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  onOpenDemoModal: () => void;
  hasOpenChallenges?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  currentRole,
  onChangeRole,
  onOpenDemoModal,
  hasOpenChallenges,
}) => {
  const roleLabels: Record<UserRole, { title: string; badge: string }> = {
    FACILITY_MANAGER: { title: "Facility Manager", badge: "Elena Rostova" },
    TECHNICIAN: { title: "Contractor Technician", badge: "Marcus Vance" },
    AUDITOR: { title: "Independent Auditor", badge: "Dr. Aris Thorne" },
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0b0f17]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark (Display Face) */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onSelectTab("landing")}
            title="Return to VeriWork homepage"
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Shield className="w-4 h-4 text-white" />
            </div>

            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-xl tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                VERIWORK
              </span>

              <span className="hidden lg:inline text-[9px] font-semibold tracking-widest text-slate-500 border border-slate-700 rounded px-1.5 py-0.5 group-hover:text-cyan-400 group-hover:border-cyan-800 transition-colors">
                HOME
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onSelectTab("overview")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                currentTab === "overview"
                  ? "text-cyan-300 bg-slate-900 border border-slate-800"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => onSelectTab("tasks")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                currentTab === "tasks" || currentTab === "investigation"
                  ? "text-cyan-300 bg-slate-900 border border-slate-800"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Claims Registry
            </button>
            <button
              onClick={() => onSelectTab("graph")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                currentTab === "graph"
                  ? "text-cyan-300 bg-slate-900 border border-slate-800"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Evidence Graph
            </button>
            <button
              onClick={() => onSelectTab("tamper")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors relative ${
                currentTab === "tamper"
                  ? "text-rose-300 bg-slate-900 border border-slate-800"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Tamper Lab
              <span className="ml-1 px-1 py-0.2 text-[9px] bg-rose-950/70 border border-rose-800 text-rose-300 rounded font-mono">
                DEMO
              </span>
            </button>
            <button
              onClick={() => onSelectTab("blockchain")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                currentTab === "blockchain"
                  ? "text-cyan-300 bg-slate-900 border border-slate-800"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              MST Explorer
            </button>
          </nav>
        </div>

        {/* Zone 3: 1-2 primary actions & Role Switcher */}
        <div className="flex items-center gap-3">
          {/* Quick Demo Scenario Runner Button */}
          <button
            onClick={onOpenDemoModal}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg shadow-md shadow-cyan-900/30 transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Run Demo Scenarios</span>
          </button>

          {/* Role selector dropdown */}
          <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            <span className="text-[11px] text-slate-500 px-2 hidden sm:inline">
              Role:
            </span>
            <select
              value={currentRole}
              onChange={(e) => onChangeRole(e.target.value as UserRole)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option
                value="FACILITY_MANAGER"
                className="bg-slate-900 text-slate-200"
              >
                Facility Manager (Elena)
              </option>
              <option
                value="TECHNICIAN"
                className="bg-slate-900 text-slate-200"
              >
                Technician (Marcus)
              </option>
              <option value="AUDITOR" className="bg-slate-900 text-slate-200">
                Auditor (Dr. Thorne)
              </option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
