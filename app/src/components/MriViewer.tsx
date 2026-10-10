import { useState } from 'react';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import type { InferenceResult } from '../App';

interface MriViewerProps {
  result: InferenceResult;
}

export default function MriViewer({ result }: MriViewerProps) {
  const [slice, setSlice] = useState([0]);
  const [showMask, setShowMask] = useState(true);
  const totalSlices = result.slice_count;
  const currentSlice = slice[0];

  const dateStr = new Date().toISOString().slice(0, 10) + ' ' + new Date().toTimeString().slice(0, 5);

  const currentData = result.slices[currentSlice];

  return (
    <div className="flex-1 flex flex-col bg-white min-w-0">
      {/* Top info bar */}
      <div className="h-10 flex items-center gap-4 px-4 border-b border-[#e5e7eb] bg-white">
        <span className="text-sm font-semibold text-[#111827] truncate max-w-[200px]">{result.subject_id}</span>
        <span className="text-xs text-[#6b7280]">{dateStr}</span>
        <span className="text-xs text-[#6b7280]">Mode: {result.mode}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
          {result.idh.triage === 'accept' ? 'Auto-accept' : 'Refer to radiologist'}
        </span>
      </div>

      {/* Viewer area */}
      <div className="flex-1 flex bg-[#0a0a0a] relative min-h-0">
        {/* Left toolbar */}
        <div className="w-10 flex flex-col items-center py-2 gap-1 bg-[#111827] shrink-0">
          <button
            onClick={() => setShowMask(!showMask)}
            className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
              showMask ? 'bg-[#0284c7] text-white' : 'text-[#9ca3af] hover:text-white hover:bg-white/10'
            }`}
            title="Toggle segmentation mask"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>

        {/* Image canvas area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Slice info top-left */}
          <div className="absolute top-3 left-3 text-white/80 text-xs leading-relaxed z-10">
            <p className="font-medium">Axial</p>
            <p>Slice {currentSlice + 1} / {totalSlices}</p>
          </div>

          {/* Compass top-right */}
          <div className="absolute top-3 right-3 z-10">
            <svg width="40" height="40" viewBox="0 0 40 40">
              <line x1="20" y1="5" x2="20" y2="35" stroke="white" strokeWidth="1" opacity="0.6" />
              <line x1="5" y1="20" x2="35" y2="20" stroke="white" strokeWidth="1" opacity="0.6" />
              <text x="20" y="12" textAnchor="middle" fill="white" fontSize="8" opacity="0.8">A</text>
              <text x="20" y="35" textAnchor="middle" fill="white" fontSize="8" opacity="0.8">P</text>
              <text x="8" y="22" textAnchor="middle" fill="white" fontSize="8" opacity="0.8">R</text>
              <text x="32" y="22" textAnchor="middle" fill="white" fontSize="8" opacity="0.8">L</text>
            </svg>
          </div>

          {/* Image display — fills entire container, no gray square */}
          {currentData && (
            <>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundImage: `url("${currentData.original}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              />
              {showMask && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `url("${currentData.mask}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    pointerEvents: 'none',
                  }}
                />
              )}
            </>
          )}

          {/* Grayscale bar bottom-right */}
          <div className="absolute right-3 bottom-10 flex flex-col items-center gap-1 z-10">
            <span className="text-[10px] text-white/60">255</span>
            <div className="w-2 h-28 rounded-sm" style={{ background: 'linear-gradient(to top, #000 0%, #333 20%, #666 40%, #999 60%, #ccc 80%, #fff 100%)' }} />
            <span className="text-[10px] text-white/60">0</span>
          </div>
        </div>
      </div>

      {/* Bottom control bar */}
      <div className="h-12 flex items-center gap-3 px-4 bg-white border-t border-[#e5e7eb]">
        <button className="text-[#6b7280] hover:text-[#374151] transition-colors">
          <Play className="w-4 h-4" />
        </button>
        <Slider
          value={slice}
          onValueChange={setSlice}
          max={totalSlices - 1}
          step={1}
          className="flex-1 [&_[role=slider]]:bg-[#0284c7] [&_[role=slider]]:border-[#0284c7] [&_.bg-primary]:bg-[#0284c7]"
        />
        <span className="text-xs text-[#6b7280] w-16 text-center">
          {currentSlice + 1} / {totalSlices}
        </span>
        <button
          className="text-[#6b7280] hover:text-[#374151] transition-colors"
          onClick={() => setSlice([Math.max(0, currentSlice - 1)])}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          className="text-[#6b7280] hover:text-[#374151] transition-colors"
          onClick={() => setSlice([Math.min(totalSlices - 1, currentSlice + 1)])}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}