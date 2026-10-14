import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { OperationalAction, ActionPriority, ActionStatus, LOSCategory } from '../models';
import { 
  Download, 
  Search, 
  Filter, 
  X, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRightCircle, 
  Edit3, 
  Calendar,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { ActionSlideOver } from '../features/live-huddle/ActionSlideOver';

type PresetTab = 'active' | 'my' | 'critical' | 'overdue' | 'completed' | 'transferred';

export const ActionsRegistryPage: React.FC = () => {
  const { actions, huddles, settings, activeRole } = useApp();

  const [activeTab, setActiveTab] = useState<PresetTab>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [huddleFilter, setHuddleFilter] = useState('ALL');
  const [shiftFilter, setShiftFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [holderFilter, setHolderFilter] = useState('ALL');
  const [escalatedFilter, setEscalatedFilter] = useState('ALL');

  const [actionToEdit, setActionToEdit] = useState<OperationalAction | null>(null);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);

  // Tab filtering
  const filteredByTab = actions.filter(action => {
    switch (activeTab) {
      case 'active':
        return action.status === 'In Progress' || action.status === 'New' || action.status === 'Awaiting Update';
      case 'my':
        return action.holder.toLowerCase().includes('nurse') || action.holder.toLowerCase().includes('smith');
      case 'critical':
        return action.priority === 'Critical' || action.escalationRequired;
      case 'overdue':
        return action.losHours > 12;
      case 'completed':
        return action.status === 'Completed';
      case 'transferred':
        return action.status === 'Transferred' || action.transferred;
      default:
        return true;
    }
  });

  // Secondary filters
  const fullyFiltered = filteredByTab.filter(action => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        action.initials.toLowerCase().includes(q) ||
        action.location.toLowerCase().includes(q) ||
        action.description.toLowerCase().includes(q) ||
        action.holder.toLowerCase().includes(q) ||
        action.comments.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (huddleFilter !== 'ALL' && action.huddleId !== huddleFilter) return false;
    if (statusFilter !== 'ALL' && action.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && action.priority !== priorityFilter) return false;
    if (locationFilter !== 'ALL' && action.location !== locationFilter) return false;
    if (holderFilter !== 'ALL' && action.holder !== holderFilter) return false;

    if (escalatedFilter === 'YES' && !action.escalationRequired) return false;
    if (escalatedFilter === 'NO' && action.escalationRequired) return false;

    if (shiftFilter !== 'ALL') {
      const parentHuddle = huddles.find(h => h.id === action.huddleId);
      if (parentHuddle && parentHuddle.shift !== shiftFilter) return false;
    }

    return true;
  });

  const handleExportCsv = () => {
    const headers = [
      'Action ID',
      'Huddle ID',
      'Initials',
      'Location',
      'LOS Hours',
      'LOS Category',
      'Description',
      'Action Holder',
      'Priority',
      'Status',
      'Comments',
      'Escalation Required',
      'Escalated To',
      'Escalation Response',
      'Transferred',
      'Created At',
      'Completed At'
    ];

    const rows = fullyFiltered.map(a => [
      `"${a.id}"`,
      `"${a.huddleId}"`,
      `"${a.initials}"`,
      `"${a.location}"`,
      a.losHours,
      `"${a.losCategory}"`,
      `"${a.description.replace(/"/g, '""')}"`,
      `"${a.holder}"`,
      `"${a.priority}"`,
      `"${a.status}"`,
      `"${(a.comments || '').replace(/"/g, '""')}"`,
      a.escalationRequired ? 'YES' : 'NO',
      `"${a.escalatedTo || ''}"`,
      `"${(a.escalationResponse || '').replace(/"/g, '""')}"`,
      a.transferred ? 'YES' : 'NO',
      `"${a.createdAt}"`,
      `"${a.completedAt || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ED_Huddle_Actions_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setHuddleFilter('ALL');
    setShiftFilter('ALL');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setLocationFilter('ALL');
    setHolderFilter('ALL');
    setEscalatedFilter('ALL');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#F0F4F5] p-3 space-y-3">
      {/* Header Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#005EB8]" />
            <span>Cross-Huddle Action Management Registry</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tracking patient actions, clinical reviews and handovers across all department huddles
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="flex items-center gap-2 bg-[#005EB8] hover:bg-[#00478F] text-white px-3.5 py-2 rounded-md text-xs font-bold shadow-xs transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Filtered ({fullyFiltered.length}) to CSV</span>
        </button>
      </div>

      {/* Preset Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'active', label: 'All Active Actions', count: actions.filter(a => a.status === 'In Progress' || a.status === 'New' || a.status === 'Awaiting Update').length },
          { id: 'my', label: 'My Department Actions', count: actions.filter(a => a.holder.toLowerCase().includes('nurse') || a.holder.toLowerCase().includes('smith')).length },
          { id: 'critical', label: 'Critical Risks & Escalations', count: actions.filter(a => a.priority === 'Critical' || a.escalationRequired).length },
          { id: 'overdue', label: 'Breaching / Over 12h', count: actions.filter(a => a.losHours > 12).length },
          { id: 'completed', label: 'Completed Actions', count: actions.filter(a => a.status === 'Completed').length },
          { id: 'transferred', label: 'Transferred Actions', count: actions.filter(a => a.status === 'Transferred' || a.transferred).length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as PresetTab)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold border transition-all ${
              activeTab === tab.id
                ? 'bg-[#005EB8] text-white border-[#00478F] shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === tab.id ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Main Filter Toolbar */}
      <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-xs flex flex-wrap items-center gap-2 text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search description, initials, holder..."
            className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#005EB8]"
          />
        </div>

        {/* Huddle Filter */}
        <select
          value={huddleFilter}
          onChange={(e) => setHuddleFilter(e.target.value)}
          className="border border-slate-300 rounded px-2.5 py-1.5 bg-slate-50 text-slate-700"
        >
          <option value="ALL">All Huddles</option>
          {huddles.map(h => (
            <option key={h.id} value={h.id}>{h.time} ({h.date})</option>
          ))}
        </select>

        {/* Shift Filter */}
        <select
          value={shiftFilter}
          onChange={(e) => setShiftFilter(e.target.value)}
          className="border border-slate-300 rounded px-2.5 py-1.5 bg-slate-50 text-slate-700"
        >
          <option value="ALL">All Shifts</option>
          <option value="Day">Day Shift</option>
          <option value="Late">Late Shift</option>
          <option value="Twilight">Twilight</option>
          <option value="Night">Night Shift</option>
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="border border-slate-300 rounded px-2.5 py-1.5 bg-slate-50 text-slate-700"
        >
          <option value="ALL">All Priorities</option>
          <option value="Routine">Routine</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-300 rounded px-2.5 py-1.5 bg-slate-50 text-slate-700"
        >
          <option value="ALL">All Statuses</option>
          <option value="New">New</option>
          <option value="In Progress">In Progress</option>
          <option value="Awaiting Update">Awaiting Update</option>
          <option value="Completed">Completed</option>
          <option value="Transferred">Transferred</option>
        </select>

        {/* Escalated Filter */}
        <select
          value={escalatedFilter}
          onChange={(e) => setEscalatedFilter(e.target.value)}
          className="border border-slate-300 rounded px-2.5 py-1.5 bg-slate-50 text-slate-700"
        >
          <option value="ALL">Escalation: All</option>
          <option value="YES">Escalated Only</option>
          <option value="NO">Non-Escalated</option>
        </select>

        <button
          type="button"
          onClick={clearAllFilters}
          className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded font-medium"
        >
          Reset
        </button>
      </div>

      {/* Action Table */}
      <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-xs overflow-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#F0F4F5] text-slate-700 border-b border-slate-300 sticky top-0 z-10 select-none">
            <tr>
              <th className="w-20 px-3 py-2.5 font-bold">LOS</th>
              <th className="w-24 px-3 py-2.5 font-bold">Huddle</th>
              <th className="w-24 px-3 py-2.5 font-bold">Location</th>
              <th className="w-16 px-3 py-2.5 font-bold">Initials</th>
              <th className="min-w-[220px] px-3 py-2.5 font-bold">Action Description</th>
              <th className="w-32 px-3 py-2.5 font-bold">Holder</th>
              <th className="w-20 px-3 py-2.5 font-bold">Priority</th>
              <th className="w-24 px-3 py-2.5 text-center font-bold">Status</th>
              <th className="min-w-[200px] px-3 py-2.5 font-bold">Comments & Escalations</th>
              <th className="w-16 px-3 py-2.5 text-center font-bold">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {fullyFiltered.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-slate-400">
                  No records match your selected criteria.
                </td>
              </tr>
            ) : (
              fullyFiltered.map(action => {
                const parentHuddle = huddles.find(h => h.id === action.huddleId);
                return (
                  <tr key={action.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-3 py-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                        action.losCategory === '> 12h' ? 'bg-[#7C3AED]' :
                        action.losCategory === '4 - 12h' ? 'bg-[#DC2626]' :
                        action.losCategory === '3 - 4h' ? 'bg-[#EA580C]' :
                        action.losCategory === '2 - 3h' ? 'bg-[#CA8A04]' : 'bg-[#007F3B]'
                      }`}>
                        {action.losCategory}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-700 whitespace-nowrap">
                      {parentHuddle ? `${parentHuddle.time} (${parentHuddle.shift})` : '—'}
                    </td>
                    <td className="px-3 py-2 font-semibold text-slate-900 whitespace-nowrap">
                      {action.location}
                    </td>
                    <td className="px-3 py-2 font-mono font-bold text-slate-800">
                      {action.initials}
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-900">
                      {action.description}
                    </td>
                    <td className="px-3 py-2 text-slate-700 whitespace-nowrap">
                      {action.holder}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        action.priority === 'Critical' ? 'bg-red-100 text-red-800 border border-red-300' :
                        action.priority === 'High' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {action.priority}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      <span className={`inline-block min-w-[70px] text-center px-2 py-0.5 rounded text-[11px] font-bold text-white ${
                        action.status === 'Completed' ? 'bg-[#007F3B]' :
                        action.status === 'In Progress' ? 'bg-[#ED8B00]' :
                        action.status === 'Awaiting Update' ? 'bg-[#DA291C]' :
                        action.status === 'Transferred' ? 'bg-[#6F42C1]' : 'bg-[#005EB8]'
                      }`}>
                        {action.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {action.escalationRequired && (
                        <span className="text-[10px] text-red-700 bg-red-100 font-bold px-1.5 py-0.5 rounded mr-1.5">
                          Escalated
                        </span>
                      )}
                      <span className="truncate">{action.comments || '—'}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setActionToEdit(action);
                          setIsSlideOverOpen(true);
                        }}
                        className="p-1 text-[#005EB8] hover:bg-blue-100 rounded"
                        title="Edit action"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-over panel for editing action */}
      <ActionSlideOver
        isOpen={isSlideOverOpen}
        onClose={() => setIsSlideOverOpen(false)}
        actionToEdit={actionToEdit}
      />
    </div>
  );
};
