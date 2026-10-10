import { useState } from 'react';
import Navbar from './components/Navbar';
import UploadPage from './components/UploadPage';
import ViewerPage from './components/ViewerPage';

export interface InferenceResult {
  subject_id: string;
  slice_count: number;
  mode: string;
  slices: Array<{
    index: number;
    original: string;
    mask: string;
    mask_classes: Record<string, string>;
  }>;
  idh: {
    probability: number;
    prediction: string;
    confidence: number;
    triage: string;
  };
  tumor_volume_voxels: number;
  tumor_volume_cc: number;
}

export default function App() {
  const [result, setResult] = useState<InferenceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResult = (data: InferenceResult) => {
    setResult(data);
    setLoading(false);
    setError(null);
  };

  const handleError = (msg: string) => {
    setError(msg);
    setLoading(false);
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setLoading(false);
  };

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <Navbar onReset={handleReset} />
      {result ? (
        <ViewerPage result={result} onReset={handleReset} />
      ) : (
        <UploadPage
          onResult={handleResult}
          onError={handleError}
          loading={loading}
          setLoading={setLoading}
          error={error}
        />
      )}
    </div>
  );
}
