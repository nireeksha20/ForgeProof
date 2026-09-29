import React, { useState } from 'react';
import { EvidenceItem } from '../types/veriwork';
import { ShieldCheck, AlertTriangle, Eye, Hash, Calendar, User, Cpu, Camera } from 'lucide-react';

interface EvidenceVisualCardProps {
  item: EvidenceItem;
  isFlagged?: boolean;
  onInspect?: () => void;
}

export const EvidenceVisualCard: React.FC<EvidenceVisualCardProps> = ({ item, isFlagged, onInspect }) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'metadata'>('visual');

  const isBefore = item.type === 'BEFORE_PHOTO';
  const isAfter = item.type === 'AFTER_PHOTO';
  const isId = item.type === 'TECHNICIAN_ID';
  const isTime = item.type === 'TIMESTAMP_PROOF';
  const isDeclaration = item.type === 'COMPLETION_DECLARATION';

  return (
    <div className={`rounded-xl border transition-all duration-200 overflow-hidden bg-slate-900/60 ${
      isFlagged 
        ? 'border-rose-500/70 shadow-lg shadow-rose-950/20' 
        : 'border-slate-800 hover:border-slate-700'
    }`}>
      {/* Header bar */}
      <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-2">
          {isFlagged ? (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="text-sm font-semibold text-slate-200 truncate">{item.label}</span>
        </div>
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab('visual')}
            className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
              activeTab === 'visual' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Proof
          </button>
          <button
            onClick={() => setActiveTab('metadata')}
            className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
              activeTab === 'metadata' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Meta
          </button>
        </div>
      </div>

      {/* Main Preview */}
      <div className="p-4">
        {activeTab === 'visual' ? (
          <div className="space-y-3">
            {/* Visual simulation canvas / styled SVG container */}
            <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden border border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-900 to-[#0a0e17] flex flex-col items-center justify-center p-3 text-center">
              {/* Telemetry watermark overlay */}
              <div className="absolute top-2 left-2 right-2 flex justify-between items-center text-[10px] font-mono text-cyan-400/80">
                <span>VERIWORK AUDIT CAPTURE</span>
                <span>SHA-256: {item.fileHash.slice(0, 8)}...</span>
              </div>

              {/* Graphic / Real Image Representation */}
              {item.dataUrl ? (
                <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden py-4">
                  <img
                    src={item.dataUrl}
                    alt={item.label}
                    className="max-h-[140px] max-w-full object-contain rounded border border-slate-800 shadow-md"
                  />
                  {item.metadata.originalFilename && (
                    <span className="text-[10px] font-mono text-cyan-400 mt-1 truncate max-w-[90%]">
                      {item.metadata.originalFilename}
                    </span>
                  )}
                </div>
              ) : (
                <>
                  {isBefore && (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-rose-950/40 border border-rose-500/40 flex items-center justify-center mb-2">
                        <Camera className="w-8 h-8 text-rose-400 animate-pulse" />
                      </div>
                      <span className="text-xs font-medium text-rose-300">PRE-MAINTENANCE STATE (BEFORE)</span>
                      <span className="text-[11px] text-slate-400 mt-1 max-w-[220px]">
                        Active leak / wear pattern recorded with calibrated optics
                      </span>
                      {item.metadata.readings?.pressureLeakPsi !== undefined && (
                        <div className="mt-2 text-xs font-mono text-amber-300 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-800/50">
                          LEAK RATE: {item.metadata.readings.pressureLeakPsi} PSI DROP
                        </div>
                      )}
                    </div>
                  )}

                  {isAfter && (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-center mb-2">
                        <ShieldCheck className="w-8 h-8 text-emerald-400" />
                      </div>
                      <span className="text-xs font-medium text-emerald-300">POST-REPAIR STATE (AFTER)</span>
                      <span className="text-[11px] text-slate-400 mt-1 max-w-[220px]">
                        Remediated assembly inspected & pressure tested
                      </span>
                      {item.metadata.readings?.operatingPressurePsi !== undefined && (
                        <div className="mt-2 text-xs font-mono text-emerald-300 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-800/50">
                          OPERATING: {item.metadata.readings.operatingPressurePsi} PSI NOMINAL
                        </div>
                      )}
                    </div>
                  )}

                  {isId && (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-center mb-2">
                        <User className="w-8 h-8 text-cyan-400" />
                      </div>
                      <span className="text-xs font-medium text-cyan-300">NFC CREDENTIAL PROOF</span>
                      <span className="text-[11px] text-slate-400 mt-1 max-w-[220px]">
                        Hardware-signed digital badge ID
                      </span>
                      <div className="mt-2 text-[11px] font-mono text-cyan-200 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/50">
                        UID: {item.metadata.readings?.badgeId || 'CERT-NFC-V2'}
                      </div>
                    </div>
                  )}

                  {isTime && (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-amber-950/40 border border-amber-500/40 flex items-center justify-center mb-2">
                        <Calendar className="w-8 h-8 text-amber-400" />
                      </div>
                      <span className="text-xs font-medium text-amber-300">RFC 3161 TIMESTAMP</span>
                      <span className="text-[11px] text-slate-400 mt-1 max-w-[220px]">
                        Cryptographic time-lock attestation
                      </span>
                      <div className="mt-2 text-[10px] font-mono text-slate-300">
                        NTP Stratum-1 Verified
                      </div>
                    </div>
                  )}

                  {isDeclaration && (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-indigo-950/40 border border-indigo-500/40 flex items-center justify-center mb-2">
                        <Cpu className="w-8 h-8 text-indigo-400" />
                      </div>
                      <span className="text-xs font-medium text-indigo-300">SIGN-OFF ATTESTATION</span>
                      <span className="text-[11px] text-slate-400 mt-1 max-w-[220px]">
                        Contractor completion declaration
                      </span>
                      <div className="mt-2 text-[10px] font-mono text-indigo-300 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-800/50">
                        Digital Signature Verified
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Bottom timestamp overlay */}
              <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[10px] font-mono text-slate-400">
                <span>CAPTURED: {new Date(item.metadata.capturedAt).toLocaleTimeString()}</span>
                <span>{item.metadata.deviceModel || 'Secured Terminal'}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
          </div>
        ) : (
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Artifact ID</span>
              <span className="font-mono text-slate-200">{item.id}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Type</span>
              <span className="text-slate-200">{item.type}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Captured By</span>
              <span className="text-slate-200">{item.metadata.capturedBy}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Timestamp</span>
              <span className="font-mono text-slate-200">{new Date(item.metadata.capturedAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">File Size</span>
              <span className="text-slate-200">{item.metadata.fileSizeKb} KB ({item.metadata.mimeType})</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">SHA-256 Digest</span>
              <div className="font-mono text-[11px] text-cyan-300 bg-slate-950/70 p-2 rounded border border-slate-800 break-all select-all">
                {item.fileHash}
              </div>
            </div>
            {item.perceptualHash && (
              <div>
                <span className="text-slate-400 block mb-1">Perceptual Hash (pHash)</span>
                <div className="font-mono text-[11px] text-amber-300 bg-slate-950/70 p-1.5 rounded border border-slate-800 break-all select-all">
                  {item.perceptualHash}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Flag alert footer if flagged */}
      {isFlagged && (
        <div className="px-4 py-2 bg-rose-950/50 border-t border-rose-900/50 flex items-center justify-between text-xs text-rose-300">
          <span className="font-semibold">⚠️ Flagged by Replay Engine</span>
          <span className="text-[11px] text-rose-400">Investigate in Graph</span>
        </div>
      )}
    </div>
  );
};
