import React, { useEffect, useRef, useState } from 'react';
import { OperationalAction, ActionPriority, ActionStatus } from '../../models';
import { useApp } from '../../context/AppContext';
import {
  MoreHorizontal,
  Edit3,
  Copy,
  Play,
  CheckCircle2,
  ArrowRightCircle,
  Trash2,
  History,
  AlertTriangle,
  ArrowUpDown,
  ClipboardPaste,
  Flag,
} from 'lucide-react';
import { LosBadge } from '../../components/common/LosBadge';
import { EditableTextCell } from './EditableTextCell';

interface ActionTableProps {
  actions: OperationalAction[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  readOnly: boolean;
  onEditAction: (action: OperationalAction) => void;
  onTransferSingle: (action: OperationalAction) => void;
  onViewAudit: (action: OperationalAction) => void;
  onOpenPaste: () => void;
}

const STATUS_STYLES: Record<ActionStatus, string> = {
  New: 'bg-[#005EB8] text-white',
  'In Progress': 'bg-[#ED8B00] text-slate-900',
  'Awaiting Update': 'bg-[#DA291C] text-white',
  Completed: 'bg-[#007F3B] text-white',
  Transferred: 'bg-[#6F42C1] text-white',
  Cancelled: 'bg-[#768692] text-white',
};

const EDITABLE_STATUSES: ActionStatus[] = ['New', 'In Progress', 'Awaiting Update', 'Completed', 'Cancelled'];

const PRIORITY_STYLES: Record<ActionPriority, string> = {
  Critical: 'font-bold text-red-700 bg-red-50 border-red-200',
  High: 'font-bold text-amber-800 bg-amber-50 border-amber-200',
  Medium: 'font-medium text-slate-700 bg-slate-100 border-slate-200',
  Routine: 'text-slate-500 bg-slate-50 border-slate-200',
};

const PRIORITY_RANK: Record<ActionPriority, number> = { Routine: 0, Medium: 1, High: 2, Critical: 3 };

type SortField = 'losHours' | 'location' | 'initials' | 'description' | 'holder' | 'priority' | 'status' | 'updatedAt';

interface DragState {
  anchorIndex: number;
  mode: 'select' | 'deselect';
  base: Set<string>;
  pointerId: number;
}

const formatTime = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

export const ActionTable: React.FC<ActionTableProps> = ({
  actions,
  selectedIds,
  onSelectionChange,
  readOnly,
  onEditAction,
  onTransferSingle,
  onViewAudit,
  onOpenPaste,
}) => {
  const { updateActionStatus, deleteAction, duplicateAction, quickUpdateAction, settings } = useApp();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('losHours');
  const [sortAsc, setSortAsc] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const lastAnchorRef = useRef<number | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedActions = [...actions].sort((a, b) => {
    let cmp: number;
    if (sortField === 'losHours') cmp = a.losHours - b.losHours;
    else if (sortField === 'priority') cmp = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    else cmp = String(a[sortField] ?? '').localeCompare(String(b[sortField] ?? ''));
    return sortAsc ? cmp : -cmp;
  });

  // Window listeners read the latest rows/callback through a ref
  const latestRef = useRef({ sortedActions, onSelectionChange });
  latestRef.current = { sortedActions, onSelectionChange };

  /** Apply select/deselect to every row between the drag anchor and the given row. */
  const applyDragRange = (toIndex: number) => {
    const drag = dragRef.current;
    if (!drag) return;
    const { sortedActions: rows, onSelectionChange: emit } = latestRef.current;
    const from = Math.min(drag.anchorIndex, toIndex);
    const to = Math.max(drag.anchorIndex, toIndex);
    const next = new Set(drag.base);
    for (let i = from; i <= to; i++) {
      const id = rows[i]?.id;
      if (!id) continue;
      if (drag.mode === 'select') next.add(id);
      else next.delete(id);
    }
    emit(Array.from(next));
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.pointerId) return;

      // Auto-scroll when dragging near the top/bottom of the table
      const container = scrollRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        if (e.clientY < rect.top + 40) container.scrollTop -= 14;
        else if (e.clientY > rect.bottom - 24) container.scrollTop += 14;
      }

