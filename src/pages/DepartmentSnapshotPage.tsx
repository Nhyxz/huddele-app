import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DepartmentSnapshot, PressureLevel, TrendType } from '../models';
import { 
  Activity, 
  Copy, 
  Save, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  CheckCircle2, 
  ShieldAlert,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';

export const DepartmentSnapshotPage: React.FC = () => {
  const { currentHuddle, currentSnapshot, saveSnapshot, copyPreviousSnapshot, settings, showNotification } = useApp();

  const [totalPatients, setTotalPatients] = useState<number>(68);
  const [awaitingBeds, setAwaitingBeds] = useState<number>(18);
  const [over12Hours, setOver12Hours] = useState<number>(8);
  const [over24Hours, setOver24Hours] = useState<number>(1);
  const [staffedSpacesAvailable, setStaffedSpacesAvailable] = useState<number>(4);
  const [pressureLevel, setPressureLevel] = useState<PressureLevel>('Level 3 (Severe)');

  const [mainPressures, setMainPressures] = useState<string[]>(['Bed Capacity', 'Patient Flow', 'Diagnostics']);
  const [pressuredAreas, setPressuredAreas] = useState<string[]>(['Majors', 'Resus', 'Waiting Room']);
  const [trend, setTrend] = useState<TrendType>('Deteriorating');

  const [changeSincePrevious, setChangeSincePrevious] = useState('');
  const [mainRisk, setMainRisk] = useState('');
  const [positiveDevelopment, setPositiveDevelopment] = useState('');
  const [escalationIssue, setEscalationIssue] = useState('');
  const [actionRequested, setActionRequested] = useState('');
  const [escalatedTo, setEscalatedTo] = useState('');
  const [escalationTime, setEscalationTime] = useState('');
  const [escalationResponse, setEscalationResponse] = useState('');
  const [nextPriority, setNextPriority] = useState('');

  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentSnapshot) {
      setTotalPatients(currentSnapshot.totalPatients);
      setAwaitingBeds(currentSnapshot.awaitingBeds);
      setOver12Hours(currentSnapshot.over12Hours);
      setOver24Hours(currentSnapshot.over24Hours);
      setStaffedSpacesAvailable(currentSnapshot.staffedSpacesAvailable);
      setPressureLevel(currentSnapshot.pressureLevel);
      setMainPressures(currentSnapshot.mainPressures || []);
      setPressuredAreas(currentSnapshot.pressuredAreas || []);
      setTrend(currentSnapshot.trend);
      setChangeSincePrevious(currentSnapshot.changeSincePrevious || '');
      setMainRisk(currentSnapshot.mainRisk || '');
      setPositiveDevelopment(currentSnapshot.positiveDevelopment || '');
      setEscalationIssue(currentSnapshot.escalationIssue || '');
      setActionRequested(currentSnapshot.actionRequested || '');
      setEscalatedTo(currentSnapshot.escalatedTo || '');
      setEscalationTime(currentSnapshot.escalationTime || '');
      setEscalationResponse(currentSnapshot.escalationResponse || '');
      setNextPriority(currentSnapshot.nextPriority || '');
      setIsCopied(!!currentSnapshot.isCopiedFromPrevious);
    } else {
      // Defaults for active huddle
      setTotalPatients(68);
      setAwaitingBeds(18);
      setOver12Hours(8);
      setOver24Hours(1);
      setStaffedSpacesAvailable(4);
      setPressureLevel('Level 3 (Severe)');
      setMainPressures(['Bed Capacity', 'Patient Flow', 'Diagnostics']);
      setPressuredAreas(['Majors', 'Resus']);
      setTrend('Stable');
      setChangeSincePrevious('');
      setMainRisk('Delays in medical bed allocation');
      setPositiveDevelopment('Streaming pathway operating smoothly');
      setEscalationIssue('');
      setActionRequested('');
      setEscalatedTo('');
      setEscalationTime('');
      setEscalationResponse('');
      setNextPriority('11:00 Bed meeting');
      setIsCopied(false);
    }
  }, [currentSnapshot, currentHuddle]);

  const handleTogglePressure = (item: string) => {
    if (mainPressures.includes(item)) {
      setMainPressures(mainPressures.filter(p => p !== item));
    } else {
      if (mainPressures.length >= 3) {
        showNotification('Maximum 3 main pressures allowed', 'info');
        return;
      }
      setMainPressures([...mainPressures, item]);
    }
  };

  const handleToggleArea = (area: string) => {
    if (pressuredAreas.includes(area)) {
      setPressuredAreas(pressuredAreas.filter(a => a !== area));
    } else {
      setPressuredAreas([...pressuredAreas, area]);
    }
  };

  const handleCopyPrevious = async () => {
    if (!currentHuddle) return;
    const copied = await copyPreviousSnapshot(currentHuddle.id);
    if (copied) {
      setIsCopied(true);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentHuddle) return;
    setIsSaving(true);
    try {
      await saveSnapshot({
        id: currentSnapshot?.id,
        huddleId: currentHuddle.id,
        totalPatients,
        awaitingBeds,
        over12Hours,
        over24Hours,
        staffedSpacesAvailable,
        pressureLevel,
        mainPressures,
        pressuredAreas,
        trend,
        changeSincePrevious,
        mainRisk,
        positiveDevelopment,
        escalationIssue,
        actionRequested,
        escalatedTo,
        escalationTime,
        escalationResponse,
        nextPriority,
        isCopiedFromPrevious: false,
      });
      setIsCopied(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#F0F4F5] p-3 space-y-3">
      {/* Top Banner */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#005EB8]" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              ED State of Play & Department Snapshot
            </h2>
            <span className="text-xs bg-[#003087] text-white px-2 py-0.5 rounded font-mono font-bold">
              {currentHuddle?.time} {currentHuddle?.type} Huddle
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Structured capacity metrics, system pressures, operational risks, and formal clinical escalations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyPrevious}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-2 rounded-md text-xs font-semibold shadow-2xs transition-colors"
            title="Pre-populate from the most recent snapshot"
          >
            <Copy className="w-4 h-4 text-[#005EB8]" />
            <span>Copy Previous Snapshot</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 bg-[#007F3B] hover:bg-[#00662F] text-white px-4 py-2 rounded-md text-xs font-bold shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Snapshot'}</span>
          </button>
        </div>
      </div>

      {isCopied && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded text-xs text-amber-900 flex items-center gap-2 animate-in fade-in">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            <strong>Fields Copied from Previous Snapshot:</strong> Please review and adjust capacity numbers and operational notes before clicking Save Snapshot.
          </span>
        </div>
      )}

      {/* Main Grid */}
      <form onSubmit={handleSave} className="space-y-3">
        {/* 1. Capacity Snapshot Section */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Department Capacity & Pressure Metrics
            </h3>
            <span className="text-[11px] text-slate-400">Live census metrics</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            {/* Total Patients in ED */}
            <div className={`p-2.5 rounded border ${isCopied ? 'bg-amber-50/50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Total Patients in ED
              </label>
              <input
                type="number"
                min="0"
                value={totalPatients}
                onChange={(e) => setTotalPatients(parseInt(e.target.value) || 0)}
                className="w-full font-bold text-base bg-white border border-slate-300 rounded px-2 py-1 focus:ring-1 focus:ring-[#005EB8]"
              />
            </div>

            {/* Awaiting Beds */}
            <div className={`p-2.5 rounded border ${isCopied ? 'bg-amber-50/50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Awaiting Beds (DTA)
              </label>
              <input
                type="number"
                min="0"
                value={awaitingBeds}
                onChange={(e) => setAwaitingBeds(parseInt(e.target.value) || 0)}
                className="w-full font-bold text-base bg-white border border-slate-300 rounded px-2 py-1 text-amber-700 focus:ring-1 focus:ring-[#005EB8]"
              />
            </div>

            {/* Over 12 Hours */}
            <div className={`p-2.5 rounded border ${isCopied ? 'bg-amber-50/50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Patients &gt; 12 Hours
              </label>
              <input
                type="number"
                min="0"
                value={over12Hours}
                onChange={(e) => setOver12Hours(parseInt(e.target.value) || 0)}
                className="w-full font-bold text-base bg-white border border-slate-300 rounded px-2 py-1 text-purple-700 focus:ring-1 focus:ring-[#005EB8]"
              />
            </div>

            {/* Over 24 Hours */}
            <div className={`p-2.5 rounded border ${isCopied ? 'bg-amber-50/50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Patients &gt; 24 Hours
              </label>
              <input
                type="number"
                min="0"
                value={over24Hours}
                onChange={(e) => setOver24Hours(parseInt(e.target.value) || 0)}
                className="w-full font-bold text-base bg-white border border-slate-300 rounded px-2 py-1 text-red-700 focus:ring-1 focus:ring-[#005EB8]"
              />
            </div>

            {/* Available Staffed Spaces */}
            <div className={`p-2.5 rounded border ${isCopied ? 'bg-amber-50/50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Staffed Spaces Avail.
              </label>
              <input
                type="number"
                min="0"
                value={staffedSpacesAvailable}
                onChange={(e) => setStaffedSpacesAvailable(parseInt(e.target.value) || 0)}
                className="w-full font-bold text-base bg-white border border-slate-300 rounded px-2 py-1 text-emerald-700 focus:ring-1 focus:ring-[#005EB8]"
              />
            </div>

            {/* Pressure Level */}
            <div className={`p-2.5 rounded border ${isCopied ? 'bg-amber-50/50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Current ED Pressure
              </label>
              <select
                value={pressureLevel}
                onChange={(e) => setPressureLevel(e.target.value as PressureLevel)}
                className="w-full font-bold text-xs bg-white border border-slate-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-[#005EB8]"
              >
                <option value="Level 1 (Normal)">Level 1 (Normal)</option>
                <option value="Level 2 (Moderate)">Level 2 (Moderate)</option>
                <option value="Level 3 (Severe)">Level 3 (Severe)</option>
                <option value="Level 4 (Critical/OPEL 4)">Level 4 (Critical / OPEL 4)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Main Pressures & Areas Under Pressure & Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Main Pressures (Max 3) */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Main Operational Pressures
              </h3>
              <span className="text-[10px] text-slate-500 font-semibold">
                {mainPressures.length}/3 selected
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Select up to three primary system drivers:</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {settings.pressureCategories.map(cat => {
                const isSelected = mainPressures.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleTogglePressure(cat)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-[#005EB8] text-white border-[#00478F] shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Areas Under Pressure */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Areas Under Pressure
              </h3>
              <span className="text-[10px] text-slate-500 font-semibold">
                Multi-select
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Clinical zones operating near or above capacity:</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {settings.pressuredAreaOptions.map(area => {
                const isSelected = pressuredAreas.includes(area);
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => handleToggleArea(area)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {area}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trend Since Last Huddle */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-2 text-xs">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Trend Since Last Huddle
              </h3>
            </div>
            <p className="text-[11px] text-slate-400">Direction of travel in ED activity and outflow:</p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { id: 'Improving', label: 'Improving', icon: TrendingDown, color: 'text-emerald-700 border-emerald-300 bg-emerald-50' },
                { id: 'Stable', label: 'Stable', icon: Minus, color: 'text-blue-700 border-blue-300 bg-blue-50' },
                { id: 'Deteriorating', label: 'Deteriorating', icon: TrendingUp, color: 'text-red-700 border-red-300 bg-red-50' },
              ].map(t => {
                const Icon = t.icon;
                const isSelected = trend === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTrend(t.id as TrendType)}
                    className={`flex flex-col items-center justify-center p-3 rounded-md border text-center transition-all ${
                      isSelected
                        ? `${t.color} font-bold ring-2 ring-current shadow-xs`
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Structured Notes & Operational Escalations */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-3 text-xs">
          <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Structured Operational Notes & Escalations
            </h3>
            <span className="text-[11px] text-slate-400">Predefined concise handover entries</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                What changed since previous huddle?
              </label>
              <textarea
                rows={2}
                value={changeSincePrevious}
                onChange={(e) => setChangeSincePrevious(e.target.value)}
                placeholder="e.g. Surge of 12 ambulance arrivals in last hour..."
                className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-[#005EB8]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Main Operational Risk
              </label>
              <textarea
                rows={2}
                value={mainRisk}
                onChange={(e) => setMainRisk(e.target.value)}
                placeholder="e.g. Medical bed gridlock, telemetry capacity exhausted..."
                className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-[#005EB8]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Positive Development
              </label>
              <textarea
                rows={2}
                value={positiveDevelopment}
                onChange={(e) => setPositiveDevelopment(e.target.value)}
                placeholder="e.g. Ambulatory streaming discharges accelerated..."
                className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-[#005EB8]"
              />
            </div>
          </div>

          {/* Formal Escalation Box */}
          <div className="bg-amber-50/40 border border-amber-200 rounded-md p-3 space-y-2">
            <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Formal Operational Escalation</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Escalation Issue
                </label>
                <input
                  type="text"
                  value={escalationIssue}
                  onChange={(e) => setEscalationIssue(e.target.value)}
                  placeholder="e.g. 4 patients in Resus awaiting acute medical admission"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Action Requested
                </label>
                <input
                  type="text"
                  value={actionRequested}
                  onChange={(e) => setActionRequested(e.target.value)}
                  placeholder="e.g. Discharge lounge expedited transfers, morning ward rounds"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Escalated To
                </label>
                <input
                  type="text"
                  value={escalatedTo}
                  onChange={(e) => setEscalatedTo(e.target.value)}
                  placeholder="e.g. Site Duty Manager, Clinical Director"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Escalation Time
                </label>
                <input
                  type="time"
                  value={escalationTime}
                  onChange={(e) => setEscalationTime(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Response / Current Status
                </label>
                <input
                  type="text"
                  value={escalationResponse}
                  onChange={(e) => setEscalationResponse(e.target.value)}
                  placeholder="e.g. Site team opening discharge lounge surge beds"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Priority for the Next Huddle or Day Team
            </label>
            <input
              type="text"
              value={nextPriority}
              onChange={(e) => setNextPriority(e.target.value)}
              placeholder="e.g. 11:00 Site meeting, clear Resus trolley queue, check microbiology results..."
              className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-[#005EB8]"
            />
          </div>
        </div>

        {/* Bottom Save Action */}
        <div className="flex justify-end gap-2 pb-4">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-[#007F3B] hover:bg-[#00662F] text-white px-5 py-2.5 rounded-md text-xs font-bold shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Department Snapshot'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
