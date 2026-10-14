import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Huddle, OperationalAction, DepartmentSnapshot } from '../models';
import { MetricsService } from '../services/MetricsService';
import { 
  Calendar, 
  Search, 
  ExternalLink, 
  Copy, 
  Printer, 
  FileText, 
  Activity, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Lock,
  Edit3,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const HuddleHistoryPage: React.FC = () => {
  const { huddles, actions, snapshots, setCurrentHuddleId, createHuddle, updateHuddle, showNotification, settings } = useApp();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [shiftFilter, setShiftFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [selectedHuddleSummary, setSelectedHuddleSummary] = useState<Huddle | null>(null);
  const [selectedSnapshotView, setSelectedSnapshotView] = useState<DepartmentSnapshot | null>(null);
  const [editReasonModalHuddle, setEditReasonModalHuddle] = useState<Huddle | null>(null);
  const [editReason, setEditReason] = useState('');
  const [newLead, setNewLead] = useState('');

  // Filtering huddles
  const filteredHuddles = huddles.filter(h => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        h.lead.toLowerCase().includes(q) ||
        h.time.toLowerCase().includes(q) ||
        h.date.toLowerCase().includes(q) ||
        h.type.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (shiftFilter !== 'ALL' && h.shift !== shiftFilter) return false;
    if (statusFilter !== 'ALL' && h.status !== statusFilter) return false;

    return true;
  });

  const handleOpenHuddle = (huddle: Huddle) => {
    setCurrentHuddleId(huddle.id);
    navigate('/');
  };

  const handleDuplicateAsTemplate = async (huddle: Huddle) => {
    const today = new Date().toISOString().slice(0, 10);
    const newHuddle = await createHuddle({
      date: today,
      time: `${huddle.time} (Template)`,
      type: huddle.type,
      shift: huddle.shift,
      lead: huddle.lead,
      status: 'Scheduled',
    });
    showNotification(`Cloned huddle ${huddle.time} as template for ${today}`, 'success');
    setCurrentHuddleId(newHuddle.id);
    navigate('/');
  };

  const handleOpenEditReason = (huddle: Huddle) => {
    setEditReasonModalHuddle(huddle);
    setEditReason('');
    setNewLead(huddle.lead);
  };

  const handleSaveEditReason = async () => {
    if (!editReasonModalHuddle) return;
    if (!editReason.trim()) {
      showNotification('An audit reason is required to modify a completed huddle', 'error');
      return;
    }

    await updateHuddle(editReasonModalHuddle.id, { lead: newLead }, editReason);
    setEditReasonModalHuddle(null);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#F0F4F5] p-3 space-y-3">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#005EB8]" />
            <span>Huddle History & Audit Archive</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Permanent record of completed operational huddles, department snapshots, and action resolutions
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search lead, time, date..."
              className="pl-8 pr-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#005EB8]"
            />
          </div>

          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="border border-slate-300 rounded px-2.5 py-1.5 bg-slate-50 text-slate-700"
          >
            <option value="ALL">All Shifts</option>
            <option value="Day">Day</option>
            <option value="Late">Late</option>
            <option value="Twilight">Twilight</option>
            <option value="Night">Night</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded px-2.5 py-1.5 bg-slate-50 text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-auto flex-1">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#F0F4F5] text-slate-700 border-b border-slate-300 sticky top-0 z-10 select-none">
            <tr>
              <th className="px-3 py-2.5 font-bold">Date</th>
              <th className="px-3 py-2.5 font-bold">Time & Type</th>
              <th className="px-3 py-2.5 font-bold">Shift</th>
              <th className="px-3 py-2.5 font-bold">Huddle Lead</th>
              <th className="px-3 py-2.5 font-bold">ED Pressure</th>
              <th className="px-3 py-2.5 text-center font-bold">Active</th>
              <th className="px-3 py-2.5 text-center font-bold">Completed</th>
              <th className="px-3 py-2.5 text-center font-bold">Transferred</th>
              <th className="px-3 py-2.5 text-center font-bold">Risks</th>
              <th className="px-3 py-2.5 text-center font-bold">Status</th>
              <th className="px-3 py-2.5 text-center font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {filteredHuddles.map(huddle => {
              const huddleActions = actions.filter(a => a.huddleId === huddle.id);
              const snapshot = snapshots.find(s => s.huddleId === huddle.id);
              const metrics = MetricsService.computeHuddleMetrics(huddleActions, snapshot);

              return (
                <tr key={huddle.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="px-3 py-2.5 font-medium whitespace-nowrap">
                    {huddle.date}
                  </td>
                  <td className="px-3 py-2.5 font-bold text-slate-900 whitespace-nowrap">
                    {huddle.time} ({huddle.type})
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                    {huddle.shift}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-slate-800 whitespace-nowrap">
                    {huddle.lead}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      snapshot?.pressureLevel?.includes('Level 4') ? 'bg-red-100 text-red-800 border border-red-300' :
                      snapshot?.pressureLevel?.includes('Level 3') ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {snapshot?.pressureLevel || 'Level 2 (Moderate)'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center font-semibold text-blue-700">
                    {metrics.activeActions}
                  </td>
                  <td className="px-3 py-2.5 text-center font-semibold text-emerald-700">
                    {metrics.completedActions}
                  </td>
                  <td className="px-3 py-2.5 text-center font-semibold text-purple-700">
                    {metrics.transferredActions}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {metrics.criticalRisksCount > 0 ? (
                      <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded">
                        {metrics.criticalRisksCount}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center whitespace-nowrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${
                      huddle.status === 'Completed' ? 'bg-[#007F3B]' :
                      huddle.status === 'In Progress' ? 'bg-[#ED8B00]' : 'bg-[#005EB8]'
                    }`}>
                      {huddle.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenHuddle(huddle)}
                        className="px-2 py-1 bg-[#EBF3FB] text-[#005EB8] hover:bg-blue-100 font-semibold rounded text-[11px]"
                        title="Open in Live Huddle view"
                      >
                        Open
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedHuddleSummary(huddle)}
                        className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                        title="Read-only Summary"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicateAsTemplate(huddle)}
                        className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                        title="Duplicate as Template"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {huddle.status === 'Completed' && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditReason(huddle)}
                          className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded"
                          title="Requires audit reason to modify"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Read-Only Huddle Summary Modal */}
      {selectedHuddleSummary && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">
                Read-Only Record: {selectedHuddleSummary.time} ({selectedHuddleSummary.date})
              </h3>
              <button onClick={() => setSelectedHuddleSummary(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="text-xs space-y-2 text-slate-700">
              <div>Shift: <strong>{selectedHuddleSummary.shift}</strong></div>
              <div>Huddle Lead: <strong>{selectedHuddleSummary.lead}</strong></div>
              <div>Status: <strong>{selectedHuddleSummary.status}</strong></div>
              <div className="border-t border-slate-100 pt-2">
                Actions in Huddle: <strong>{actions.filter(a => a.huddleId === selectedHuddleSummary.id).length}</strong>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
              >
                Print Summary
              </button>
              <button
                type="button"
                onClick={() => setSelectedHuddleSummary(null)}
                className="px-3 py-1.5 bg-[#005EB8] text-white rounded text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Reason Modal (Guard for Completed Huddles) */}
      {editReasonModalHuddle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-slate-200 p-5 space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Audit Requirement: Modifying Completed Huddle</span>
            </div>
            <p className="text-xs text-slate-600">
              This huddle has already been formally submitted and marked Completed. Any operational edits require an audit reason.
            </p>
            <div className="text-xs space-y-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Huddle Lead</label>
                <input
                  type="text"
                  value={newLead}
                  onChange={(e) => setNewLead(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Modification <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="e.g. Correcting huddle lead after handover coverage..."
                  className="w-full border border-slate-300 rounded p-1.5 text-xs focus:ring-1 focus:ring-[#005EB8]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditReasonModalHuddle(null)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditReason}
                className="px-3.5 py-1.5 bg-[#005EB8] hover:bg-[#00478F] text-white rounded text-xs font-bold"
              >
                Save & Log Audit Trail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
