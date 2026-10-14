import React from 'react';
import { useApp } from '../../context/AppContext';
import { OperationalAction, AuditEvent } from '../../models';
import { X, History, Clock, User, ShieldCheck } from 'lucide-react';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: OperationalAction | null;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose, action }) => {
  const { auditEvents } = useApp();

  if (!isOpen || !action) return null;

  // Filter audit events for this action
  const relevantEvents = auditEvents.filter(
    e => (e.entityType === 'Action' && e.entityId === action.id) ||
         (action.sourceActionId && e.entityId === action.sourceActionId)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs select-none">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
        <div className="bg-[#003087] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-200" />
            <div>
              <h3 className="font-bold text-sm">Action Audit History</h3>
              <p className="text-[11px] text-blue-200">
                Patient: {action.initials} • Location: {action.location}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white p-1 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-3 text-xs">
          <div className="bg-slate-50 p-3 rounded border border-slate-200 text-slate-700">
            <div className="font-bold text-slate-900 mb-0.5">{action.description}</div>
            <div className="text-[11px] text-slate-500">
              Holder: {action.holder} | Priority: {action.priority} | Current Status: {action.status}
            </div>
          </div>

          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mt-3">
            Recorded Audit Trail:
          </h4>

          {relevantEvents.length === 0 ? (
            <div className="text-center py-6 text-slate-400">
              <Clock className="w-6 h-6 mx-auto mb-1 text-slate-300" />
              <p>Initial action creation logged. No subsequent updates recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {relevantEvents.map((evt) => (
                <div key={evt.id} className="p-2.5 rounded bg-white border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span className="font-semibold text-[#005EB8]">{evt.eventType}</span>
                    <span className="font-mono">
                      {new Date(evt.timestamp).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  <div className="text-slate-800 font-medium text-xs">
                    {evt.summary}
                  </div>
                  {evt.reason && (
                    <div className="text-[11px] text-slate-500 italic mt-0.5">
                      Reason: {evt.reason}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1 border-t border-slate-100 pt-1">
                    <User className="w-3 h-3" />
                    <span>Logged by: {evt.performedBy}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#005EB8] hover:bg-[#00478F] text-white rounded text-xs font-semibold"
          >
            Close Audit Trail
          </button>
        </div>
      </div>
    </div>
  );
};
