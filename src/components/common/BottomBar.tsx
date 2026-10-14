import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Upload, 
  Clock, 
  Activity, 
  CheckSquare, 
  CheckCircle2, 
  ChevronUp, 
  ArrowRightCircle,
  FileSpreadsheet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BottomBarProps {
  onOpenImport?: () => void;
  onFilterOutstanding?: () => void;
  onOpenTransfer?: () => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({ 
  onOpenImport, 
  onFilterOutstanding, 
  onOpenTransfer 
}) => {
  const { currentHuddle, completeHuddle, startHuddle } = useApp();
  const navigate = useNavigate();
  const [submitMenuOpen, setSubmitMenuOpen] = useState(false);

  const handleCompleteCurrent = async () => {
    if (!currentHuddle) return;
    await completeHuddle(currentHuddle.id);
    setSubmitMenuOpen(false);
  };

  const handleStartCurrent = async () => {
    if (!currentHuddle) return;
    await startHuddle(currentHuddle.id);
    setSubmitMenuOpen(false);
  };

  return (
    <footer className="bg-white border-t border-slate-200 px-4 py-2 select-none shadow-sm flex items-center justify-between z-30 no-print">
      {/* Left Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenImport}
          className="flex items-center gap-2 bg-[#EBF3FB] hover:bg-[#D9EAF8] text-[#005EB8] border border-blue-200 hover:border-blue-300 px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs transition-colors"
          title="Import fictional demonstration records"
        >
          <Upload className="w-4 h-4 text-[#005EB8]" />
          <div className="text-left leading-tight">
            <div>Import Patient List</div>
            <div className="text-[10px] text-blue-600 font-normal">From HTML / CSV Tool</div>
          </div>
        </button>

        <button
          type="button"
          onClick={onFilterOutstanding}
          className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs transition-colors"
          title="Highlight pending, unverified or blank actions"
        >
          <Clock className="w-4 h-4 text-amber-600" />
          <div className="text-left leading-tight">
            <div>View Outstanding</div>
            <div className="text-[10px] text-slate-500 font-normal">Pending / In Progress</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/snapshot')}
          className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs transition-colors"
          title="Go to Department Snapshot"
        >
          <Activity className="w-4 h-4 text-[#005EB8]" />
          <span className="font-semibold">ED State of Play</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/history')}
          className="hidden lg:flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs transition-colors"
          title="Review audit log and checks"
        >
          <CheckSquare className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">Checks & Validations</span>
        </button>
      </div>

      {/* Right: Transfer Unactioned & Submit Huddle */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenTransfer}
          className="flex items-center gap-2 bg-[#6F42C1] hover:bg-[#5C32A8] text-white px-3.5 py-2 rounded-md text-xs font-bold shadow-sm transition-all"
          title="Transfer unresolved actions into next huddle"
        >
          <ArrowRightCircle className="w-4 h-4" />
          <span>Transfer Unactioned</span>
        </button>

        {/* Submit Huddle Dropdown */}
        <div className="relative">
          <div className="flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={handleCompleteCurrent}
              className="flex items-center gap-2 bg-[#007F3B] hover:bg-[#00662F] text-white px-4 py-2 rounded-l-md text-xs font-bold transition-all"
              title="Submit / Mark Current Huddle Complete"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit Huddle</span>
            </button>
            <button
              type="button"
              onClick={() => setSubmitMenuOpen(!submitMenuOpen)}
              className="bg-[#007F3B] hover:bg-[#00662F] text-white px-2 py-2 rounded-r-md border-l border-emerald-700 text-xs transition-all"
              title="More huddle actions"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>

          {submitMenuOpen && (
            <div 
              className="absolute right-0 bottom-full mb-1 w-52 bg-white text-slate-800 rounded-md shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in slide-in-from-bottom-1"
              onMouseLeave={() => setSubmitMenuOpen(false)}
            >
              {currentHuddle?.status !== 'In Progress' && (
                <button
                  type="button"
                  onClick={handleStartCurrent}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                >
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  Mark Huddle as In Progress
                </button>
              )}
              <button
                type="button"
                onClick={handleCompleteCurrent}
                className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Mark Huddle as Completed
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubmitMenuOpen(false);
                  navigate('/dashboard');
                }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium border-t border-slate-100"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#005EB8]" />
                View Handover Summary
              </button>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};
