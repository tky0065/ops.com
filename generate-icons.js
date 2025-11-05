// Script to generate PNG icons from SVG using Canvas API
// This creates favicon and PWA icons in multiple sizes

const fs = require('fs');

// Simple SVG to data URL converter
function generateFaviconSVG() {
  // Simplified favicon SVG (optimized for 32x32 and 16x16)
  return `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="6" fill="#0f172a"/>
  <rect x="4" y="11" width="7" height="10" rx="1" fill="#ff6b35"/>
  <path d="M6 14h3M6 16h3M6 18h3" stroke="white" stroke-width="0.8" stroke-linecap="round"/>
  <path d="M12 16h3" stroke="#94a3b8" stroke-width="1" stroke-linecap="round"/>
  <path d="M14 14.5l1.5 1.5-1.5 1.5" stroke="#94a3b8" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#ff6b35"/>
      <stop offset="100%" style="stop-color:#2563eb"/>
    </linearGradient>
  </defs>
  <rect x="16" y="10" width="7" height="12" rx="1" fill="url(#g)"/>
  <circle cx="17.5" cy="13" r="0.8" fill="white" opacity="0.8"/>
  <circle cx="19.5" cy="16" r="0.8" fill="white" opacity="0.8"/>
  <circle cx="21.5" cy="19" r="0.8" fill="white" opacity="0.8"/>
  <rect x="24" y="11" width="4" height="10" rx="1" fill="#2563eb"/>
  <path d="M25 14l1 1 1-1M25 18l1-1 1 1M25 16h2" stroke="white" stroke-width="0.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

function generateAppIconSVG() {
  // App icon SVG (optimized for 192x192 and 512x512)
  return `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="96" fill="#0f172a"/>
  <rect x="64" y="176" width="112" height="160" rx="16" fill="#ff6b35"/>
  <path d="M96 224h48M96 256h48M96 288h48" stroke="white" stroke-width="12" stroke-linecap="round"/>
  <path d="M192 256h48" stroke="#94a3b8" stroke-width="16" stroke-linecap="round"/>
  <path d="M224 232l24 24-24 24" stroke="#94a3b8" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
  <defs>
    <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#ff6b35"/>
      <stop offset="100%" style="stop-color:#2563eb"/>
    </linearGradient>
  </defs>
  <rect x="256" y="160" width="112" height="192" rx="16" fill="url(#g2)"/>
  <circle cx="280" cy="208" r="12" fill="white" opacity="0.8"/>
  <circle cx="312" cy="256" r="12" fill="white" opacity="0.8"/>
  <circle cx="344" cy="304" r="12" fill="white" opacity="0.8"/>
  <path d="M280 208l32 48 32 48" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>
  <rect x="384" y="176" width="64" height="160" rx="16" fill="#2563eb"/>
  <path d="M400 224l16 16 16-16M400 288l16-16 16 16M400 256h32" stroke="white" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

// Create SVG files
fs.writeFileSync('./public/favicon.svg', generateFaviconSVG());
fs.writeFileSync('./public/app-icon.svg', generateAppIconSVG());

console.log('✅ SVG icons generated successfully!');
console.log('📁 Files created:');
console.log('   - public/favicon.svg');
console.log('   - public/app-icon.svg');
console.log('');
console.log('📝 Next steps:');
console.log('   1. Use an online converter (e.g., cloudconvert.com, favicon.io) to convert:');
console.log('      - favicon.svg → favicon.ico (16x16, 32x32, 48x48)');
console.log('      - app-icon.svg → icon-192.png (192x192)');
console.log('      - app-icon.svg → icon-512.png (512x512)');
console.log('      - app-icon.svg → apple-touch-icon.png (180x180)');
console.log('   2. Or use ImageMagick/sharp if you have them installed');
console.log('');
console.log('💡 For now, Next.js will use the SVG favicons automatically!');
