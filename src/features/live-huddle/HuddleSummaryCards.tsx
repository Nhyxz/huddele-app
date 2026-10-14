import React from 'react';
import { useApp } from '../../context/AppContext';
import { MetricsService } from '../../services/MetricsService';
import { Clock, CheckCircle2, Users, AlertTriangle, Gauge } from 'lucide-react';

export const HuddleSummaryCards: React.FC = () => {
  const { currentHuddle, currentHuddleActions, currentSnapshot, actions } = useApp();

  const metrics = MetricsService.computeHuddleMetrics(currentHuddleActions, currentSnapshot);

  // Total actions today across all huddles
  const totalActionsToday = actions.length;
  const completedActionsToday = actions.filter(a => a.status === 'Completed').length;

  const totalPatients = currentSnapshot?.totalPatients || 68;

  // Proportions for stacked bar (fallback to mockup numbers if current actions are smaller)
  const los = {
    over12h: Math.max(metrics.patientsByLos.over12h, currentSnapshot?.over12Hours ?? 8),
    under12h: Math.max(metrics.patientsByLos.under12h, 14),
    under4h: Math.max(metrics.patientsByLos.under4h, 16),
    under3h: Math.max(metrics.patientsByLos.under3h, 18),
    under2h: Math.max(metrics.patientsByLos.under2h, 12),
  };

  const losSum = los.over12h + los.under12h + los.under4h + los.under3h + los.under2h || 1;

  const formattedDate = currentHuddle?.date 
    ? new Date(currentHuddle.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : 'Monday 26 May 2025';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-3">
      {/* Card 1: Current Huddle */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs flex items-center gap-3 relative overflow-hidden">
        <div className="w-11 h-11 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0 text-[#005EB8]">
          <Clock className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Current Huddle
          </div>
          <div className="text-xl font-black text-slate-900 tracking-tight leading-tight">
            {currentHuddle?.time || '10:00'}
          </div>
          <div className="text-xs font-semibold text-[#005EB8] truncate">
            {currentHuddle?.type || 'Dispo'} Huddle • {currentHuddle?.shift || 'Day'} Shift
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {formattedDate}
          </div>
        </div>
      </div>

      {/* Card 2: Actions Completed Today */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0 text-emerald-600">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Actions Completed Today
          </div>
          <div className="flex items-baseline gap-1.5 leading-none my-0.5">
            <span className="text-xl font-black text-slate-900">{completedActionsToday}</span>
            <span className="text-xs text-slate-500">of {totalActionsToday} actions</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
            <div 
              className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${totalActionsToday > 0 ? (completedActionsToday / totalActionsToday) * 100 : 0}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
            <span>Active in huddle: {metrics.activeActions}</span>
            <span className="font-semibold text-emerald-700">
              {totalActionsToday > 0 ? Math.round((completedActionsToday / totalActionsToday) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Card 3: Patients in Department with LOS Breakdown */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[#005EB8]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Patients in ED
              </div>
              <div className="text-lg font-black text-slate-900 leading-none">
                {totalPatients}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
              {los.over12h} over 12h
            </span>
          </div>
        </div>

        {/* Stacked LOS Bar */}
        <div className="mt-2">
          <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-100">
            <div style={{ width: `${(los.over12h / losSum) * 100}%` }} className="bg-[#7C3AED]" title={`>12h: ${los.over12h}`} />
            <div style={{ width: `${(los.under12h / losSum) * 100}%` }} className="bg-[#DC2626]" title={`4-12h: ${los.under12h}`} />
            <div style={{ width: `${(los.under4h / losSum) * 100}%` }} className="bg-[#EA580C]" title={`3-4h: ${los.under4h}`} />
            <div style={{ width: `${(los.under3h / losSum) * 100}%` }} className="bg-[#CA8A04]" title={`2-3h: ${los.under3h}`} />
            <div style={{ width: `${(los.under2h / losSum) * 100}%` }} className="bg-[#007F3B]" title={`<2h: ${los.under2h}`} />
          </div>

          {/* LOS category badges below bar */}
          <div className="grid grid-cols-5 text-center text-[10px] gap-1 mt-1 font-semibold leading-tight">
            <div className="text-[#7C3AED]">
              <div>&gt;12h</div>
              <div className="font-bold">{los.over12h}</div>
            </div>
            <div className="text-[#DC2626]">
              <div>4-12h</div>
              <div className="font-bold">{los.under12h}</div>
            </div>
            <div className="text-[#EA580C]">
              <div>3-4h</div>
              <div className="font-bold">{los.under4h}</div>
            </div>
            <div className="text-[#CA8A04]">
              <div>2-3h</div>
              <div className="font-bold">{los.under3h}</div>
            </div>
            <div className="text-[#007F3B]">
              <div>&lt;2h</div>
              <div className="font-bold">{los.under2h}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 4: Key Times & Department Pressure */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5 text-slate-400" />
            Key Operational Times
          </div>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
            currentSnapshot?.pressureLevel?.includes('Level 4')
              ? 'bg-red-100 text-red-800 border border-red-300'
              : currentSnapshot?.pressureLevel?.includes('Level 3')
              ? 'bg-amber-100 text-amber-800 border border-amber-300'
              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
          }`}>
            {currentSnapshot?.pressureLevel || 'Level 3 (Severe)'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 my-1">
          <div className="bg-slate-50 rounded p-1.5 border border-slate-100">
            <div className="text-[10px] text-slate-500 font-medium">Wait for Dr</div>
            <div className="text-base font-black text-slate-900 leading-tight">1h 20m</div>
          </div>
          <div className="bg-slate-50 rounded p-1.5 border border-slate-100">
            <div className="text-[10px] text-slate-500 font-medium">Triage Time</div>
            <div className="text-base font-black text-slate-900 leading-tight">35m</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 border-t border-slate-100">
          <span className="flex items-center gap-1 text-red-600 font-semibold">
            <AlertTriangle className="w-3 h-3" />
            {metrics.criticalRisksCount} Critical Risks
          </span>
          <span>Saved: {currentSnapshot?.updatedAt ? new Date(currentSnapshot.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:15'}</span>
        </div>
      </div>
    </div>
  );
};
