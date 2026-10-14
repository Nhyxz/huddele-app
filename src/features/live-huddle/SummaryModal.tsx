import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MetricsService } from '../../services/MetricsService';
import { X, Copy, Check, Printer, FileText, AlertTriangle } from 'lucide-react';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({ isOpen, onClose }) => {
  const { currentHuddle, currentHuddleActions, currentSnapshot } = useApp();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !currentHuddle) return null;

  const metrics = MetricsService.computeHuddleMetrics(currentHuddleActions, currentSnapshot);

  const summaryText = `[NHS ED HUDDLE SUMMARY - ${currentHuddle.time} ${currentHuddle.type} HUDDLE]
Date: ${currentHuddle.date} | Shift: ${currentHuddle.shift} | Lead: ${currentHuddle.lead}
Department Pressure: ${currentSnapshot?.pressureLevel || 'Level 3 (Severe)'}
Total Patients in ED: ${currentSnapshot?.totalPatients || 68} | Over 12 Hours: ${metrics.patientsOver12h}
Active Actions: ${metrics.activeActions} | Completed: ${metrics.completedActions} | Transferred: ${metrics.transferredActions}
Critical Risks: ${metrics.criticalRisksCount}

Main Department Pressures: ${currentSnapshot?.mainPressures.join(', ') || 'Bed Capacity, Diagnostics'}
Key Escalation: ${currentSnapshot?.escalationIssue || 'None recorded'}
Next Priority: ${currentSnapshot?.nextPriority || 'Site bed capacity meeting'}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs select-none">
      <div className="bg-white rounded-lg shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        <div className="bg-[#005EB8] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <h3 className="font-bold text-sm">Huddle Operational Summary</h3>
          </div>
          <button onClick={onClose} className="text-blue-100 hover:text-white p-1 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded p-3 text-slate-800 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
            {summaryText}
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Critical Actions in this Huddle:
            </h4>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded">
              {currentHuddleActions.filter(a => a.priority === 'Critical' || a.escalationRequired).map(a => (
                <div key={a.id} className="p-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 mr-2">{a.initials}</span>
                    <span className="text-slate-500 mr-2">[{a.location}]</span>
                    <span className="text-slate-700">{a.description}</span>
                  </div>
                  <span className="text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                    {a.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded text-xs font-semibold text-slate-600 hover:bg-slate-200"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-bold bg-[#005EB8] hover:bg-[#00478F] text-white shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
