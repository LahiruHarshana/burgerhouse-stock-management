// Icon library එකක් install කරන්නේ නෑ -> bundle එක පොඩියි, page එක ඉක්මනින් load වෙනවා.
const P = {
  box: 'M3 7l9-4 9 4v10l-9 4-9-4V7zm9-4v18M3 7l9 4 9-4',
  book: 'M4 4h9a3 3 0 013 3v13a2 2 0 00-2-2H4V4zm16 0h-3v14h3V4z',
  truck: 'M3 7h11v9H3V7zm11 3h4l3 3v3h-7v-6zM7 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm10 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
  layers: 'M12 3l9 5-9 5-9-5 9-5zm9 9l-9 5-9-5m18 4l-9 5-9-5',
  trash: 'M4 7h16M9 7V4h6v3m-8 0l1 13h8l1-13M10 11v6m4-6v6',
  clipboard: 'M9 4h6v3H9V4zM7 5H5v16h14V5h-2M9 12h6M9 16h4',
  cup: 'M6 4h12l-1 8a5 5 0 01-10 0L6 4zm12 2h2a2 2 0 010 4h-2M8 21h8',
  coin: 'M12 3c4.4 0 8 1.6 8 3.5S16.4 10 12 10 4 8.4 4 6.5 7.6 3 12 3zM4 6.5v11C4 19.4 7.6 21 12 21s8-1.6 8-3.5v-11M4 12c0 1.9 3.6 3.5 8 3.5s8-1.6 8-3.5',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3zm3 5h6m-6 4h6m-6 4h4',
  printer: 'M6 9V3h12v6M6 18H5a2 2 0 01-2-2v-5h18v5a2 2 0 01-2 2h-1M6 14h12v7H6v-7z',
  chart: 'M4 20V10m5 10V4m5 16v-7m5 7V8',
  users: 'M8 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zm-6 9a6 6 0 0112 0M16 5.5a3.5 3.5 0 010 6M17 20a6 6 0 00-1.5-4',
  pin: 'M12 21s7-6.3 7-11a7 7 0 10-14 0c0 4.7 7 11 7 11zm0-8.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  home: 'M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9z',
  gear: 'M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zm8-3.5a8 8 0 01-.1 1.2l2 1.6-2 3.4-2.4-1a8 8 0 01-2 1.2l-.4 2.6h-4l-.4-2.6a8 8 0 01-2-1.2l-2.4 1-2-3.4 2-1.6A8 8 0 014 12c0-.4 0-.8.1-1.2l-2-1.6 2-3.4 2.4 1a8 8 0 012-1.2L8.9 3h4l.4 2.6a8 8 0 012 1.2l2.4-1 2 3.4-2 1.6c.1.4.1.8.1 1.2z',
  plus: 'M12 5v14M5 12h14',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zm10 2l-4.5-4.5',
  check: 'M4 12.5l5 5L20 7',
  x: 'M6 6l12 12M18 6L6 18',
  warn: 'M12 3l9 16H3l9-16zm0 6v5m0 3v.5',
  arrow: 'M5 12h14m-6-6l6 6-6 6',
  out: 'M14 4h5v16h-5M10 8l-4 4 4 4M6 12h9',
};

export default function Icon({ name, size = 20, className = '', strokeWidth = 1.8 }) {
  const d = P[name] || P.box;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"
      className={className} stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
