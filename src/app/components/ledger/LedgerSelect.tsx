'use client';

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { FiCheck, FiChevronDown, FiX } from 'react-icons/fi';

export type SelectOption<T extends string> = { value: T; label: string; description?: string };

// The native dialog provides a top layer, focus trap, Escape, and an inert background.
// CSS turns the same option list into a desktop popover or a mobile bottom sheet.
export default function LedgerSelect<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: SelectOption<T>[]; onChange: (value: T) => void;
}) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const typed = useRef({ text: '', at: 0 });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState<CSSProperties>({});
  const selected = options.find(option => option.value === value);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  const close = () => {
    dialog.current?.close();
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  };
  const show = () => {
    if (!trigger.current || !dialog.current || !options.length || dialog.current.open) return;
    const rect = trigger.current.getBoundingClientRect();
    const width = Math.min(Math.max(rect.width, 260), window.innerWidth - 24);
    const height = Math.min(440, 76 + options.length * 58, window.innerHeight - 24);
    const top = rect.bottom + 8 + height <= window.innerHeight - 12 ? rect.bottom + 8 : Math.max(12, rect.top - height - 8);
    setPosition({ '--select-top': `${top}px`, '--select-left': `${Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))}px`, '--select-width': `${width}px` } as CSSProperties);
    const index = Math.max(0, options.findIndex(option => option.value === value));
    setActive(index);
    typed.current = { text: '', at: 0 };
    setOpen(true);
    dialog.current.showModal();
    buttons.current[index]?.focus({ preventScroll: true });
  };
  const focusOption = (index: number) => {
    setActive(index);
    buttons.current[index]?.focus();
  };
  const handleKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      focusOption(event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 :
        (active + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
    } else if (event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      const now = Date.now();
      const text = (now - typed.current.at < 600 ? typed.current.text : '') + event.key.toLocaleLowerCase('id-ID');
      typed.current = { text, at: now };
      const index = options.findIndex(option => option.label.toLocaleLowerCase('id-ID').startsWith(text));
      if (index >= 0) focusOption(index);
    }
  };

  return <div className="ledger-select-field">
    <span className="ledger-select-caption" id={`${id}-label`}>{label}</span>
    <button ref={trigger} type="button" className="ledger-select-trigger" aria-labelledby={`${id}-label ${id}-value`}
      aria-haspopup="dialog" aria-expanded={open} aria-controls={`${id}-dialog`} onClick={show}
      onKeyDown={event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); show(); } }}>
      <span id={`${id}-value`}>{selected?.label ?? 'Pilih opsi'}</span><FiChevronDown aria-hidden="true" />
    </button>
    <dialog ref={dialog} id={`${id}-dialog`} className="ledger-select-dialog" style={position} aria-labelledby={`${id}-heading`}
      onClose={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <div className="ledger-select-surface">
        <div className="ledger-select-handle" aria-hidden="true" />
        <div className="ledger-select-heading"><div><p>PILIH OPSI</p><h2 id={`${id}-heading`}>{label}</h2></div>
          <button type="button" className="ledger-select-close" aria-label={`Tutup pilihan ${label}`} onClick={close}><FiX aria-hidden="true" /></button>
        </div>
        <div className="ledger-select-options" role="listbox" aria-labelledby={`${id}-heading`} onKeyDown={handleKeys}>
          {options.map((option, index) => <button ref={element => { buttons.current[index] = element; }} type="button" role="option"
            key={option.value} aria-selected={option.value === value} tabIndex={index === active ? 0 : -1}
            className="ledger-select-option" onFocus={() => setActive(index)}
            onClick={() => { close(); onChange(option.value); }}>
            <span><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span>
            <span className="ledger-select-check" aria-hidden="true">{option.value === value && <FiCheck />}</span>
          </button>)}
        </div>
      </div>
    </dialog>
  </div>;
}
