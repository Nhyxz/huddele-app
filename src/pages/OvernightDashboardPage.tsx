import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MetricsService, OvernightDashboardMetrics } from '../services/MetricsService';
import { ReportGeneratorService } from '../services/ReportGeneratorService';
import { 
  FileText, 
  Printer, 
  Download, 
  Copy, 
  RefreshCw, 
  Calendar, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  Layers, 
  ShieldAlert,
  Sparkles,
  Lock,
  ExternalLink
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export const OvernightDashboardPage: React.FC = () => {
  const { huddles, actions, snapshots, sources, refreshData, showNotification } = useApp();

  const [selectedDate, setSelectedDate] = useState<string>('2025-05-26');
  const [reportingPeriod, setReportingPeriod] = useState<string>('24h');
  const [copied, setCopied] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Compute metrics for selected date
  const metrics = MetricsService.computeOvernightDashboard(selectedDate, huddles, actions, snapshots);
  const executiveSummary = ReportGeneratorService.generateDeterministicExecutiveSummary(metrics);

  const handleCopySummary = () => {
    navigator.clipboard.writeText(executiveSummary);
    setCopied(true);
    showNotification('Executive summary copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportReport = () => {
    const reportContent = `NHS EMERGENCY DEPARTMENT - OPERATIONAL HANDOVER DASHBOARD
Report Date: ${selectedDate}
Reporting Period: ${reportingPeriod}
Generated: ${new Date().toISOString()}

EXECUTIVE SUMMARY:
${executiveSummary}

KEY PERFORMANCE INDICATORS:
- Huddles Completed: ${metrics.huddlesCompleted}
- Operational Actions Raised: ${metrics.actionsRaised}
- Actions Resolved/Completed: ${metrics.actionsCompleted}
- Outstanding Unresolved Actions: ${metrics.outstandingActions}
- Critical Risks: ${metrics.criticalRisks}
- Department Escalations: ${metrics.escalationsCount}
- Patients Exceeding 12 Hours: ${metrics.patientsOver12Hours}
- Highest Recorded ED Pressure: ${metrics.highestPressureLevel}

OUTSTANDING CRITICAL ACTIONS:
${metrics.criticalOutstandingActions.map(a => `[${a.initials} - ${a.location}] (${a.priority}) ${a.description} - Holder: ${a.holder}`).join('\n')}

DAY TEAM PRIORITIES:
${metrics.dayTeamPriorities.map(p => `- ${p}`).join('\n')}
`;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ED_Operational_Handover_Report_${selectedDate}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
    showNotification('Dashboard metrics refreshed', 'info');
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#F0F4F5] p-3 space-y-4">
      {/* 1. Dashboard Header & Selector Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#005EB8]" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Overnight Operational Dashboard & Handover Report
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            24-Hour telemetry, pressure progression, and clinical handovers across all department shifts
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Picker */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-none text-xs"
            />
          </div>

          {/* Reporting Period */}
          <select
            value={reportingPeriod}
            onChange={(e) => setReportingPeriod(e.target.value)}
            className="border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-slate-50 font-medium text-slate-700"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="night">Night Shift (20:00 - 08:00)</option>
            <option value="day">Day Shift (08:00 - 20:00)</option>
          </select>

          {/* Actions */}
          <button
            type="button"
            onClick={handleRefresh}
            className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-1.5 rounded text-xs font-semibold shadow-2xs"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? 'Copied' : 'Copy Summary'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportReport}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-1.5 rounded text-xs font-semibold shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-[#005EB8] hover:bg-[#00478F] text-white px-3.5 py-1.5 rounded text-xs font-bold shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Source Toggles Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-xs text-xs space-y-2 no-print">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
            Reporting Data Sources
          </span>
          <span className="text-[10px] text-slate-400">
            Active Prototype Sources vs. Future Enterprise Connectors
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {sources.map(src => (
            <div
              key={src.id}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border ${
                src.enabled
                  ? 'bg-blue-50 text-[#005EB8] border-blue-200 font-semibold'
                  : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-75'
              }`}
              title={src.description}
            >
              {src.enabled ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#005EB8]" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>{src.name}</span>
              {!src.enabled && (
                <span className="text-[9px] bg-slate-200 text-slate-600 px-1 py-0.2 rounded font-normal">
                  Requires Connection
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Print-only Banner Header */}
      <div className="hidden print-only bg-[#005EB8] text-white p-4 rounded mb-4">
        <h1 className="text-xl font-bold">NHS Emergency Department - Operational Handover Report</h1>
        <p className="text-xs text-blue-100">
          Date: {selectedDate} | Reporting Period: {reportingPeriod} | St Jude NHS Foundation Trust
        </p>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs card-print">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Huddles Completed</div>
          <div className="text-xl font-black text-slate-900 mt-1">{metrics.huddlesCompleted}</div>
          <div className="text-[10px] text-slate-500">of 7 shifts</div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs card-print">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Actions Raised</div>
          <div className="text-xl font-black text-slate-900 mt-1">{metrics.actionsRaised}</div>
          <div className="text-[10px] text-blue-600 font-medium">Logged today</div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs card-print">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Actions Resolved</div>
          <div className="text-xl font-black text-emerald-700 mt-1">{metrics.actionsCompleted}</div>
          <div className="text-[10px] text-emerald-600 font-semibold">
            {metrics.actionsRaised > 0 ? Math.round((metrics.actionsCompleted / metrics.actionsRaised) * 100) : 0}% rate
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs card-print">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Outstanding</div>
          <div className="text-xl font-black text-amber-700 mt-1">{metrics.outstandingActions}</div>
          <div className="text-[10px] text-amber-600 font-medium">In hand / Active</div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs card-print">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Critical Risks</div>
          <div className="text-xl font-black text-red-700 mt-1">{metrics.criticalRisks}</div>
          <div className="text-[10px] text-red-600 font-medium">Priority 1 items</div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs card-print">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Escalations</div>
          <div className="text-xl font-black text-purple-700 mt-1">{metrics.escalationsCount}</div>
          <div className="text-[10px] text-purple-600 font-medium">Formally routed</div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs card-print">
          <div className="text-[10px] font-bold text-slate-400 uppercase">&gt; 12h Breaches</div>
          <div className="text-xl font-black text-purple-900 mt-1">{metrics.patientsOver12Hours}</div>
          <div className="text-[10px] text-purple-700 font-medium">DTA patients</div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs card-print">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Peak Pressure</div>
          <div className="text-sm font-black text-red-700 mt-2 truncate" title={metrics.highestPressureLevel}>
            {metrics.highestPressureLevel.split(' ')[0]} {metrics.highestPressureLevel.split(' ')[1]}
          </div>
          <div className="text-[10px] text-slate-500">Highest tier</div>
        </div>
      </div>

      {/* 3. Section 1: Executive Summary */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-2 card-print">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#005EB8]" />
            <span>1. Executive Summary & Operational Briefing</span>
          </h3>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono border border-slate-200">
            Prototype summary generated from structured demonstration data
          </span>
        </div>
        <p className="text-xs text-slate-800 leading-relaxed font-sans bg-blue-50/30 p-3 rounded border border-blue-100">
          {executiveSummary}
        </p>
      </div>

      {/* 4. Sections 2 & 3: Department Pressure Timeline & Main Operational Pressures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Timeline Chart */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs card-print space-y-2">
          <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              2. Department Pressure & Inflow Timeline (24h)
            </h3>
            <span className="text-[10px] text-slate-400">OPEL Levels 1 to 4</span>
          </div>
          <div className="h-56 w-full text-xs pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.pressureTimeline}>
                <XAxis dataKey="time" stroke="#768692" fontSize={11} />
                <YAxis domain={[1, 4]} stroke="#768692" fontSize={11} ticks={[1, 2, 3, 4]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="pressure" stroke="#005EB8" strokeWidth={2} name="Pressure Level (1-4)" activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="breaches" stroke="#7C3AED" strokeWidth={2} strokeDasharray="3 3" name="12h Breaches" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Theme Frequency Chart */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs card-print space-y-2">
          <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              3. Operational Pressure Themes Frequency
            </h3>
            <span className="text-[10px] text-slate-400">Logged Huddle Occurrences</span>
          </div>
          <div className="h-56 w-full text-xs pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.themeFrequency.slice(0, 6)} layout="vertical">
                <XAxis type="number" stroke="#768692" fontSize={11} />
                <YAxis type="category" dataKey="theme" stroke="#768692" fontSize={10} width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#005EB8" name="Occurrences" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. Sections 4, 5 & 6: Action Status Breakdown, Priority Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Action Status Breakdown */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs card-print space-y-2">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
            4. Action Status Resolution Breakdown
          </h3>
          <div className="h-44 w-full flex items-center justify-center pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={metrics.actionStatusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} label>
                  {metrics.actionStatusBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs card-print space-y-2">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
            5. Priority & Clinical Acuity Breakdown
          </h3>
          <div className="space-y-2 pt-2 text-xs">
            {metrics.priorityBreakdown.map(p => (
              <div key={p.priority} className="flex items-center justify-between">
                <span className="font-medium text-slate-700">{p.priority}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-2 rounded-full ${
                        p.priority === 'Critical' ? 'bg-red-600' :
                        p.priority === 'High' ? 'bg-amber-500' :
                        p.priority === 'Medium' ? 'bg-blue-500' : 'bg-slate-400'
                      }`}
                      style={{ width: `${metrics.actionsRaised > 0 ? (p.count / metrics.actionsRaised) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="font-mono font-bold w-6 text-right">{p.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Positive Developments */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs card-print space-y-2">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2 text-emerald-800">
            6. Positive Developments & Mitigations
          </h3>
          <div className="space-y-2 pt-1 text-xs">
            {metrics.positiveDevelopments.map((dev, idx) => (
              <div key={idx} className="p-2 bg-emerald-50/60 border border-emerald-200 rounded text-emerald-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-[11px] leading-tight">{dev}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Section 7: Outstanding Critical Actions */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs card-print space-y-2">
        <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 text-red-700">
            <AlertTriangle className="w-4 h-4" />
            <span>7. Outstanding Critical & High-Priority Actions</span>
          </h3>
          <span className="text-[10px] text-slate-500">Requires immediate attention from incoming day lead</span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-700 text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-2 py-1.5">Initials</th>
                <th className="px-2 py-1.5">Location</th>
                <th className="px-2 py-1.5">LOS</th>
                <th className="px-2 py-1.5">Action Description</th>
                <th className="px-2 py-1.5">Holder</th>
                <th className="px-2 py-1.5">Priority</th>
                <th className="px-2 py-1.5">Status</th>
                <th className="px-2 py-1.5">Comments & Escalation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {metrics.criticalOutstandingActions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-slate-400">
                    No critical outstanding actions for this date.
                  </td>
                </tr>
              ) : (
                metrics.criticalOutstandingActions.map(a => (
                  <tr key={a.id} className="hover:bg-red-50/30">
                    <td className="px-2 py-1.5 font-bold font-mono text-slate-900">{a.initials}</td>
                    <td className="px-2 py-1.5 font-semibold text-slate-700">{a.location}</td>
                    <td className="px-2 py-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${
                        a.losCategory === '> 12h' ? 'bg-[#7C3AED]' : 'bg-[#DC2626]'
                      }`}>
                        {a.losCategory}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 font-medium text-slate-900">{a.description}</td>
                    <td className="px-2 py-1.5 text-slate-600">{a.holder}</td>
                    <td className="px-2 py-1.5">
                      <span className="text-red-700 font-bold bg-red-100 px-1 py-0.2 rounded text-[10px]">
                        {a.priority}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-amber-700 font-semibold">{a.status}</td>
                    <td className="px-2 py-1.5 text-slate-600 truncate max-w-xs">{a.comments || a.escalationResponse || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Section 8 & 9: Escalations and Responses & Priorities for Day Team */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Escalations Table */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs card-print space-y-2">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
            8. Department Clinical & Operational Escalations
          </h3>
          <div className="space-y-2 text-xs">
            {metrics.escalationList.map((esc, i) => (
              <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-800">
                <div className="flex items-center justify-between font-bold text-slate-900 mb-0.5">
                  <span>{esc.actionOrSnap}</span>
                  <span className="text-[10px] text-slate-500 font-mono">Time: {esc.time}</span>
                </div>
                <div className="text-red-700 font-medium">{esc.issue}</div>
                <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                  <span>Escalated to: <strong>{esc.to}</strong></span>
                  <span className="text-emerald-700 font-medium">Status: {esc.response}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priorities for Day Team */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs card-print space-y-2">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2 text-[#005EB8]">
            9. Priorities for Incoming Day Team
          </h3>
          <div className="space-y-2 text-xs pt-1">
            {metrics.dayTeamPriorities.map((priority, index) => (
              <div key={index} className="p-3 bg-blue-50/50 border border-blue-200 rounded text-slate-900 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#005EB8] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <span className="font-medium text-xs leading-relaxed">{priority}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 8. Sections 10 & 11: Source Comparison & Audit History */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs card-print space-y-3">
        <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
            10. Source Telemetry & Governance Status
          </h3>
          <span className="text-[10px] text-slate-400">Trust Data Governance Framework</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
          {sources.map(src => (
            <div key={src.id} className="p-2.5 rounded border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-800">{src.name}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                  src.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {src.status}
                </span>
              </div>
              <p className="text-[10px] text-slate-500">{src.connectionType}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
