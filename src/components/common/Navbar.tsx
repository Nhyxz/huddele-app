import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../models';
import { Settings, ShieldAlert, User, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { currentHuddle, activeRole, setActiveRole, settings } = useApp();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const roles: UserRole[] = [
    'Huddle Coordinator',
    'Nurse in Charge',
    'Operational Manager',
    'Read Only Viewer',
    'System Administrator',
  ];

  const getStatusBadge = () => {
    if (!currentHuddle) return null;
    switch (currentHuddle.status) {
      case 'In Progress':
        return <span className="bg-emerald-500/20 text-emerald-100 border border-emerald-400/40 text-xs px-2 py-0.5 rounded font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>Live Huddle In Progress</span>;
      case 'Completed':
        return <span className="bg-blue-400/20 text-blue-100 border border-blue-300/40 text-xs px-2 py-0.5 rounded font-medium flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-blue-200" />Completed</span>;
      default:
        return <span className="bg-amber-400/20 text-amber-100 border border-amber-300/40 text-xs px-2 py-0.5 rounded font-medium">Scheduled</span>;
    }
  };

  return (
    <header className="bg-[#005EB8] text-white shadow-md relative z-40 select-none">
      {/* Top Banner Row */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-blue-400/30">
        {/* Left: NHS Brand & Title */}
        <div className="flex items-center gap-3.5">
          <div className="bg-white text-[#005EB8] font-black text-xl px-2.5 py-0.5 rounded tracking-tighter leading-none shadow-sm flex items-center justify-center h-8">
            NHS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white leading-tight">
                Emergency Department
              </h1>
              <span className="text-xs bg-[#003087] text-blue-100 px-2 py-0.5 rounded font-mono font-medium border border-blue-400/30">
                Huddle Action Tracker
              </span>
            </div>
            <p className="text-[11px] text-blue-100/90 leading-none mt-0.5">
              {settings.hospitalName || 'St Jude NHS Foundation Trust'} • Clinical Operations
            </p>
          </div>
        </div>

        {/* Center: Live Date & Active Huddle Indicator */}
        <div className="hidden md:flex items-center gap-3 text-xs bg-[#00478F] px-3 py-1.5 rounded border border-blue-300/30">
          <div className="flex items-center gap-2 font-medium">
            <span className="text-blue-200">Date:</span>
            <span>{currentHuddle?.date ? new Date(currentHuddle.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'Mon 26 May 2025'}</span>
          </div>
          <span className="text-blue-300/40">|</span>
          <div className="flex items-center gap-2 font-medium">
            <span className="text-blue-200">Current Huddle:</span>
            <span className="font-bold text-white">{currentHuddle?.time || '10:00'} ({currentHuddle?.type || 'Dispo'})</span>
          </div>
          <span className="text-blue-300/40">|</span>
          <div className="flex items-center gap-1.5">
            {getStatusBadge()}
          </div>
        </div>

        {/* Right: Demo Role, User Info, Slogan */}
        <div className="flex items-center gap-3">
          {/* Prototype Badge */}
          <div className="hidden lg:flex items-center gap-1.5 bg-amber-500/20 text-amber-100 border border-amber-300/30 px-2 py-1 rounded text-[11px]">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
            <span className="font-medium">Prototype Data (Fictional)</span>
          </div>

          {/* Demonstration Role Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-1.5 bg-[#003087] hover:bg-[#00256B] text-white text-xs px-2.5 py-1.5 rounded border border-blue-300/40 transition-colors"
              title="Change demonstration role to preview UI permissions"
            >
              <User className="w-3.5 h-3.5 text-blue-200" />
              <span className="hidden sm:inline text-blue-200 text-[11px]">Demo Role:</span>
              <span className="font-semibold text-xs">{activeRole}</span>
              <ChevronDown className="w-3 h-3 text-blue-300" />
            </button>

            {roleDropdownOpen && (
              <div 
                className="absolute right-0 mt-1 w-56 bg-white text-slate-800 rounded-md shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in slide-in-from-top-1"
                onMouseLeave={() => setRoleDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Switch Demonstration Role
                </div>
                {roles.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setActiveRole(r);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      activeRole === r ? 'bg-blue-50 text-[#005EB8] font-bold' : 'text-slate-700'
                    }`}
                  >
                    <span>{r}</span>
                    {activeRole === r && <span className="w-1.5 h-1.5 rounded-full bg-[#005EB8]"></span>}
                  </button>
                ))}
                <div className="px-3 py-1.5 text-[10px] text-slate-500 bg-slate-50 border-t border-slate-100 mt-1">
                  For UX evaluation only (No real auth)
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2 pl-1 border-l border-blue-400/30">
            <div className="w-7 h-7 rounded-full bg-[#003087] flex items-center justify-center text-xs font-bold text-white border border-blue-300/50">
              AG
            </div>
            <div className="hidden xl:block text-right">
              <div className="text-xs font-semibold leading-tight">Alex Ganea</div>
              <div className="text-[10px] text-blue-200 leading-none">Sister / Huddle Lead</div>
            </div>
          </div>

          {/* Settings icon */}
          <Link
            to="/settings"
            className="p-1.5 text-blue-100 hover:text-white hover:bg-blue-700/50 rounded transition-colors"
            title="System Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>

          {/* Trust Motto */}
          <div className="hidden 2xl:flex flex-col text-right pl-3 border-l border-blue-400/30">
            <span className="text-[11px] font-semibold italic text-blue-100 tracking-wide">
              Outstanding care
            </span>
            <span className="text-[10px] text-blue-200">
              to every patient
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
