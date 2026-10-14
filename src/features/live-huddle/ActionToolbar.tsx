import React from 'react';
import { useApp } from '../../context/AppContext';
import { Search, Plus, Filter, X, Eye } from 'lucide-react';
import { ActionPriority, ActionStatus } from '../../models';

interface ActionToolbarProps {
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  priorityFilter: string;
  setPriorityFilter: (s: string) => void;
  locationFilter: string;
  setLocationFilter: (s: string) => void;
  holderFilter: string;
  setHolderFilter: (s: string) => void;
  showTransferred: boolean;
  setShowTransferred: (b: boolean) => void;
  onClearFilters: () => void;
  onOpenAddAction: () => void;
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  locationFilter,
  setLocationFilter,
  holderFilter,
  setHolderFilter,
  showTransferred,
  setShowTransferred,
  onClearFilters,
  onOpenAddAction,
}) => {
  const { settings, activeRole } = useApp();
  const isReadOnly = activeRole === 'Read Only Viewer';

  const hasFilters = searchTerm || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || locationFilter !== 'ALL' || holderFilter !== 'ALL';

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5 select-none no-print">
      {/* Title & Quick Search */}
      <div className="flex items-center gap-3 flex-1 min-w-[280px]">
        <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span>Huddle Actions</span>
        </h2>

        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by initials, location, action or holder..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#005EB8] transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Dropdowns and Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-slate-50 hover:bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#005EB8]"
        >
          <option value="ALL">All Statuses</option>
          <option value="New">New</option>
          <option value="In Progress">In Progress</option>
          <option value="Awaiting Update">Awaiting Update</option>
          <option value="Completed">Completed</option>
          <option value="Transferred">Transferred</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        {/* Location Dropdown */}
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-slate-50 hover:bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#005EB8]"
        >
          <option value="ALL">All Locations</option>
          {settings.locations.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-slate-50 hover:bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#005EB8]"
        >
          <option value="ALL">All Priorities</option>
          <option value="Routine">Routine</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>

        {/* Action Holder Filter */}
        <select
          value={holderFilter}
          onChange={(e) => setHolderFilter(e.target.value)}
          className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-slate-50 hover:bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#005EB8]"
        >
          <option value="ALL">All Holders</option>
          {settings.actionHolders.map(holder => (
            <option key={holder} value={holder}>{holder}</option>
          ))}
        </select>

        {/* Show Transferred Actions Toggle */}
        <label className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2 py-1.5 rounded-md border border-slate-200 cursor-pointer hover:bg-slate-100">
          <input
            type="checkbox"
            checked={showTransferred}
            onChange={(e) => setShowTransferred(e.target.checked)}
            className="rounded text-[#005EB8] focus:ring-0 w-3.5 h-3.5"
          />
          <span className="text-[11px] font-medium">Show Transferred</span>
        </label>

        {/* Clear Filters */}
        {hasFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-md font-medium transition-colors"
          >
            Clear
          </button>
        )}

        {/* + Add Action Button */}
        {!isReadOnly && (
          <button
            type="button"
            onClick={onOpenAddAction}
            className="flex items-center gap-1.5 bg-[#005EB8] hover:bg-[#00478F] text-white px-3.5 py-1.5 rounded-md text-xs font-bold shadow-xs transition-colors ml-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Action</span>
          </button>
        )}
      </div>
    </div>
  );
};
