import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Huddle, HuddleType, ShiftType } from '../../models';
import { Clock, Plus, CheckCircle, AlertCircle } from 'lucide-react';

export const HuddleTimelineRibbon: React.FC = () => {
  const { huddles, currentHuddle, setCurrentHuddleId, createHuddle } = useApp();
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTime, setNewTime] = useState('11:30');
  const [newType, setNewType] = useState<HuddleType>('No-Dispo');
  const [newShift, setNewShift] = useState<ShiftType>('Day');
  const [newLead, setNewLead] = useState('Sister Alex Ganea');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const today = currentHuddle?.date || '2025-05-26';
    await createHuddle({
      date: today,
      time: newTime,
      type: newType,
      shift: newShift,
      lead: newLead,
      status: 'Scheduled',
    });
    setShowNewModal(false);
  };

  return (
    <div className="bg-white border-b border-slate-200 px-3 py-2 no-print">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {huddles.map((huddle) => {
          const isActive = currentHuddle?.id === huddle.id;
          const isCompleted = huddle.status === 'Completed';
          const isInProgress = huddle.status === 'In Progress';

          return (
            <button
              key={huddle.id}
              type="button"
              onClick={() => setCurrentHuddleId(huddle.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded text-center transition-all border text-xs ${
                isActive
                  ? 'bg-[#005EB8] text-white border-[#00478F] shadow-sm font-semibold'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 leading-none">
                <span className="font-bold text-sm tracking-tight">{huddle.time}</span>
                {isCompleted && (
                  <CheckCircle className={`w-3 h-3 ${isActive ? 'text-white' : 'text-emerald-600'}`} />
                )}
                {isInProgress && (
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-300' : 'bg-emerald-500'} animate-pulse`} />
                )}
              </div>
              <div className={`text-[10px] tracking-tight mt-0.5 ${isActive ? 'text-blue-100 font-normal' : 'text-slate-500'}`}>
                {huddle.type} Huddle
              </div>
            </button>
          );
        })}

        {/* Add Ad-hoc Huddle Button */}
        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded text-xs text-slate-500 hover:text-[#005EB8] bg-slate-50 hover:bg-blue-50 border border-dashed border-slate-300 hover:border-blue-400 transition-colors"
          title="Add an operational or ad-hoc huddle"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium">Add Huddle</span>
        </button>
      </div>

      {/* Modal for creating a new huddle */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full border border-slate-200 p-5 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Schedule Operational Huddle</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Huddle Time (HH:mm)</label>
                <input
                  type="time"
                  required
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-[#005EB8]"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Huddle Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as HuddleType)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white"
                >
                  <option value="Dispo">Dispo Huddle</option>
                  <option value="No-Dispo">No-Dispo Huddle</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Shift</label>
                <select
                  value={newShift}
                  onChange={(e) => setNewShift(e.target.value as ShiftType)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white"
                >
                  <option value="Day">Day</option>
                  <option value="Late">Late</option>
                  <option value="Twilight">Twilight</option>
                  <option value="Night">Night</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Huddle Lead</label>
                <input
                  type="text"
                  required
                  value={newLead}
                  onChange={(e) => setNewLead(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3 py-1.5 rounded text-slate-600 hover:bg-slate-100 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#005EB8] hover:bg-[#00478F] text-white rounded text-xs font-semibold"
                >
                  Save Huddle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
