const paths = {
  home: 'M3 10l9-8 9 8M5 9v12h5v-7h4v7h5V9',
  visitors: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 7v6M16 10h6',
  community: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M17 4a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-4',
  payments: 'M3 5h18v14H3zM3 10h18',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  delivery: 'M12 3l9 5v9l-9 5-9-5V8zM3 8l9 5 9-5M12 13v9M7 5l9 5',
  wrench: 'M14 6a6 6 0 0 0-7 7l-5 5 4 4 5-5a6 6 0 0 0 7-7l-4 4-4-4z',
  pin: 'M12 22s7-7 7-13a7 7 0 1 0-14 0c0 6 7 13 7 13M12 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M10 21h4',
  arrow: 'M9 5l7 7-7 7',
  notice: 'M3 10v5h4l11 5V5L7 10zM7 15l2 6h3',
  chat: 'M21 11a9 9 0 0 1-9 9H3l2-5a9 9 0 1 1 16-4',
  alert: 'M12 3L2 21h20zM12 9v5M12 17v.01',
  leaf: 'M4 20C2 8 10 3 21 3c0 11-5 18-14 15M4 20L16 8',
  menu: 'M3 6h18M3 12h18M3 18h18',
  logout: 'M9 3H3v18h6M9 12h13M17 7l5 5-5 5',
}
export default function Icon({ name, size = 22, ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.home} /></svg>
}
