import React, { useState } from 'react';
import { MaintenanceTask, TaskStatus, PriorityLevel, UserRole } from '../types/veriwork';
import { 
  Plus, 
  Search, 
  Filter, 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  Clock, 
  ArrowRight,
  Link2
} from 'lucide-react';

interface TaskListProps {
  tasks: MaintenanceTask[];
  onSelectTask: (taskId: string) => void;
  onOpenCreateModal: () => void;
  currentRole: UserRole;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onSelectTask,
  onOpenCreateModal,
  currentRole,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = 
      task.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.assignedTechnician?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="font-display text-2xl font-bold text-white tracking-tight">
            Physical Maintenance Claims Registry
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Auditable maintenance claims, evidence packages, and verified state transitions.
          </p>
        </div>

        {/* Manager role can create tasks */}
        {currentRole === 'FACILITY_MANAGER' && (
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-md shadow-cyan-900/40 transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Maintenance Task</span>
          </button>
        )}
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Task ID, title, asset, technician..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-slate-900/80 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="CREATED">CREATED</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="EVIDENCE_SUBMITTED">EVIDENCE_SUBMITTED</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="PARTIAL">PARTIAL</option>
            <option value="SUSPICIOUS">SUSPICIOUS</option>
            <option value="CLOSED">CLOSED</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-900 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      {/* Task Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4">Task ID</th>
                <th className="py-3 px-4">Title & Problem</th>
                <th className="py-3 px-4">Asset & Location</th>
                <th className="py-3 px-4">Technician</th>
                <th className="py-3 px-4">Workflow State</th>
                <th className="py-3 px-4">Integrity / Verdict</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">
                    No maintenance claims match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const isVerified = task.status === 'VERIFIED';
                  const isPartial = task.status === 'PARTIAL';
                  const isSuspicious = task.status === 'SUSPICIOUS';
                  const score = task.verificationResult?.integrityScore.totalScore;

                  return (
                    <tr
                      key={task.id}
                      onClick={() => onSelectTask(task.id)}
                      className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    >
                      {/* Task ID */}
                      <td className="py-3.5 px-4 font-mono font-medium text-cyan-300">
                        {task.id}
                      </td>

                      {/* Title */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors truncate">
                          {task.title}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {task.description}
                        </div>
                      </td>

                      {/* Asset */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-slate-200 truncate">{task.asset.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{task.asset.location}</div>
                      </td>

                      {/* Technician */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-slate-200">
                          {task.assignedTechnician ? task.assignedTechnician.name : <span className="text-slate-500 italic">Unassigned</span>}
                        </div>
                        {task.assignedTechnician && (
                          <div className="text-[11px] text-slate-400 font-mono">{task.assignedTechnician.id}</div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border ${
                          isVerified 
                            ? 'text-emerald-300 bg-emerald-950/40 border-emerald-800/60'
                            : isPartial 
                            ? 'text-amber-300 bg-amber-950/40 border-amber-800/60'
                            : isSuspicious 
                            ? 'text-rose-300 bg-rose-950/40 border-rose-800/60'
                            : 'text-slate-300 bg-slate-800/60 border-slate-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isVerified ? 'bg-emerald-400' : isPartial ? 'bg-amber-400' : isSuspicious ? 'bg-rose-400' : 'bg-slate-400'
                          }`} />
                          {task.status}
                        </span>
                      </td>

                      {/* Verification Verdict */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {task.verificationResult ? (
                          <div>
                            <span className="font-semibold text-slate-200 font-mono">
                              {task.verificationResult.verdict}
                            </span>
                            <div className="text-[11px] font-mono text-slate-400 tabular-nums">
                              Score: {score}/100 · Conf: {task.verificationResult.confidence}%
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">Pending verification</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="text-xs font-medium text-cyan-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                          Investigate <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
