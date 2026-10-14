import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { parsePatientList, matchKey } from '../../utils/patientListParser';
import { LosBadge } from '../../components/common/LosBadge';
import { X, ClipboardPaste, AlertCircle, ShieldAlert } from 'lucide-react';

interface ImportPatientsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Fictional demonstration rows in the same shape as the HTML tool output
const SAMPLE_PASTE = [
  'LOS\tLocation\tInitials',
  '13:40\tResus 2\tJK',
  '14:10\tMajors 8\tMN',
  '6:15\tMajors 4\tLM',
  '3:20\tMajors 7\tNP',
  '2:05\tSAU 1\tQS',
  '0:45\tStreaming\tTU',
].join('\n');

export const ImportPatientsModal: React.FC<ImportPatientsModalProps> = ({ isOpen, onClose }) => {
  const { currentHuddle, currentHuddleActions, importPatientRows } = useApp();
  const [text, setText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setText('');
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const parsed = useMemo(() => parsePatientList(text), [text]);

  const existingKeys = useMemo(
    () =>
      new Set(
        currentHuddleActions
          .filter(a => a.status !== 'Transferred' && !a.transferred)
          .map(a => matchKey(a.initials, a.location))
      ),
    [currentHuddleActions]
  );

  const newCount = parsed.validRows.filter(r => !existingKeys.has(matchKey(r.initials, r.location))).length;
  const updateCount = parsed.validRows.length - newCount;
  const errorCount = parsed.rows.length - parsed.validRows.length;

  if (!isOpen || !currentHuddle) return null;

  const handleImport = async () => {
    if (parsed.validRows.length === 0) return;
    setIsImporting(true);
    try {
      await importPatientRows(currentHuddle.id, parsed.validRows);
      onClose();
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onKeyDown={e => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="paste-list-title"
      >
        <div className="bg-[#005EB8] text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardPaste className="w-5 h-5" />
            <div>
              <h3 id="paste-list-title" className="font-bold text-sm">Paste Patient List</h3>
              <p className="text-[11px] text-blue-100">
                Pre-fill the {currentHuddle.time} {currentHuddle.type} Huddle from the HTML tool output (LOS, Location, Initials)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-blue-100 hover:text-white p-1 rounded" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3 text-xs text-slate-700 overflow-y-auto">
          <div className="bg-amber-50 border-l-4 border-amber-400 p-2 rounded text-amber-900 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span><strong>Prototype:</strong> use fictional initials only. Do not paste real patient data into this browser-only demo.</span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="paste-list-input" className="font-semibold text-slate-800">
                Paste rows here (one patient per line)
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setText(SAMPLE_PASTE)} className="text-[#005EB8] hover:underline font-semibold">
                  Load sample
                </button>
                {text && (
                  <button type="button" onClick={() => setText('')} className="text-slate-500 hover:underline">
                    Clear
                  </button>
                )}
              </div>
            </div>
            <textarea
              id="paste-list-input"
              ref={textareaRef}
              rows={6}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={'13:40\tResus 2\tJK\n6:15\tMajors 4\tLM\n2:05\tSAU 1\tQS'}
              className="w-full border border-slate-300 rounded p-2 font-mono text-[11px] focus:ring-1 focus:ring-[#005EB8] focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Accepts tab, comma or multi-space columns. LOS as 13:40, 13h 20m, 13.5 or a band like &gt; 12h. Header rows are ignored.
              Patients already on this huddle (same initials and location) have their LOS updated rather than being duplicated.
            </p>
          </div>

          {parsed.rows.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-1.5 font-semibold">
                <span className="text-emerald-700">{newCount} new</span>
                <span className="text-[#005EB8]">{updateCount} LOS update{updateCount !== 1 ? 's' : ''}</span>
                {errorCount > 0 && <span className="text-red-700">{errorCount} not readable</span>}
                {parsed.headerLinesSkipped > 0 && <span className="text-slate-400 font-normal">{parsed.headerLinesSkipped} header line skipped</span>}
              </div>
              <div className="border border-slate-200 rounded max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 sticky top-0 text-slate-600">
                    <tr>
                      <th className="px-2 py-1.5 w-12">Line</th>
                      <th className="px-2 py-1.5 w-20">LOS</th>
                      <th className="px-2 py-1.5">Location</th>
                      <th className="px-2 py-1.5 w-16">Initials</th>
                      <th className="px-2 py-1.5">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsed.rows.map(row => {
                      const isUpdate = !row.error && existingKeys.has(matchKey(row.initials, row.location));
                      return (
                        <tr key={row.lineNumber} className={row.error ? 'bg-red-50/60' : ''}>
                          <td className="px-2 py-1 text-slate-400 font-mono">{row.lineNumber}</td>
                          {row.error ? (
                            <>
                              <td colSpan={3} className="px-2 py-1 font-mono text-slate-500 truncate max-w-xs">{row.raw}</td>
                              <td className="px-2 py-1 text-red-700 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" /> {row.error}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-2 py-1"><LosBadge category={row.losCategory} hours={row.losHours} /></td>
                              <td className="px-2 py-1 font-medium">{row.location}</td>
                              <td className="px-2 py-1 font-mono font-bold">{row.initials}</td>
                              <td className={`px-2 py-1 font-semibold ${isUpdate ? 'text-[#005EB8]' : 'text-emerald-700'}`}>
                                {isUpdate ? 'Already on list: update LOS' : 'Add new row'}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <button type="button" onClick={onClose} className="px-3.5 py-1.5 rounded text-xs font-semibold text-slate-600 hover:bg-slate-200">
            Cancel
          </button>
          <button
            type="button"
            disabled={parsed.validRows.length === 0 || isImporting}
            onClick={handleImport}
            className="flex items-center gap-1.5 px-4 py-2 rounded text-xs font-bold shadow-sm bg-[#005EB8] hover:bg-[#00478F] text-white disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
          >
            <ClipboardPaste className="w-4 h-4" />
            {isImporting
              ? 'Adding…'
              : `Add ${newCount} row${newCount !== 1 ? 's' : ''}${updateCount ? ` and update ${updateCount}` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};
