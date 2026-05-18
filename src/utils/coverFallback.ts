export function createCoverFallback(title: string): string {
  const safeTitle = title.trim().length > 0 ? title.trim() : 'Sin portada';
  const initials = safeTitle
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
      <rect width="600" height="800" fill="#161312"/>
      <path d="M0 110 L600 0 L600 130 L0 240Z" fill="#B92D3A"/>
      <path d="M0 620 L600 500 L600 800 L0 800Z" fill="#1E7A78" opacity="0.9"/>
      <g opacity="0.18" stroke="#F6F0E4" stroke-width="2">
        <path d="M70 0v800M170 0v800M270 0v800M370 0v800M470 0v800"/>
        <path d="M0 120h600M0 240h600M0 360h600M0 480h600M0 600h600"/>
      </g>
      <rect x="56" y="58" width="488" height="684" fill="none" stroke="#F6F0E4" stroke-width="8"/>
      <text x="300" y="358" text-anchor="middle" font-family="Arial, sans-serif" font-size="120" font-weight="900" fill="#F6F0E4">${initials}</text>
      <text x="300" y="448" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="800" fill="#F6F0E4">SIN PORTADA</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
