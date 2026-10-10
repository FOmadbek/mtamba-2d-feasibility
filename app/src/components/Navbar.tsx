import { ChevronDown, RotateCcw } from 'lucide-react';

interface NavbarProps {
  onReset?: () => void;
}

export default function Navbar({ onReset }: NavbarProps) {
  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-[#e5e7eb] bg-white shrink-0">
      <div className="flex items-center gap-2.5">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[#0284c7]"
        >
          <path d="M12 4c-1.5 0-2.8.5-3.8 1.3C7 6.2 6.2 7.5 6 9c-.2 1.5.2 3 .8 4.2.6 1.2 1.5 2.2 2.5 2.8" />
          <path d="M12 4c1.5 0 2.8.5 3.8 1.3 1.2.9 2 2.2 2.2 3.7.2 1.5-.2 3-.8 4.2-.6 1.2-1.5 2.2-2.5 2.8" />
          <path d="M9.3 16c-.5.3-1 .7-1.3 1.2-.4.5-.6 1.1-.7 1.7-.1.6 0 1.2.2 1.8.2.5.6 1 1 1.3" />
          <path d="M14.7 16c.5.3 1 .7 1.3 1.2.4.5.6 1.1.7 1.7.1.6 0 1.2-.2 1.8-.2.5-.6 1-1 1.3" />
          <path d="M12 16v4" />
          <path d="M8 14c-1.5.5-2.5 1.2-3 2" />
          <path d="M16 14c1.5.5 2.5 1.2 3 2" />
          <circle cx="12" cy="8" r="1" />
        </svg>
        <span className="text-[15px] font-medium text-[#111827] tracking-tight">
          Brain Tumor Segmentation
        </span>
      </div>
      <div className="flex items-center gap-3">
        {onReset && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-sm text-[#0284c7] hover:text-[#0369a1] hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            New Analysis
          </button>
        )}
        <div className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 rounded-md px-2 py-1 transition-colors">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[#6b7280]"
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="text-sm text-[#374151]">admin</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#9ca3af]" />
        </div>
      </div>
    </header>
  );
}
