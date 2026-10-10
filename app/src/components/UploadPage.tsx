import { useRef, useState } from 'react';
import { Upload, Loader2, AlertCircle, FolderOpen } from 'lucide-react';
import type { InferenceResult } from '../App';

interface UploadPageProps {
  onResult: (data: InferenceResult) => void;
  onError: (msg: string) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  error: string | null;
}

const API_URL = '';

const MODES = [
  { value: 'full-4', label: 'Full 4-modalities (FLAIR, T1CE, T1, T2)', desc: 'Best accuracy, requires all scans' },
  { value: 'flair-only', label: 'FLAIR only', desc: 'Low-resource mode, single scan' },
  { value: 't2+flair', label: 'T2 + FLAIR', desc: 'No contrast dye needed' },
  { value: 'no-t1ce', label: 'No T1CE (contrast-free)', desc: 'For clinics without contrast dye' },
];

export default function UploadPage({ onResult, onError, loading, setLoading, error }: UploadPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileList | null>(null);
  const [mode, setMode] = useState('full-4');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files);
    }
  };

  const handleAnalyze = async () => {
    if (!files || files.length === 0) return;
    setLoading(true);
    onError('');

    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append('files', f));
    formData.append('mode', mode);

    try {
      const res = await fetch(`${API_URL}/api/infer`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${res.status}`);
      }
      const data = await res.json();
      onResult(data);
    } catch (e: any) {
      onError(e.message || 'Analysis failed. Check backend is running on port 8000.');
    }
  };

  const fileList = files ? Array.from(files) : [];

  return (
    <div className="flex-1 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-5 w-full max-w-xl px-4">
        {/* Upload drop zone */}
        <div
          className="w-full h-[260px] rounded-lg border-2 border-dashed border-[#d1d5db] flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-[#9ca3af] hover:bg-gray-50/50 transition-all"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
            <Upload className="w-6 h-6 text-[#6b7280]" />
          </div>
          <button className="bg-[#0284c7] hover:bg-[#0369a1] text-white text-sm font-medium px-5 py-2.5 rounded-md transition-colors">
            Upload NIfTI Files
          </button>
          <p className="text-sm text-[#9ca3af]">
            Click to select .nii or .nii.gz files
          </p>
        </div>

        {/* Mode selection */}
        <div className="w-full">
          <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">Inference Mode</p>
          <div className="grid grid-cols-2 gap-2">
            {MODES.map((m) => (
              <label
                key={m.value}
                className={`flex items-start gap-2 p-3 rounded-md border cursor-pointer transition-all ${
                  mode === m.value
                    ? 'border-[#0284c7] bg-[#eff6ff]'
                    : 'border-[#e5e7eb] bg-white hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="mode"
                  value={m.value}
                  checked={mode === m.value}
                  onChange={(e) => setMode(e.target.value)}
                  className="mt-1 accent-[#0284c7]"
                />
                <div>
                  <p className="text-sm font-medium text-[#111827]">{m.label}</p>
                  <p className="text-xs text-[#6b7280]">{m.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* File list */}
        {fileList.length > 0 && (
          <div className="w-full bg-gray-50 rounded-md p-3">
            <p className="text-xs font-semibold text-[#6b7280] mb-1">Selected files ({fileList.length})</p>
            <ul className="text-sm text-[#374151] max-h-24 overflow-y-auto space-y-0.5">
              {fileList.map((f, i) => (
                <li key={i} className="truncate">{f.name}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="w-full flex items-center gap-2 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Analyze button */}
        <button
          onClick={handleAnalyze}
          disabled={loading || fileList.length === 0}
          className="w-full h-11 bg-[#0284c7] hover:bg-[#0369a1] disabled:bg-[#d1d5db] text-white text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running inference...
            </>
          ) : (
            'Run Segmentation & IDH Analysis'
          )}
        </button>

        <p className="text-xs text-[#9ca3af]">
          Backend must be running at {API_URL}
        </p>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    </div>
  );
}
