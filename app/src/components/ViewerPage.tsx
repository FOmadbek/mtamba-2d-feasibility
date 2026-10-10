import DicomSidebar from './DicomSidebar';
import MriViewer from './MriViewer';
import MetricsSidebar from './MetricsSidebar';
import type { InferenceResult } from '../App';

interface ViewerPageProps {
  result: InferenceResult;
  onReset: () => void;
}

export default function ViewerPage({ result, onReset }: ViewerPageProps) {
  return (
    <div className="flex-1 flex overflow-hidden">
      <DicomSidebar result={result} />
      <MriViewer result={result} />
      <MetricsSidebar result={result} onReset={onReset} />
    </div>
  );
}
