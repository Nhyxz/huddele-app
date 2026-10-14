import React, { useEffect, useRef, useState } from 'react';

interface EditableTextCellProps {
  value: string;
  onSave: (next: string) => void;
  ariaLabel: string;
  placeholder?: string;
  disabled?: boolean;
  /** Show the placeholder in amber to signal the cell still needs filling in. */
  emphasisePlaceholder?: boolean;
  maxLength?: number;
}

export const EditableTextCell: React.FC<EditableTextCellProps> = ({
  value,
  onSave,
  ariaLabel,
  placeholder = 'Click to edit',
  disabled = false,
  emphasisePlaceholder = false,
  maxLength = 500,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const editingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const autoSize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    if (editing && textareaRef.current) {
      const el = textareaRef.current;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
      autoSize();
    }
  }, [editing]);

  const startEditing = () => {
    if (disabled) return;
    editingRef.current = true;
    setDraft(value);
    setEditing(true);
  };

  const finish = (save: boolean) => {
    if (!editingRef.current) return;
    editingRef.current = false;
    setEditing(false);
    const next = draft.trim();
    if (save && next !== value.trim()) onSave(next);
  };

  if (disabled) {
    return (
      <span className="block whitespace-pre-wrap break-words text-slate-700">
        {value || <span className="text-slate-400">—</span>}
      </span>
    );
  }

  if (!editing) {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={`Edit ${ariaLabel}`}
        onClick={startEditing}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === 'F2') {
            e.preventDefault();
            startEditing();
          }
        }}
        className="min-h-[22px] px-1.5 py-0.5 -mx-1.5 rounded cursor-text whitespace-pre-wrap break-words hover:bg-white hover:ring-1 hover:ring-slate-300 focus:outline-none focus:ring-2 focus:ring-[#005EB8]"
      >
        {value ? (
          value
        ) : (
          <span className={`italic ${emphasisePlaceholder ? 'text-amber-700 font-medium' : 'text-slate-400'}`}>
            {placeholder}
          </span>
        )}
      </div>
    );
  }

  return (
    <textarea
      ref={textareaRef}
      value={draft}
      rows={1}
      maxLength={maxLength}
      aria-label={ariaLabel}
      onChange={e => {
        setDraft(e.target.value);
        autoSize();
      }}
      onBlur={() => finish(true)}
      onKeyDown={e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          finish(true);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          finish(false);
        }
      }}
      className="w-full resize-none overflow-hidden border border-[#005EB8] rounded px-1.5 py-0.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#005EB8]/40"
    />
  );
};
