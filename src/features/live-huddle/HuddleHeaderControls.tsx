import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Play, 
  CheckCircle2, 
  ArrowRightCircle, 
  FileText, 
  User, 
  Calendar,
  Layers
} from 'lucide-react';

interface HuddleHeaderControlsProps {
  onOpenTransfer: () => void;
  onOpenSummary: () => void;
}

export const HuddleHeaderControls: React.FC<HuddleHeaderControlsProps> = ({
  onOpenTransfer,
  onOpenSummary,
}) => {
  const { currentHuddle, startHuddle, completeHuddle, activeRole } = useApp();

  if (!currentHuddle) return null;

  const isReadOnly = activeRole === 'Read Only Viewer';
  const isInProgress = currentHuddle.status === 'In Progress';
  const isCompleted = currentHuddle.status === 'Completed';

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
      {/* Left: Metadata info */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
          <span>{currentHuddle.time} {currentHuddle.type} Huddle</span>
          <span className="text-slate-400 font-normal">|</span>
          <span className="text-slate-600 font-medium">{currentHuddle.shift} Shift</span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-500">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{new Date(currentHuddle.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
          <User className="w-3.5 h-3.5 text-[#005EB8]" />
          <span>Lead: <strong className="text-slate-800">{currentHuddle.lead}</strong></span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Status:</span>
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
            isInProgress 
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
              : isCompleted 
              ? 'bg-blue-100 text-blue-800 border border-blue-300'
              : 'bg-amber-100 text-amber-800 border border-amber-300'
          }`}>
            {currentHuddle.status}
          </span>
        </div>
      </div>

      {/* Right: Operational Buttons */}
      <div className="flex items-center gap-2">
        {/* Start Huddle button */}
        {!isInProgress && !isCompleted && !isReadOnly && (
          <button
            type="button"
            onClick={() => startHuddle(currentHuddle.id)}
            className="flex items-center gap-1.5 bg-[#005EB8] hover:bg-[#00478F] text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-xs transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Huddle</span>
          </button>
        )}

        {/* Complete Huddle button */}
        {!isCompleted && !isReadOnly && (
          <button
            type="button"
            onClick={() => completeHuddle(currentHuddle.id)}
            className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-xs transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Complete Huddle</span>
          </button>
        )}

        {/* Transfer Unactioned (PROMINENT) */}
        {!isReadOnly && (
          <button
            type="button"
            onClick={onOpenTransfer}
            className="flex items-center gap-1.5 bg-[#6F42C1] hover:bg-[#5C32A8] text-white px-3.5 py-1.5 rounded-md text-xs font-bold shadow-sm transition-all animate-pulse-subtle"
            title="Carry forward all uncompleted actions into the next huddle"
          >
            <ArrowRightCircle className="w-4 h-4" />
            <span>Transfer Unactioned</span>
          </button>
        )}

        {/* Generate Summary button */}
        <button
          type="button"
          onClick={onOpenSummary}
          className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-slate-400 px-3 py-1.5 rounded-md text-xs font-semibold shadow-xs transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-[#005EB8]" />
          <span>Generate Summary</span>
        </button>
      </div>
    </div>
  );
};
