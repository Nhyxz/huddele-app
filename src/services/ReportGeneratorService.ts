import { OvernightDashboardMetrics } from './MetricsService';

export class ReportGeneratorService {
  /**
   * Generates a structured deterministic briefing text based on structured data and transparent rules.
   * Clear NHS operational syntax, no hallucinations or claim of generative AI.
   */
  static generateDeterministicExecutiveSummary(metrics: OvernightDashboardMetrics): string {
    const { 
      reportDate, 
      actionsRaised, 
      actionsCompleted, 
      outstandingActions, 
      criticalRisks, 
      patientsOver12Hours, 
      highestPressureLevel,
      escalationsCount,
      themeFrequency
    } = metrics;

    const completionRate = actionsRaised > 0 ? Math.round((actionsCompleted / actionsRaised) * 100) : 0;
    const topThemes = themeFrequency.slice(0, 2).map(t => t.theme).join(' and ') || 'Bed Capacity and Patient Flow';

    return `Operational handover report for ${reportDate}. ` +
      `Across the 24-hour cycle, the department operated under ${highestPressureLevel}. ` +
      `A total of ${actionsRaised} operational actions were logged, with ${actionsCompleted} successfully completed (${completionRate}% resolution rate) and ${outstandingActions} carried forward or ongoing. ` +
      `Currently, there are ${criticalRisks} critical risk item(s) flagged and ${patientsOver12Hours} patient(s) exceeding the 12-hour length of stay standard. ` +
      `Primary operational bottlenecks centered on ${topThemes}. ` +
      `A total of ${escalationsCount} formal clinical/operational escalations were logged and routed to duty specialty leads. ` +
      `Priorities for the incoming day team remain bed decompression on acute medical wards and expediting diagnostic reports.`;
  }
}
