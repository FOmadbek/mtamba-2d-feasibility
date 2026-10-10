import { Search, ChevronRight, Layers } from 'lucide-react';
import type { InferenceResult } from '../App';

interface DicomSidebarProps {
  result: InferenceResult;
}

export default function DicomSidebar({ result }: DicomSidebarProps) {
  const items = [
    {
      name: result.subject_id,
      count: result.slice_count,
      isFolder: false,
      selected: true,
      icon: 'brain' as const,
    },
    {
      name: `Mode: ${result.mode}`,
      count: 0,
      isFolder: false,
      selected: false,
      icon: 'layers' as const,
    },
  ];

  return (
    <aside className="w-[260px] border-r border-[#e5e7eb] bg-white flex flex-col shrink-0">
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-3">
          Series
        </h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9ca3af]" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-[#e5e7eb] bg-white text-[#374151] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#0284c7] focus:border-[#0284c7]"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {items.map((item, index) => (
          <div
            key={item.name + index}
            className={`relative px-4 py-3 cursor-pointer border-b border-[#f3f4f6] transition-colors ${
              item.selected ? 'bg-[#eff6ff]' : 'hover:bg-gray-50'
            }`}
          >
            {item.selected && (
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#0284c7]" />
            )}
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {item.icon === 'brain' ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#0284c7]">
                      <path d="M12 4c-1.5 0-2.8.5-3.8 1.3C7 6.2 6.2 7.5 6 9c-.2 1.5.2 3 .8 4.2.6 1.2 1.5 2.2 2.5 2.8" />
                      <path d="M12 4c1.5 0 2.8.5 3.8 1.3 1.2.9 2 2.2 2.2 3.7.2 1.5-.2 3-.8 4.2-.6 1.2-1.5 2.2-2.5 2.8" />
                      <circle cx="12" cy="8" r="1" />
                    </svg>
                  ) : (
                    <Layers className="w-3.5 h-3.5 text-[#9ca3af] shrink-0" />
                  )}
                  <p className="text-sm font-medium text-[#111827] truncate">{item.name}</p>
                </div>
                {item.count > 0 && (
                  <p className="text-xs text-[#9ca3af] mt-1 ml-[18px]">
                    {item.count} slices
                  </p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-[#d1d5db] shrink-0 ml-2" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
