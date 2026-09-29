import React, { useState } from 'react';
import { PriorityLevel, RequiredEvidenceType } from '../types/veriwork';
import { X, Plus, Check } from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (data: {
    title: string;
    description: string;
    assetId: string;
    priority: PriorityLevel;
    requiredActions: string[];
    requiredEvidenceTypes: RequiredEvidenceType[];
  }) => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onCreateTask,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assetId, setAssetId] = useState('ASSET-PUMP-07');
  const [priority, setPriority] = useState<PriorityLevel>('HIGH');
  const [actionsText, setActionsText] = useState(
    'Inspect leakage source\nDisassemble flange coupling\nReplace deteriorated gasket seal\nPerform 30-min hydrostatic pressure test'
  );
  const [selectedEvidenceTypes, setSelectedEvidenceTypes] = useState<RequiredEvidenceType[]>([
    'BEFORE_PHOTO',
    'AFTER_PHOTO',
    'TECHNICIAN_ID',
    'TIMESTAMP_PROOF',
    'COMPLETION_DECLARATION',
  ]);

  if (!isOpen) return null;

  const toggleEvidenceType = (t: RequiredEvidenceType) => {
    if (selectedEvidenceTypes.includes(t)) {
      setSelectedEvidenceTypes(selectedEvidenceTypes.filter((x) => x !== t));
    } else {
      setSelectedEvidenceTypes([...selectedEvidenceTypes, t]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const requiredActions = actionsText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    onCreateTask({
      title,
      description,
      assetId,
      priority,
      requiredActions,
      requiredEvidenceTypes: selectedEvidenceTypes,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0e1422] border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <h2 className="font-display text-base font-bold text-white">
            Create Physical Maintenance Task
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
          
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Task Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Hydraulic Cylinder Pressure Valve Servicing"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Target Asset</label>
            <select
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="ASSET-PUMP-07">Primary Chilled Water Booster Pump #7 (Engineering Block 4)</option>
              <option value="ASSET-HVAC-12">Rooftop Air Handling Unit AHU-12 (Science Tower)</option>
              <option value="ASSET-ELEV-03">High-Speed Traction Hoist Motor - Car #3 (Executive Plaza)</option>
              <option value="ASSET-FIRE-09">Co2 Fire Suppression System & Extinguisher Bank (Tech Pavilion)</option>
              <option value="ASSET-ELEC-44">Main Substation Busway & Distribution Conduit (Substation Yard)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Description / Problem Statement</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail the physical malfunction, observed symptoms, or scheduled maintenance interval..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Required Actions Checklist (One per line)</label>
            <textarea
              rows={3}
              value={actionsText}
              onChange={(e) => setActionsText(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-2">Required Evidence Types</label>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {[
                { type: 'BEFORE_PHOTO', label: 'Before Photograph' },
                { type: 'AFTER_PHOTO', label: 'After Photograph' },
                { type: 'TECHNICIAN_ID', label: 'NFC Badge Identity Proof' },
                { type: 'TIMESTAMP_PROOF', label: 'RFC 3161 NTP Timestamp' },
                { type: 'COMPLETION_DECLARATION', label: 'Signed Completion Declaration' },
                { type: 'SENSOR_TELEMETRY', label: 'Physical Sensor Telemetry' },
              ].map((ev) => {
                const isSelected = selectedEvidenceTypes.includes(ev.type as RequiredEvidenceType);
                return (
                  <button
                    type="button"
                    key={ev.type}
                    onClick={() => toggleEvidenceType(ev.type as RequiredEvidenceType)}
                    className={`p-2 rounded-lg border text-left flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-cyan-950/50 border-cyan-700/80 text-cyan-200' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{ev.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg shadow-md transition-colors cursor-pointer"
            >
              Register on MST
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