      const row = document.elementFromPoint(e.clientX, e.clientY)?.closest('tr[data-row-index]');
      if (!row) return;
      const idx = Number(row.getAttribute('data-row-index'));
      if (!Number.isNaN(idx)) applyDragRange(idx);
    };

    const onUp = () => {
      dragRef.current = null;
      setIsDragging(false);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [isDragging]);

  const handleGutterPointerDown = (e: React.PointerEvent<HTMLTableCellElement>, index: number, id: string) => {
    if (e.button !== 0) return;
    e.preventDefault(); // stop text selection while dragging
    const target = e.target as Element;
    if (target.hasPointerCapture?.(e.pointerId)) target.releasePointerCapture(e.pointerId);

    const base = new Set(selectedIds);
    if (e.shiftKey && lastAnchorRef.current !== null) {
      dragRef.current = { anchorIndex: lastAnchorRef.current, mode: 'select', base, pointerId: e.pointerId };
    } else {
      dragRef.current = { anchorIndex: index, mode: base.has(id) ? 'deselect' : 'select', base, pointerId: e.pointerId };
      lastAnchorRef.current = index;
    }
    applyDragRange(index);
    setIsDragging(true);
  };

  const toggleOne = (id: string) =>
    onSelectionChange(selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id]);

  const allSelected = actions.length > 0 && actions.every(a => selectedIds.includes(a.id));
  const toggleAll = () => onSelectionChange(allSelected ? [] : actions.map(a => a.id));

  const holderOptionsFor = (current: string) =>
    Array.from(new Set([...settings.actionHolders, ...(current ? [current] : [])]));

  const renderSortHeader = (field: SortField, label: string, className = '') => (
    <th scope="col" className={`px-2 py-2 ${className}`}>
      <button type="button" onClick={() => handleSort(field)} className="flex items-center gap-1 font-bold hover:text-[#005EB8]">
        <span>{label}</span>
        <ArrowUpDown className="w-3 h-3 text-slate-400" />
      </button>
    </th>
  );

  const gutterProps = (index: number, id: string) => ({
    onPointerDown: (e: React.PointerEvent<HTMLTableCellElement>) => handleGutterPointerDown(e, index, id),
    style: { touchAction: 'none' as const },
  });

  return (
    <div ref={scrollRef} className={`flex-1 overflow-auto bg-white ${isDragging ? 'select-none cursor-row-resize' : ''}`}>
      {sortedActions.length === 0 ? (
        <div className="p-12 text-center text-slate-500">
          <ClipboardPaste className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">No patients on this huddle list yet</p>
          <p className="text-xs text-slate-500 mt-1">Paste the LOS / location / initials list from the HTML tool to pre-fill the rows.</p>
          {!readOnly && (
            <button
              type="button"
              onClick={onOpenPaste}
              className="mt-3 inline-flex items-center gap-1.5 bg-[#005EB8] hover:bg-[#00478F] text-white px-3.5 py-2 rounded text-xs font-bold"
            >
              <ClipboardPaste className="w-4 h-4" /> Paste Patient List
            </button>
          )}
        </div>
      ) : (
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#F0F4F5] text-slate-700 border-b border-slate-300 sticky top-0 z-10 select-none">
            <tr>
              <th scope="col" className="w-8 px-2.5 py-2 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all visible rows"
                  className="rounded text-[#005EB8] w-3.5 h-3.5"
                />
              </th>
              {renderSortHeader('losHours', 'LOS', 'w-20')}
              {renderSortHeader('location', 'Area / Bed', 'w-28')}
              {renderSortHeader('initials', 'Initials', 'w-16')}
              {renderSortHeader('description', 'Action Required', 'min-w-[220px]')}
              {renderSortHeader('holder', 'Action Holder', 'w-36')}
              {renderSortHeader('priority', 'Priority', 'w-20')}
              {renderSortHeader('status', 'Status', 'w-32')}
              <th scope="col" className="min-w-[260px] px-2 py-2 font-bold">General Comments &amp; Escalations</th>
              {renderSortHeader('updatedAt', 'Updated', 'w-16')}
              <th scope="col" className="w-10 px-2 py-2 text-center font-bold"><span className="sr-only">Row actions</span>•••</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 text-slate-800">
            {sortedActions.map((action, index) => {
              const isSelected = selectedIds.includes(action.id);
              const isMenuOpen = openMenuId === action.id;
              const isTransferred = action.status === 'Transferred' || action.transferred;
              const rowLocked = readOnly || isTransferred;

              return (
                <tr
                  key={action.id}
                  data-row-index={index}
                  className={`align-top transition-colors ${
                    isSelected ? 'bg-blue-100/70' : index % 2 === 1 ? 'bg-slate-50/50 hover:bg-blue-50/40' : 'bg-white hover:bg-blue-50/40'
                  } ${isTransferred ? 'opacity-60' : ''}`}
                >
                  {/* Selection gutter (drag starts here) */}
                  <td className="px-2.5 py-2 text-center cursor-pointer select-none" {...gutterProps(index, action.id)}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(action.id)}
                      aria-label={`Select ${action.initials} in ${action.location}`}
                      className="rounded text-[#005EB8] w-3.5 h-3.5 pointer-events-none focus:ring-2 focus:ring-[#005EB8]"
                    />
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap cursor-pointer select-none" {...gutterProps(index, action.id)}>
                    <LosBadge category={action.losCategory} hours={action.losHours} />
                  </td>
                  <td className="px-2 py-1.5 font-medium text-slate-900 whitespace-nowrap cursor-pointer select-none" {...gutterProps(index, action.id)}>
                    {action.location}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap font-mono font-bold text-slate-700 cursor-pointer select-none" {...gutterProps(index, action.id)}>
                    {action.initials}
                  </td>

                  {/* Action required (inline editable) */}
                  <td className="px-2 py-1.5 font-medium text-slate-900">
                    <EditableTextCell
                      value={action.description}
                      ariaLabel={`action required for ${action.initials}`}
                      placeholder="+ Add action required"
                      emphasisePlaceholder
                      disabled={rowLocked}
                      onSave={next => quickUpdateAction(action.id, { description: next })}
                    />
                    {action.sourceActionId && (
                      <span className="inline-block mt-0.5 text-[10px] bg-purple-50 text-purple-700 px-1 rounded font-normal border border-purple-200">
                        Carried forward
                      </span>
                    )}
                  </td>

                  {/* Holder (inline select) */}
                  <td className="px-2 py-1.5">
                    <select
                      value={action.holder}
                      disabled={rowLocked}
                      aria-label={`Action holder for ${action.initials}`}
                      onChange={e => quickUpdateAction(action.id, { holder: e.target.value })}
                      className={`w-full text-xs bg-transparent border border-transparent rounded px-1 py-0.5 cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#005EB8] disabled:cursor-default disabled:hover:border-transparent ${
                        action.holder ? 'text-slate-700' : 'text-amber-700 italic'
                      }`}
                    >
                      <option value="">Unassigned</option>
                      {holderOptionsFor(action.holder).map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </td>

                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <span className={`text-[10px] border px-1.5 py-0.5 rounded ${PRIORITY_STYLES[action.priority]}`}>
                      {action.priority}
                    </span>
                  </td>

                  {/* Status (inline select styled as a pill) */}
                  <td className="px-2 py-1.5">
                    <select
                      value={action.status}
                      disabled={rowLocked}
                      aria-label={`Status for ${action.initials}`}
                      title={rowLocked ? undefined : 'Change status'}
                      onChange={e => quickUpdateAction(action.id, { status: e.target.value as ActionStatus })}
                      className={`w-full min-w-[110px] text-[11px] font-bold rounded px-1.5 py-1 border-0 cursor-pointer hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#005EB8] disabled:cursor-default disabled:opacity-100 ${STATUS_STYLES[action.status]}`}
                    >
                      {(isTransferred ? [...EDITABLE_STATUSES, 'Transferred' as ActionStatus] : EDITABLE_STATUSES).map(s => (
                        <option key={s} value={s} className="bg-white text-slate-800 font-normal">{s}</option>
                      ))}
                    </select>
                  </td>

                  {/* Comments & escalation (inline editable) */}
                  <td className="px-2 py-1.5">
                    <div className="flex items-start gap-1.5">
                      <button
                        type="button"
                        disabled={rowLocked}
                        aria-pressed={action.escalationRequired}
                        aria-label={action.escalationRequired ? `Remove escalation for ${action.initials}` : `Mark ${action.initials} as escalated`}
                        title={action.escalationRequired ? 'Escalated: click to clear' : 'Mark as escalated'}
                        onClick={() => quickUpdateAction(action.id, { escalationRequired: !action.escalationRequired })}
                        className={
                          action.escalationRequired
                            ? 'flex-shrink-0 inline-flex items-center gap-0.5 max-w-[150px] text-[10px] font-bold text-red-700 bg-red-100 border border-red-200 px-1.5 py-0.5 rounded hover:bg-red-200 disabled:hover:bg-red-100'
                            : 'flex-shrink-0 p-0.5 mt-0.5 text-slate-300 hover:text-red-600 rounded disabled:hidden'
                        }
                      >
                        {action.escalationRequired ? <AlertTriangle className="w-3 h-3 flex-shrink-0" /> : <Flag className="w-3 h-3" />}
                        {action.escalationRequired && (
                          <span className="truncate">Escalated{action.escalatedTo ? ` → ${action.escalatedTo}` : ''}</span>
                        )}
                      </button>
                      <div className="flex-1 min-w-0 text-slate-600">
                        <EditableTextCell
                          value={action.comments}
                          ariaLabel={`comments for ${action.initials}`}
                          placeholder="Add comment"
                          disabled={rowLocked}
                          onSave={next => quickUpdateAction(action.id, { comments: next })}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="px-2 py-1.5 whitespace-nowrap text-slate-500 font-mono text-[11px]" title={new Date(action.updatedAt).toLocaleString('en-GB')}>
                    {formatTime(action.updatedAt)}
                  </td>

                  {/* Row actions menu */}
                  <td className="px-2 py-1.5 text-center relative">
                    <button
                      type="button"
                      onClick={() => setOpenMenuId(isMenuOpen ? null : action.id)}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
                      aria-label={`More actions for ${action.initials}`}
                      aria-expanded={isMenuOpen}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {isMenuOpen && (
                      <div
                        className="absolute right-2 top-8 w-48 bg-white rounded-md shadow-xl border border-slate-200 py-1 z-40 text-left text-xs"
                        onMouseLeave={() => setOpenMenuId(null)}
                      >
                        {!rowLocked && (
                          <button type="button" onClick={() => { setOpenMenuId(null); onEditAction(action); }} className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700">
                            <Edit3 className="w-3.5 h-3.5 text-[#005EB8]" /> Edit all details
                          </button>
                        )}
                        {!readOnly && (
                          <button type="button" onClick={async () => { setOpenMenuId(null); await duplicateAction(action.id); }} className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700">
                            <Copy className="w-3.5 h-3.5 text-slate-500" /> Duplicate
                          </button>
                        )}
                        {!rowLocked && action.status !== 'In Progress' && (
                          <button type="button" onClick={async () => { setOpenMenuId(null); await updateActionStatus(action.id, 'In Progress'); }} className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700">
                            <Play className="w-3.5 h-3.5 text-amber-600" /> Mark In Progress
                          </button>
                        )}
                        {!rowLocked && action.status !== 'Completed' && (
                          <button type="button" onClick={async () => { setOpenMenuId(null); await updateActionStatus(action.id, 'Completed'); }} className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Mark Completed
                          </button>
                        )}
                        {!rowLocked && action.status !== 'Completed' && action.status !== 'Cancelled' && (
                          <button type="button" onClick={() => { setOpenMenuId(null); onTransferSingle(action); }} className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-purple-700 font-semibold">
                            <ArrowRightCircle className="w-3.5 h-3.5 text-purple-600" /> Transfer to Huddle
                          </button>
                        )}
                        <button type="button" onClick={() => { setOpenMenuId(null); onViewAudit(action); }} className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700 border-t border-slate-100">
                          <History className="w-3.5 h-3.5 text-slate-400" /> Audit History
                        </button>
                        {!readOnly && (
                          <button type="button" onClick={() => { setOpenMenuId(null); setDeleteConfirmId(action.id); }} className="w-full px-3 py-1.5 hover:bg-red-50 flex items-center gap-2 text-red-600 border-t border-slate-100">
                            <Trash2 className="w-3.5 h-3.5" /> Delete Action
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5 border border-slate-200" role="alertdialog" aria-modal="true">
            <div className="flex items-center gap-2 text-red-600 mb-2 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Confirm Delete Action</span>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Are you sure you want to delete this action? The deletion is recorded in the audit history.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteConfirmId(null)} className="px-3 py-1.5 rounded text-xs text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteAction(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
