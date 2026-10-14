import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { OperationalAction, Huddle } from '../../models';
import { 
  ArrowRightCircle, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  Layers, 
  Info 
} from 'lucide-react';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  singleActionToTransfer?: OperationalAction | null;
  initialSelectedIds?: string[];
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  singleActionToTransfer,
  initialSelectedIds,
}) => {
  const { currentHuddle, huddles, transferService, refreshData, showNotification, settings } = useApp();

  const [transferableActions, setTransferableActions] = useState<OperationalAction[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [destinationHuddleId, setDestinationHuddleId] = useState<string>('');
  const [transferNote, setTransferNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available destination huddles (all huddles except current)
  const candidateDestinations = huddles.filter(h => h.id !== currentHuddle?.id);

  useEffect(() => {
    if (!isOpen || !currentHuddle) return;

    const loadCandidates = async () => {
      if (singleActionToTransfer) {
        setTransferableActions([singleActionToTransfer]);
        setSelectedIds([singleActionToTransfer.id]);
      } else {
        const list = await transferService.getTransferableActions(currentHuddle.id);
        setTransferableActions(list);
        if (initialSelectedIds && initialSelectedIds.length > 0) {
          const matched = list.filter(a => initialSelectedIds.includes(a.id)).map(a => a.id);
          setSelectedIds(matched.length > 0 ? matched : list.map(a => a.id));
        } else {
          // By default select all transferable actions
          setSelectedIds(list.map(a => a.id));
        }
      }

      // Default destination to next huddle if available
      const currentIndex = huddles.findIndex(h => h.id === currentHuddle.id);
      if (currentIndex >= 0 && currentIndex + 1 < huddles.length) {
        setDestinationHuddleId(huddles[currentIndex + 1].id);
      } else if (candidateDestinations.length > 0) {
        setDestinationHuddleId(candidateDestinations[0].id);
      }
      setTransferNote('');
      setError(null);
    };

    loadCandidates();
  }, [isOpen, currentHuddle, singleActionToTransfer, huddles]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === transferableActions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(transferableActions.map(a => a.id));
    }
  };

  const handleExecuteTransfer = async () => {
    if (!currentHuddle) return;
    if (selectedIds.length === 0) {
      setError('Please select at least one action to transfer.');
      return;
    }
    if (!destinationHuddleId) {
      setError('Please select a destination huddle.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await transferService.transferActions({
        actionIds: selectedIds,
        sourceHuddleId: currentHuddle.id,
        destinationHuddleId,
        transferNote,
        performedBy: settings.userName,
      });

      if (!result.success) {
        setError(result.error || 'Failed to complete transfer.');
      } else {
        const destHuddle = huddles.find(h => h.id === destinationHuddleId);
        let msg = `Successfully transferred ${result.transferredCount} action(s) to ${destHuddle?.time || ''} Huddle.`;
        if (result.skippedDuplicateIds.length > 0) {
          msg += ` (${result.skippedDuplicateIds.length} skipped because they were already in that huddle)`;
        }
        showNotification(msg, 'success');
        await refreshData();
        onClose();
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(`Error executing transfer: ${errMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs select-none">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-[#6F42C1] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ArrowRightCircle className="w-5 h-5 text-purple-200" />
            <div>
              <h3 className="font-bold text-sm leading-tight">
                Transfer Unactioned Operational Items
              </h3>
              <p className="text-[11px] text-purple-200 mt-0.5">
                Handover unresolved patient actions from {currentHuddle?.time} ({currentHuddle?.date})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-purple-200 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-2.5 text-red-700 flex items-center gap-2 rounded">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Destination Huddle Selector */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#005EB8]" />
                Select Destination Huddle <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-slate-500">Duplicate transfer prevention is active</span>
            </div>

            {candidateDestinations.length === 0 ? (
              <div className="text-amber-700 bg-amber-50 p-2 rounded text-xs border border-amber-200">
                No alternative huddles found. Please schedule the next huddle first via the top timeline.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {candidateDestinations.map(h => (
                  <label
                    key={h.id}
                    className={`flex items-center gap-2 p-2.5 rounded border text-xs cursor-pointer transition-all ${
                      destinationHuddleId === h.id 
                        ? 'bg-purple-50 border-[#6F42C1] ring-1 ring-[#6F42C1] font-semibold text-purple-900' 
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="destinationHuddle"
                      value={h.id}
                      checked={destinationHuddleId === h.id}
                      onChange={(e) => setDestinationHuddleId(e.target.value)}
                      className="text-[#6F42C1] focus:ring-0"
                    />
                    <div>
                      <div className="font-bold text-xs">{h.time} {h.type} Huddle</div>
                      <div className="text-[10px] text-slate-500">
                        {h.date} • {h.shift} Shift ({h.status})
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* Transfer Note */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Handover / Transfer Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Handed over to afternoon consultant; awaiting transport slot..."
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-[#6F42C1]"
              />
            </div>
          </div>

          {/* Action List Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">
                  Select Unresolved Actions ({selectedIds.length} of {transferableActions.length} selected)
                </span>
              </div>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] text-[#005EB8] hover:underline font-semibold"
              >
                {selectedIds.length === transferableActions.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {transferableActions.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded border border-slate-200 text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                <p className="font-semibold text-slate-700">No unresolved actions in this huddle.</p>
                <p className="text-[11px] text-slate-400">All actions are already marked Completed or Cancelled.</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-md overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-100">
                {transferableActions.map(action => {
                  const isChecked = selectedIds.includes(action.id);
                  return (
                    <label
                      key={action.id}
                      className={`flex items-start gap-3 p-2.5 hover:bg-purple-50/40 cursor-pointer transition-colors ${
                        isChecked ? 'bg-purple-50/20' : 'bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSelect(action.id)}
                        className="mt-0.5 rounded text-[#6F42C1] focus:ring-0 w-3.5 h-3.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{action.initials}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                            {action.location}
                          </span>
                          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded font-semibold">
                            {action.status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            LOS: {action.losCategory}
                          </span>
                        </div>
                        <div className="text-slate-700 font-medium text-xs truncate mt-0.5">
                          {action.description}
                        </div>
                        {action.comments && (
                          <div className="text-slate-400 text-[10px] truncate">
                            {action.comments}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-[10px] text-slate-400 whitespace-nowrap">
                        Holder: {action.holder}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Audit Rule Explanation */}
          <div className="bg-blue-50 border border-blue-200 rounded p-2.5 text-slate-700 flex items-start gap-2 text-[11px]">
            <Info className="w-4 h-4 text-[#005EB8] flex-shrink-0 mt-0.5" />
            <div>
              <strong>Audit Safety:</strong> Transferred actions are marked &apos;Transferred&apos; in this huddle and cloned into the destination huddle with a traceable link (source action ID). Duplicate transfers are automatically blocked.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={selectedIds.length === 0 || !destinationHuddleId || isSubmitting}
            onClick={handleExecuteTransfer}
            className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold shadow-sm transition-all ${
              selectedIds.length === 0 || !destinationHuddleId || isSubmitting
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-[#6F42C1] hover:bg-[#5C32A8] text-white'
            }`}
          >
            <ArrowRightCircle className="w-4 h-4" />
            <span>
              {isSubmitting 
                ? 'Transferring...' 
                : `Transfer ${selectedIds.length} Action${selectedIds.length !== 1 ? 's' : ''}`
              }
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
