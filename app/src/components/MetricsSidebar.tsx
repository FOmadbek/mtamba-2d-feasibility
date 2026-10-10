import { Download, Eye, RotateCcw } from 'lucide-react';
import type { InferenceResult } from '../App';

interface MetricsSidebarProps {
  result: InferenceResult;
  onReset: () => void;
}

export default function MetricsSidebar({ result, onReset }: MetricsSidebarProps) {
  const idh = result.idh;

  return (
    <aside className="w-[280px] border-l border-[#e5e7eb] bg-white flex flex-col shrink-0 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-4">
          Analysis Results
        </h2>

        {/* IDH Status */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#0284c7]">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider">IDH Status</p>
            <p className={`text-xl font-semibold mt-0.5 ${idh.prediction === 'mutant' ? 'text-red-600' : 'text-green-600'}`}>
              {idh.prediction === 'mutant' ? 'Mutant' : 'Wildtype'}
            </p>
            <p className="text-xs text-[#6b7280] mt-0.5">
              Prob: {(idh.probability * 100).toFixed(1)}% · Conf: {(idh.confidence * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Triage */}
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${idh.triage === 'accept' ? 'bg-green-50' : 'bg-amber-50'}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={idh.triage === 'accept' ? 'text-green-600' : 'text-amber-600'}>
              <circle cx="12" cy="12" r="10" />
              {idh.triage === 'accept' ? (
                <path d="M8 12l2.5 2.5L16 9" />
              ) : (
                <path d="M12 8v4m0 4h.01" />
              )}
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider">Triage</p>
            <p className={`text-xl font-semibold mt-0.5 ${idh.triage === 'accept' ? 'text-green-600' : 'text-amber-600'}`}>
              {idh.triage === 'accept' ? 'Auto-accept' : 'Refer'}
            </p>
            <p className="text-xs text-[#6b7280] mt-0.5">
              {idh.triage === 'accept' ? 'High confidence case' : 'Send to radiologist'}
            </p>
          </div>
        </div>

        {/* Tumor Volume */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#6b7280]">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider">Tumor Volume</p>
            <p className="text-xl font-semibold text-[#111827] mt-0.5">{result.tumor_volume_cc} cc</p>
            <p className="text-xs text-[#6b7280] mt-0.5">{result.tumor_volume_voxels.toLocaleString()} voxels</p>
          </div>
        </div>

        {/* Slice Count */}
        <div className="flex items-start gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#6b7280]">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider">Slice Count</p>
            <p className="text-xl font-semibold text-[#111827] mt-0.5">{result.slice_count}</p>
            <p className="text-xs text-[#6b7280] mt-0.5">Tumor-containing slices</p>
          </div>
        </div>

        {/* Actions */}
        <h3 className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-3">
          Actions
        </h3>
        <button
          onClick={onReset}
          className="w-full h-9 bg-[#0284c7] hover:bg-[#0369a1] text-white text-sm font-medium rounded-md flex items-center justify-center gap-2 mb-2 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          New Analysis
        </button>
        <button
          disabled
          className="w-full h-9 bg-white border border-[#d1d5db] text-[#374151] text-sm font-medium rounded-md flex items-center justify-center gap-2 mb-2"
        >
          <Download className="w-4 h-4" />
          Export Segmentation
        </button>
        <button
          disabled
          className="w-full h-9 bg-white border border-[#d1d5db] text-[#374151] text-sm font-medium rounded-md flex items-center justify-center gap-2"
        >
          <Eye className="w-4 h-4" />
          View 3D
        </button>

        {/* Legend */}
        <h3 className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mt-5 mb-3">
          Mask Legend
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-red-500" />
            <span className="text-xs text-[#374151]">NET (Non-enhancing tumor)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-green-500" />
            <span className="text-xs text-[#374151]">Edema</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-blue-500" />
            <span className="text-xs text-[#374151]">ET (Enhancing tumor)</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
