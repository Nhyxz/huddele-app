import React, { useState, useEffect } from 'react';
import { OperationalAction, ActionPriority, ActionStatus, LOSCategory } from '../../models';
import { useApp } from '../../context/AppContext';
import { X, Save, PlusCircle, AlertCircle, AlertTriangle } from 'lucide-react';

interface ActionSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  actionToEdit?: OperationalAction | null;
}

export const ActionSlideOver: React.FC<ActionSlideOverProps> = ({
  isOpen,
  onClose,
  actionToEdit,
}) => {
  const { currentHuddle, settings, saveAction } = useApp();

  const [initials, setInitials] = useState('');
  const [location, setLocation] = useState('');
  const [losHours, setLosHours] = useState<number>(2.5);
  const [losCategory, setLosCategory] = useState<LOSCategory>('2 - 3h');
  const [description, setDescription] = useState('');
  const [holder, setHolder] = useState('');
  const [priority, setPriority] = useState<ActionPriority>('Routine');
  const [status, setStatus] = useState<ActionStatus>('New');
  const [targetReviewTime, setTargetReviewTime] = useState('');
  const [comments, setComments] = useState('');
  const [escalationRequired, setEscalationRequired] = useState(false);
  const [escalatedTo, setEscalatedTo] = useState('');
  const [escalationTime, setEscalationTime] = useState('');
  const [escalationResponse, setEscalationResponse] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate values when editing or reset for adding
  useEffect(() => {
    if (actionToEdit) {
      setInitials(actionToEdit.initials);
      setLocation(actionToEdit.location);
      setLosHours(actionToEdit.losHours);
      setLosCategory(actionToEdit.losCategory);
      setDescription(actionToEdit.description);
      setHolder(actionToEdit.holder);
      setPriority(actionToEdit.priority);
      setStatus(actionToEdit.status);
      setTargetReviewTime(actionToEdit.targetReviewTime || '');
      setComments(actionToEdit.comments);
      setEscalationRequired(actionToEdit.escalationRequired);
      setEscalatedTo(actionToEdit.escalatedTo || '');
      setEscalationTime(actionToEdit.escalationTime || '');
      setEscalationResponse(actionToEdit.escalationResponse || '');
    } else {
      setInitials('');
      setLocation(settings.locations[0] || 'Majors 1');
      setLosHours(1.5);
      setLosCategory('< 2h');
      setDescription('');
      setHolder(settings.actionHolders[0] || 'ED Nurse');
      setPriority('Routine');
      setStatus('New');
      setTargetReviewTime('11:00');
      setComments('');
      setEscalationRequired(false);
      setEscalatedTo('');
      setEscalationTime('');
      setEscalationResponse('');
    }
    setErrors({});
  }, [actionToEdit, settings, isOpen]);

  // Automatically update LOS category based on hours
  const handleLosHoursChange = (hours: number) => {
    setLosHours(hours);
    if (hours < 2) setLosCategory('< 2h');
    else if (hours <= 3) setLosCategory('2 - 3h');
    else if (hours <= 4) setLosCategory('3 - 4h');
    else if (hours <= 12) setLosCategory('4 - 12h');
    else setLosCategory('> 12h');
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!initials.trim()) {
      newErrors.initials = 'Patient initials are required (use fictional initials, e.g. AB).';
    } else if (initials.trim().length > 4) {
      newErrors.initials = 'Initials must be 2-3 characters max.';
    }

    if (!location.trim()) {
      newErrors.location = 'Bed or department location is required.';
    }

    if (!description.trim()) {
      newErrors.description = 'Action description is required.';
    }

    if (!holder.trim()) {
      newErrors.holder = 'Action holder is required.';
    }

    if (escalationRequired && !escalatedTo.trim()) {
      newErrors.escalatedTo = 'Please specify who this action is escalated to.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (andAddAnother: boolean = false) => {
    if (!validate()) return;

    await saveAction({
      id: actionToEdit?.id,
      huddleId: actionToEdit?.huddleId || currentHuddle?.id,
      initials: initials.toUpperCase().trim(),
      location,
      losHours,
      losCategory,
      description,
      holder,
      priority,
      status,
      targetReviewTime,
      comments,
      escalationRequired,
      escalatedTo,
      escalationTime,
      escalationResponse,
    });

    if (andAddAnother) {
      setInitials('');
      setDescription('');
      setComments('');
      setEscalationRequired(false);
      setEscalatedTo('');
      setEscalationResponse('');
      setErrors({});
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-2xs transition-opacity" 
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="bg-[#005EB8] text-white px-5 py-3.5 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm leading-tight">
                {actionToEdit ? 'Edit Operational Action' : 'Add New Operational Action'}
              </h3>
              <p className="text-[11px] text-blue-100 mt-0.5">
                {currentHuddle?.time} {currentHuddle?.type} Huddle • Fictional Demo Data
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-blue-100 hover:text-white p-1 rounded hover:bg-blue-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {/* Patient Initials & Location */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Patient Initials <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. AB (Fictional)"
                  value={initials}
                  onChange={(e) => setInitials(e.target.value.toUpperCase())}
                  className={`w-full border rounded px-2.5 py-1.5 text-xs font-mono uppercase font-bold focus:ring-1 focus:ring-[#005EB8] ${
                    errors.initials ? 'border-red-500 bg-red-50' : 'border-slate-300'
                  }`}
                />
                {errors.initials && (
                  <p className="text-[10px] text-red-600 mt-1">{errors.initials}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Location / Bed <span className="text-red-500">*</span>
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-[#005EB8]"
                >
                  {settings.locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
                {errors.location && (
                  <p className="text-[10px] text-red-600 mt-1">{errors.location}</p>
                )}
              </div>
            </div>

            {/* Current LOS & LOS Category */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded border border-slate-200">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Current LOS (Hours) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="48"
                  value={losHours}
                  onChange={(e) => handleLosHoursChange(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-[#005EB8]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  LOS Category
                </label>
                <select
                  value={losCategory}
                  onChange={(e) => setLosCategory(e.target.value as LOSCategory)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white font-semibold"
                >
                  <option value="< 2h">&lt; 2h</option>
                  <option value="2 - 3h">2 - 3h</option>
                  <option value="3 - 4h">3 - 4h</option>
                  <option value="4 - 12h">4 - 12h</option>
                  <option value="> 12h">&gt; 12h (Breach)</option>
                </select>
              </div>
            </div>

            {/* Action Description */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Action Required <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                placeholder="Specific clinical or operational action required..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full border rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-[#005EB8] ${
                  errors.description ? 'border-red-500 bg-red-50' : 'border-slate-300'
                }`}
              />
              {errors.description && (
                <p className="text-[10px] text-red-600 mt-1">{errors.description}</p>
              )}
            </div>

            {/* Action Holder & Target Review Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Action Holder <span className="text-red-500">*</span>
                </label>
                <select
                  value={holder}
                  onChange={(e) => setHolder(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-[#005EB8]"
                >
                  {settings.actionHolders.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                {errors.holder && (
                  <p className="text-[10px] text-red-600 mt-1">{errors.holder}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Review Time
                </label>
                <input
                  type="time"
                  value={targetReviewTime}
                  onChange={(e) => setTargetReviewTime(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-[#005EB8]"
                />
              </div>
            </div>

            {/* Priority & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as ActionPriority)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-[#005EB8]"
                >
                  <option value="Routine">Routine</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ActionStatus)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-[#005EB8]"
                >
                  <option value="New">New</option>
                  <option value="In Progress">In Progress (Pending)</option>
                  <option value="Awaiting Update">Awaiting Update (No)</option>
                  <option value="Completed">Completed (Yes)</option>
                  <option value="Transferred">Transferred</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Comments */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                General Comments / Huddle Notes
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Awaiting bloods, family updated, scan booked for 10:30..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-[#005EB8]"
              />
            </div>

            {/* Escalation Section */}
            <div className="border border-slate-200 rounded-md p-3 bg-amber-50/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={escalationRequired}
                    onChange={(e) => setEscalationRequired(e.target.checked)}
                    className="rounded text-red-600 focus:ring-0 w-4 h-4"
                  />
                  <span>Escalation Required?</span>
                </label>
                {escalationRequired && (
                  <span className="text-[10px] text-red-700 bg-red-100 font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    Escalated Action
                  </span>
                )}
              </div>

              {escalationRequired && (
                <div className="space-y-2 pt-2 border-t border-amber-200">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Escalated To <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Radiology Duty Consultant, Medical Reg, Site Lead..."
                      value={escalatedTo}
                      onChange={(e) => setEscalatedTo(e.target.value)}
                      className={`w-full border rounded px-2.5 py-1.5 text-xs bg-white ${
                        errors.escalatedTo ? 'border-red-500 bg-red-50' : 'border-slate-300'
                      }`}
                    />
                    {errors.escalatedTo && (
                      <p className="text-[10px] text-red-600 mt-1">{errors.escalatedTo}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
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
                        Response / Outcome
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Slot booked for 10:45"
                        value={escalationResponse}
                        onChange={(e) => setEscalationResponse(e.target.value)}
                        className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              {!actionToEdit && (
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-2 rounded text-xs font-semibold shadow-2xs transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-[#005EB8]" />
                  <span>Save & Add Another</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleSave(false)}
                className="flex items-center gap-1.5 bg-[#005EB8] hover:bg-[#00478F] text-white px-4 py-2 rounded text-xs font-bold shadow-sm transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Action</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
