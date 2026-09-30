import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import horizontal from '../public/assets/brand/critical-error-neutral.svg?raw';
import stacked from '../public/assets/brand/critical-error-neutral-stacked.svg?raw';

// The traced O includes a cream slash underneath the red one. Join its two
// inner contours into a clean counter so nothing is visible before the cut.
const uncutO = `M-13 30 C-11.57 31.41 -11.57 31.41 -9.56 33.06
  C8.98 49.03 21.09 69.74 23.22 94.52 C24.57 119.96 16.94 143.95 -0.19 163
  C-17.78 181.98 -40.19 192.68 -66.07 193.92 C-86.39 194.53 -104.28 188.63 -122 179
  C-124 177 -126 175 -128 172 C-128.28 171.88 -128.28 171.88 -129.68 171.3
  C-145.54 162.44 -155.02 141.82 -159.83 125.13 C-165.98 101.56 -161.99 76.95 -150 56
  C-147.61 52.11 -144.9 48.53 -142 45 C-141.41 44.25 -140.82 43.49 -140.21 42.72
  C-127.66 27.55 -109.98 17.62 -91 13 C-90.09 12.78 -89.17 12.55 -88.23 12.32
  C-66.76 7.94 -46.06 11.77 -26.64 21.31 C-21.5 23.5 -17 26.5 -13 30 Z
  M-110.25 61.16 C-121.92 73.67 -127.4 88.46 -127.21 105.5
  C-126.58 119.54 -120.85 132.09 -111 142 C-106 148 -100.5 151.8 -94.81 154.32
  C-80.51 160.65 -66.02 162.57 -51.02 157.25 C-34.33 150.33 -23.36 139.2 -16.04 122.74
  C-10.71 108.73 -11.03 91.81 -17 78 C-20.38 71.61 -24.6 64.9 -30 60
  C-34.9 56.1 -39.8 53.3 -45 51 C-67.34 39.32 -92.08 43.69 -110.25 61.16 Z`;

export default function Logo({ stacked: isStacked = false, className = '' }) {
  const maskId = `${useId()}-slash`;
  const glintId = `${maskId}-glint`;
  const element = useRef(null);
  const [visible, setVisible] = useState(false);
  const markup = useMemo(() => {
    // Only trusted, local SVG assets are inserted; separate the O from its slash.
    return (isStacked ? stacked : horizontal)
      .replace(/<\?xml[^>]*\?>/, '')
      .replace(/<title>.*?<\/title>/, '')
      .replace(/ id="(?:critical|error)"/g, '')
      .replace(/<path\b[^>]*>/g, (path) => {
        if (/fill="#F6F0E8"/i.test(path) && path.includes('translate(1921,249)')) return path.replace(/d="[^"]*"/, `d="${uncutO}"`);
        if (!/fill="#(?:AC0504|A70C0B)"/i.test(path)) return path;
        const slash = path.replace(/ transform="[^"]*"/, '');
        const reflection = slash.replace(/fill="[^"]*"/, 'fill="white"').replace('<path', `<path mask="url(#${glintId})"`);
        return `<g transform="translate(1921,249)" mask="url(#${maskId})">${slash}${reflection}</g>`;
      })
      .replace(/(<svg\b[^>]*>)/, `$1<defs><mask id="${maskId}" maskUnits="userSpaceOnUse" x="-180" y="-30" width="220" height="290"><path class="logo-slash-reveal" d="M 7 -10 L -159 220" fill="none" stroke="white" stroke-width="50" pathLength="1"/></mask><mask id="${glintId}" maskUnits="userSpaceOnUse" x="-180" y="-30" width="220" height="290"><path class="logo-slash-glint" d="M 7 -10 L -159 220" fill="none" stroke="white" stroke-width="50" pathLength="1"/></mask></defs>`);
  }, [isStacked, maskId, glintId]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.25 });
    observer.observe(element.current);
    return () => observer.disconnect();
  }, []);

  return <span ref={element} className={`logo-svg ${className}${visible ? ' logo-visible' : ''}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: markup }} />;
}
