import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  ListTodo, 
  Clock, 
  Activity, 
  FileText, 
  Calendar, 
  Settings as SettingsIcon, 
  HelpCircle,
  X,
  FileCheck2,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Sidebar: React.FC = () => {
  const [showHelpModal, setShowHelpModal] = useState(false);
  const { currentHuddleActions } = useApp();

  const outstandingCount = currentHuddleActions.filter(
    a => a.status !== 'Completed' && a.status !== 'Cancelled' && a.status !== 'Transferred'
  ).length;

  const navItems = [
    {
      to: '/',
      label: 'Live Huddle',
      sublabel: 'Huddle Actions',
      icon: ListTodo,
      badge: currentHuddleActions.length > 0 ? `${currentHuddleActions.length}` : undefined,
    },
    {
      to: '/actions',
      label: 'Actions Registry',
      sublabel: 'Outstanding Actions',
      icon: Clock,
      badge: outstandingCount > 0 ? `${outstandingCount}` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    {
      to: '/snapshot',
      label: 'ED State of Play',
      sublabel: 'Department Snapshot',
      icon: Activity,
    },
    {
      to: '/dashboard',
      label: 'Overnight Dashboard',
      sublabel: 'Reports & Export',
      icon: FileText,
    },
    {
      to: '/history',
      label: 'Huddle History',
      sublabel: 'Past Audits',
      icon: Calendar,
    },
    {
      to: '/settings',
      label: 'Settings',
      sublabel: 'Config & Backup',
      icon: SettingsIcon,
    },
  ];

  return (
    <>
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col justify-between select-none shadow-sm flex-shrink-0 z-20">
        <div className="py-3">
          <div className="px-4 mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Navigation Menu
            </span>
          </div>
          <nav className="space-y-0.5 px-2">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#EBF3FB] text-[#005EB8] font-bold shadow-sm border-l-4 border-[#005EB8]'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-l-4 border-transparent'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="leading-tight">{item.label}</span>
                      <span className="text-[10px] text-slate-400 leading-tight font-normal">{item.sublabel}</span>
                    </div>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-mono font-semibold ${item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Help & Governance Button */}
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:text-[#005EB8] hover:bg-white rounded border border-slate-200 shadow-sm transition-all"
          >
            <HelpCircle className="w-4 h-4 text-[#005EB8]" />
            <span>Help & Operational Guide</span>
          </button>
        </div>
      </aside>

      {/* Help & Guide Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#005EB8] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5" />
                <h3 className="font-bold text-sm">ED Huddle System Quick Guide</h3>
              </div>
              <button 
                onClick={() => setShowHelpModal(false)}
                className="text-blue-100 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 space-y-4 text-xs text-slate-700 max-h-[80vh] overflow-y-auto">
              <div className="p-3 bg-blue-50 border-l-4 border-[#005EB8] rounded text-slate-800">
                <div className="font-bold text-xs text-[#005EB8] mb-1">Prototype Information Notice</div>
                This application replaces the Excel-based ED huddle sheet. It runs as a local demonstration prototype. All patient records, bed numbers, and initials are fictional.
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1 text-xs uppercase tracking-wider">Key Operational Workflows:</h4>
                <ul className="list-disc pl-4 space-y-1.5">
                  <li><strong>Live Huddle:</strong> Review active patient actions, record clinical updates, mark completions or escalations.</li>
                  <li><strong>Transfer Unactioned:</strong> Carry forward uncompleted actions into the next shift or huddle. Prevents dropped actions and ensures clear audit trails.</li>
                  <li><strong>ED State of Play (Department Snapshot):</strong> Log bed pressures, escalation issues, and department trend at each huddle.</li>
                  <li><strong>Overnight Dashboard:</strong> View 24-hour summary, pressure timelines, breakdown charts, and print clean handover reports.</li>
                  <li><strong>Actions Registry:</strong> Filter all actions across huddles and export to CSV.</li>
                </ul>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <h4 className="font-bold text-slate-900 mb-1 text-xs">Keyboard Shortcuts & Usability:</h4>
                <p className="text-slate-600">
                  Use Tab / Shift-Tab to navigate between table rows and inputs. Use Esc to close slide-over panels and modals.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="bg-[#005EB8] hover:bg-[#00478F] text-white text-xs font-semibold px-4 py-2 rounded shadow-sm"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
