import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resvg } from '@resvg/resvg-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

// Master high-definition SVG design for FitHome
function getSvg({ isMaskable = false } = {}) {
  // Safe zone for maskable icons is the inner 80% circle (center 256, radius 205)
  const bgShape = isMaskable
    ? `<rect width="512" height="512" fill="url(#bgGrad)" />`
    : `<rect width="512" height="512" rx="112" fill="url(#bgGrad)" />
       <rect x="2" y="2" width="508" height="508" rx="110" fill="none" stroke="url(#borderGrad)" stroke-width="3" stroke-opacity="0.6" />`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <radialGradient id="ambientGlow" cx="50%" cy="46%" r="55%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.38" />
      <stop offset="55%" stop-color="#042f2e" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#020617" stop-opacity="0" />
    </radialGradient>
    
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#03130e" />
      <stop offset="40%" stop-color="#06231a" />
      <stop offset="75%" stop-color="#020b08" />
      <stop offset="100%" stop-color="#010403" />
    </linearGradient>

    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399" stop-opacity="0.8" />
      <stop offset="50%" stop-color="#059669" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#10b981" stop-opacity="0.65" />
    </linearGradient>

    <!-- Emerald Brand Gradients -->
    <linearGradient id="neonGreen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6ee7b7" />
      <stop offset="45%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>

    <linearGradient id="roofGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#059669" />
      <stop offset="35%" stop-color="#10b981" />
      <stop offset="50%" stop-color="#a7f3d0" />
      <stop offset="65%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>

    <linearGradient id="silverChrome" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="40%" stop-color="#e2e8f0" />
      <stop offset="70%" stop-color="#94a3b8" />
      <stop offset="100%" stop-color="#475569" />
    </linearGradient>

    <linearGradient id="plateInner" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399" />
      <stop offset="100%" stop-color="#064e3b" />
    </linearGradient>

    <!-- Glow & Shadow Filters -->
    <filter id="neonBloom" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="12" result="glow" />
      <feMerge>
        <feMergeNode in="glow" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <filter id="iconShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#000000" flood-opacity="0.8" />
    </filter>
  </defs>

  <!-- Base Canvas Background -->
  ${bgShape}

  <!-- Ambient Neon Flare in Center -->
  <circle cx="256" cy="245" r="210" fill="url(#ambientGlow)" />

  <!-- Subtle Concentric Tech Rings -->
  <circle cx="256" cy="250" r="192" fill="none" stroke="#10b981" stroke-width="2" stroke-opacity="0.2" stroke-dasharray="10 8" />
  <circle cx="256" cy="250" r="168" fill="none" stroke="#10b981" stroke-width="1.5" stroke-opacity="0.12" />

  <!-- Main Athletic FitHome Emblem (Scaled for perfect mobile visibility) -->
  <g filter="url(#iconShadow)">
    
    <!-- Outer Shield Silhouette -->
    <polygon points="256,76 384,152 384,332 256,412 128,332 128,152" 
             fill="#041f17" fill-opacity="0.75" 
             stroke="#10b981" stroke-width="3" stroke-opacity="0.35" />

    <!-- 1. The Home Roof Arch / Modern Chevron -->
    <path d="M142 220 L256 122 L370 220" 
          fill="none" 
          stroke="url(#roofGrad)" 
          stroke-width="24" 
          stroke-linecap="round" 
          stroke-linejoin="round" 
          filter="url(#neonBloom)" />

    <!-- Sleek Power Lightning Flash at Roof Top -->
    <polygon points="256,132 245,174 266,174 246,218 270,182 252,182" 
             fill="#ffffff" 
             filter="url(#neonBloom)" />

    <!-- 2. Central Athletic Dumbbell Core -->
    <g transform="translate(0, 16)">
      <!-- Left Outer Weight Plate -->
      <rect x="144" y="214" width="28" height="114" rx="10" fill="url(#neonGreen)" />
      <rect x="148" y="218" width="20" height="106" rx="7" fill="none" stroke="#a7f3d0" stroke-width="2" stroke-opacity="0.8" />

      <!-- Left Inner Weight Plate -->
      <rect x="178" y="228" width="22" height="86" rx="8" fill="url(#plateInner)" />

      <!-- Solid Chrome Barbell Shaft -->
      <rect x="198" y="256" width="116" height="30" rx="7" fill="url(#silverChrome)" />
      
      <!-- Knurled Texture Bands -->
      <line x1="234" y1="260" x2="234" y2="282" stroke="#475569" stroke-width="3" stroke-linecap="round" />
      <line x1="246" y1="260" x2="246" y2="282" stroke="#475569" stroke-width="3" stroke-linecap="round" />
      <line x1="256" y1="260" x2="256" y2="282" stroke="#475569" stroke-width="3" stroke-linecap="round" />
      <line x1="266" y1="260" x2="266" y2="282" stroke="#475569" stroke-width="3" stroke-linecap="round" />
      <line x1="278" y1="260" x2="278" y2="282" stroke="#475569" stroke-width="3" stroke-linecap="round" />

      <!-- Right Inner Weight Plate -->
      <rect x="312" y="228" width="22" height="86" rx="8" fill="url(#plateInner)" />

      <!-- Right Outer Weight Plate -->
      <rect x="340" y="214" width="28" height="114" rx="10" fill="url(#neonGreen)" />
      <rect x="344" y="218" width="20" height="106" rx="7" fill="none" stroke="#a7f3d0" stroke-width="2" stroke-opacity="0.8" />

      <!-- Specular Light Flares on Shaft -->
      <circle cx="212" cy="271" r="3.5" fill="#ffffff" />
      <circle cx="300" cy="271" r="3.5" fill="#ffffff" />
    </g>

    <!-- 3. Dynamic "FITHOME" athletic label under emblem -->
    <text x="256" y="380" 
          font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
          font-size="34" 
          font-weight="900" 
          fill="#ffffff" 
          text-anchor="middle" 
          letter-spacing="6">FITHOME</text>
  </g>
</svg>`;
}

async function renderPng(svgString, size) {
  const resvg = new Resvg(svgString, {
    fitTo: {
      mode: 'width',
      value: size
    }
  });
  const pngData = resvg.render();
  return pngData.asPng();
}

async function main() {
  console.log('Generating high-fidelity FitHome icons...');

  // 1. Generate master SVGs
  const standardSvg = getSvg({ isMaskable: false });
  const maskableSvg = getSvg({ isMaskable: true });

  fs.writeFileSync(path.join(publicDir, 'icon.svg'), standardSvg);
  console.log('Saved public/icon.svg');

  // 2. Render standard 512x512
  const pwa512 = await renderPng(standardSvg, 512);
  fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);
  console.log('Saved public/pwa-512x512.png (512x512)');

  // 3. Render maskable 512x512
  const pwaMaskable512 = await renderPng(maskableSvg, 512);
  fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwaMaskable512);
  console.log('Saved public/pwa-maskable-512x512.png (512x512 maskable)');

  // 4. Render standard 192x192
  const pwa192 = await renderPng(standardSvg, 192);
  fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);
  console.log('Saved public/pwa-192x192.png (192x192)');

  // 5. Render maskable 192x192 (critical for Android adaptive launchers)
  const pwaMaskable192 = await renderPng(maskableSvg, 192);
  fs.writeFileSync(path.join(publicDir, 'pwa-maskable-192x192.png'), pwaMaskable192);
  console.log('Saved public/pwa-maskable-192x192.png (192x192 maskable)');

  // 6. Render Apple Touch Icon (180x180)
  const appleTouch = await renderPng(maskableSvg, 180);
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouch);
  console.log('Saved public/apple-touch-icon.png (180x180)');

  // 7. Render 32x32 and 16x16 favicons
  const favicon32 = await renderPng(standardSvg, 32);
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), favicon32);
  const favicon16 = await renderPng(standardSvg, 16);
  fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), favicon16);
  // Also save favicon.ico
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), favicon32);

  // 8. Copy to dist if dist exists
  const distDir = path.resolve(__dirname, '../dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'icon.svg'), standardSvg);
    fs.writeFileSync(path.join(distDir, 'pwa-512x512.png'), pwa512);
    fs.writeFileSync(path.join(distDir, 'pwa-maskable-512x512.png'), pwaMaskable512);
    fs.writeFileSync(path.join(distDir, 'pwa-192x192.png'), pwa192);
    fs.writeFileSync(path.join(distDir, 'pwa-maskable-192x192.png'), pwaMaskable192);
    fs.writeFileSync(path.join(distDir, 'apple-touch-icon.png'), appleTouch);
    fs.writeFileSync(path.join(distDir, 'favicon-32x32.png'), favicon32);
    fs.writeFileSync(path.join(distDir, 'favicon-16x16.png'), favicon16);
    fs.writeFileSync(path.join(distDir, 'favicon.ico'), favicon32);
    console.log('Synced icons to dist/ directory');
  }

  console.log('All icons generated successfully!');
}

main().catch(err => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});
