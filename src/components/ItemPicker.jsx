'use client';
import { useEffect, useState, useRef } from 'react';
import { api, useDebounced } from './ui';
import Icon from './Icon';
import { useI18n } from '@/components/I18nProvider';

/**
 * Type කරලා අයිතමයක් හොයන box එක. Barcode scanner එකක් ඕන නෑ —
 * code එකේ මුල් අකුරු ටික ගැහුවම වහාම එනවා.
 */
export default function ItemPicker({ value, onPick, placeholder, autoFocus }) {
  const { t, displayName } = useI18n();
  const ph = placeholder ?? t('itemPicker.placeholder');
  const [q, setQ] = useState('');
  const dq = useDebounced(q, 180);
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const box = useRef(null);

  useEffect(() => {
    if (!dq.trim()) { setList([]); return; }
    let dead = false;
    api('/api/items?limit=8&q=' + encodeURIComponent(dq))
      .then((d) => !dead && (setList(d.items), setHi(0)))
      .catch(() => {});
    return () => { dead = true; };
  }, [dq]);

  useEffect(() => {
    const h = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  function pick(it) { onPick(it); setQ(''); setList([]); setOpen(false); }

  return (
    <div className="relative" ref={box}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"><Icon name="search" size={18} /></span>
      <input
        className="field pl-10" placeholder={value ? displayName(value) : ph} value={q} autoFocus={autoFocus}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!list.length) return;
          if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => Math.min(h + 1, list.length - 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
          if (e.key === 'Enter') { e.preventDefault(); pick(list[hi]); }
        }}
      />
      {open && list.length > 0 && (
        <ul className="absolute z-30 left-0 right-0 top-full mt-1 bg-surface border border-line rounded-card overflow-hidden max-h-72 overflow-y-auto">
          {list.map((it, i) => (
            <li key={it._id}>
              <button type="button" onMouseEnter={() => setHi(i)} onClick={() => pick(it)}
                className={`w-full text-left px-3 py-2.5 flex items-center gap-3 ${i === hi ? 'bg-brand-light' : ''}`}>
                <span className="num text-[13px] text-muted w-20 shrink-0">{it.code}</span>
                <span className="flex-1 min-w-0 truncate font-medium">{displayName(it)}</span>
                <span className="num text-[13px] text-muted">{it.unit}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && dq.trim() && list.length === 0 && (
        <p className="absolute z-30 left-0 right-0 top-full mt-1 bg-surface border border-line rounded-card px-3 py-3 hint">
          {t('itemPicker.empty')}
        </p>
      )}
    </div>
  );
}
