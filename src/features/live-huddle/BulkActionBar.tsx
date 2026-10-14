import React from 'react';
import { ActionStatus } from '../../models';
import { ArrowRightCircle, CheckCircle2, Play, Clock, Trash2, X, MousePointerClick } from 'lucide-react';

interface BulkActionBarProps {
  count: number;
  holders: string[];
  onSetStatus: (status: ActionStatus) => void;
  onAssignHolder: (holder: string) => void;
  onTransfer: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  count,
  holders,
  onSetStatus,
  onAssignHolder,
  onTransfer,
  onDelete,
  onClear,
}) => {
  if (count === 0) {
    return (
      <div className="px-4 py-1 border-b border-slate-100 bg-slate-50/60 text-[11px] text-slate-500 flex items-center gap-1.5 no-print">
        <MousePointerClick className="w-3.5 h-3.5 text-slate-400" />
        <span>
          Click and drag down the tick box, LOS, location or initials columns to select rows (start on a selected row to deselect).
          Shift+click selects a range. Click any action, holder, status or comment to edit it in place.
        </span>
      </div>
    );
  }

  const btn = 'flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border transition-colors';

  return (
    <div
      className="px-4 py-1.5 border-b border-blue-200 bg-[#EBF3FB] flex flex-wrap items-center gap-2 text-xs no-print"
      role="toolbar"
      aria-label="Bulk actions for selected rows"
    >
      <span className="font-bold text-[#003087] mr-1">{count} selected</span>

      <button type="button" onClick={() => onSetStatus('In Progress')} className={`${btn} bg-white border-slate-300 text-slate-700 hover:bg-slate-50`}>
        <Play className="w-3.5 h-3.5 text-amber-600" /> In Progress
      </button>
      <button type="button" onClick={() => onSetStatus('Awaiting Update')} className={`${btn} bg-white border-slate-300 text-slate-700 hover:bg-slate-50`}>
        <Clock className="w-3.5 h-3.5 text-red-600" /> Awaiting Update
      </button>
      <button type="button" onClick={() => onSetStatus('Completed')} className={`${btn} bg-white border-slate-300 text-slate-700 hover:bg-slate-50`}>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed
      </button>

      <select
        aria-label="Assign holder to selected rows"
        value=""
        onChange={e => {
          if (e.target.value) onAssignHolder(e.target.value);
        }}
        className="border border-slate-300 rounded px-2 py-1 bg-white text-slate-700 text-xs"
      >
        <option value="">Assign holder…</option>
        {holders.map(h => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>

      <button type="button" onClick={onTransfer} className={`${btn} bg-[#6F42C1] border-[#5C32A8] text-white hover:bg-[#5C32A8]`}>
        <ArrowRightCircle className="w-3.5 h-3.5" /> Transfer selected
      </button>
      <button type="button" onClick={onDelete} className={`${btn} bg-white border-red-300 text-red-700 hover:bg-red-50`}>
        <Trash2 className="w-3.5 h-3.5" /> Delete
      </button>

      <button type="button" onClick={onClear} className="ml-auto flex items-center gap-1 px-2 py-1 text-slate-600 hover:text-slate-900 rounded">
        <X className="w-3.5 h-3.5" /> Clear selection
      </button>
    </div>
  );
};
