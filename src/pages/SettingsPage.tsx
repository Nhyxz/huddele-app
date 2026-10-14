import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportPrototypeData, importPrototypeData } from '../repositories';
import { 
  Settings, 
  Download, 
  Upload, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Save, 
  Plus, 
  Trash2,
  ShieldAlert,
  Server
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetAllDemoData, refreshData, showNotification } = useApp();

  const [departmentName, setDepartmentName] = useState(settings.departmentName);
  const [hospitalName, setHospitalName] = useState(settings.hospitalName);
  const [locations, setLocations] = useState<string[]>([...settings.locations]);
  const [newLocation, setNewLocation] = useState('');
  const [actionHolders, setActionHolders] = useState<string[]>([...settings.actionHolders]);
  const [newHolder, setNewHolder] = useState('');

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      departmentName,
      hospitalName,
      locations,
      actionHolders,
    });
  };

  const handleAddLocation = () => {
    if (!newLocation.trim()) return;
    if (locations.includes(newLocation.trim())) return;
    setLocations([...locations, newLocation.trim()]);
    setNewLocation('');
  };

  const handleRemoveLocation = (loc: string) => {
    setLocations(locations.filter(l => l !== loc));
  };

  const handleAddHolder = () => {
    if (!newHolder.trim()) return;
    if (actionHolders.includes(newHolder.trim())) return;
    setActionHolders([...actionHolders, newHolder.trim()]);
    setNewHolder('');
  };

  const handleRemoveHolder = (holder: string) => {
    setActionHolders(actionHolders.filter(h => h !== holder));
  };

  const handleExportData = async () => {
    const json = await exportPrototypeData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ED_Huddle_Prototype_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('Exported full prototype JSON backup', 'success');
  };

  const handleImportData = async () => {
    if (!importJsonText.trim()) return;
    const res = await importPrototypeData(importJsonText);
    if (res.success) {
      showNotification(res.message, 'success');
      await refreshData();
      setImportModalOpen(false);
      setImportJsonText('');
    } else {
      showNotification(res.message, 'error');
    }
  };

  const handleConfirmReset = async () => {
    await resetAllDemoData();
    setResetModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#F0F4F5] p-3 space-y-3">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#005EB8]" />
            <span>Prototype Settings & Configuration</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure department locations, action owners, JSON data backup, and demo reset
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportData}
            className="flex items-center gap-1.5 bg-[#005EB8] hover:bg-[#00478F] text-white px-3.5 py-1.5 rounded text-xs font-semibold shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON Data</span>
          </button>

          <button
            type="button"
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3.5 py-1.5 rounded text-xs font-semibold shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-[#005EB8]" />
            <span>Import JSON</span>
          </button>
        </div>
      </div>

      {/* Warning Box */}
      <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded text-xs text-amber-900 flex items-start gap-2.5">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold mb-0.5">Prototype Local Browser Storage Warning</h4>
          <p className="leading-relaxed">
            All configuration parameters and mock patient actions are persisted exclusively in your current browser&apos;s LocalStorage. This data is not shared with any external servers, Microsoft Dataverse, or NHS networks.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-3">
        {/* Department Info */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs border-b border-slate-100 pb-2">
            Department & Trust Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department Name</label>
              <input
                type="text"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-[#005EB8]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">NHS Trust Name</label>
              <input
                type="text"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-[#005EB8]"
              />
            </div>
          </div>
        </div>

        {/* Locations List Management */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs border-b border-slate-100 pb-2">
            Department Locations & Bed Areas ({locations.length})
          </h3>
          <div className="flex gap-2 max-w-md">
            <input
              type="text"
              placeholder="e.g. Resus 4, Majors 14, Triage Bay..."
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              className="flex-1 border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-[#005EB8]"
            />
            <button
              type="button"
              onClick={handleAddLocation}
              className="px-3 py-1.5 bg-[#005EB8] text-white rounded text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1 max-h-36 overflow-y-auto">
            {locations.map(loc => (
              <span
                key={loc}
                className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 px-2.5 py-1 rounded text-xs border border-slate-200"
              >
                <span>{loc}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveLocation(loc)}
                  className="text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Action Holders Management */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs border-b border-slate-100 pb-2">
            Action Holders / Clinical Roles ({actionHolders.length})
          </h3>
          <div className="flex gap-2 max-w-md">
            <input
              type="text"
              placeholder="e.g. Dr Williams, Trauma Nurse, Bed Manager..."
              value={newHolder}
              onChange={(e) => setNewHolder(e.target.value)}
              className="flex-1 border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-[#005EB8]"
            />
            <button
              type="button"
              onClick={handleAddHolder}
              className="px-3 py-1.5 bg-[#005EB8] text-white rounded text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1 max-h-36 overflow-y-auto">
            {actionHolders.map(holder => (
              <span
                key={holder}
                className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 px-2.5 py-1 rounded text-xs border border-slate-200"
              >
                <span>{holder}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveHolder(holder)}
                  className="text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end gap-2">
          <button
            type="submit"
            className="flex items-center gap-1.5 bg-[#007F3B] hover:bg-[#00662F] text-white px-4 py-2 rounded text-xs font-bold shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>

      {/* Danger Zone: Data Reset */}
      <div className="bg-white rounded-lg border border-red-200 p-4 shadow-xs space-y-2 text-xs">
        <h3 className="font-bold text-red-700 uppercase tracking-wider text-xs flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4" />
          <span>Demonstration Data Reset</span>
        </h3>
        <p className="text-slate-600">
          Reverts all huddles, actions, department snapshots, and audit logs to the pristine seed demonstration dataset.
        </p>
        <button
          type="button"
          onClick={() => setResetModalOpen(true)}
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded text-xs font-bold shadow-xs transition-colors mt-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demonstration Data</span>
        </button>
      </div>

      {/* Reset Confirmation Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full border border-slate-200 p-5 space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Reset All Demo Data?</span>
            </div>
            <p className="text-xs text-slate-600">
              This will restore all default huddles, 25 fictional actions, and snapshots. Any changes you made will be replaced.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="px-3 py-1.5 rounded text-xs text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JSON Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-slate-200 p-5 space-y-3 animate-in fade-in zoom-in-95 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">Import Prototype Data JSON</h3>
            <p className="text-slate-500">
              Paste the exported JSON backup below to restore your dataset.
            </p>
            <textarea
              rows={6}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="Paste JSON content here..."
              className="w-full border border-slate-300 rounded p-2 font-mono text-[11px] focus:ring-1 focus:ring-[#005EB8]"
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="px-3 py-1.5 rounded text-slate-600 hover:bg-slate-100 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportData}
                className="px-3.5 py-1.5 bg-[#005EB8] hover:bg-[#00478F] text-white rounded font-bold text-xs"
              >
                Import & Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
