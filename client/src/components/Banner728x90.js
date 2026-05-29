import { useEffect, useRef, useState } from 'react';

export default function Banner728x90() {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!ref.current || failed) return;
    try {
      const existing = ref.current.querySelector('script');
      if (existing) return;

      window.atOptions = {
        key: '20c23d55e0aa2d4c55f69cec04907f2b',
        format: 'iframe',
        height: 90,
        width: 728,
        params: {},
      };

      const s = document.createElement('script');
      s.src = 'https://www.highperformanceformat.com/20c23d55e0aa2d4c55f69cec04907f2b/invoke.js';
      s.async = true;
      s.onerror = () => setFailed(true);
      s.onload = () => { window.__bannerAdLoaded = true; };
      ref.current.appendChild(s);
    } catch (e) {
      setFailed(true);
    }
    return () => {
      if (ref.current) {
        try {
          const scripts = ref.current.querySelectorAll('script');
          scripts.forEach(script => script.remove());
        } catch (_) {}
      }
    };
  }, [failed]);

  return (
    <div
      ref={ref}
      className="flex justify-center bg-gray-100 py-2 overflow-hidden"
      style={{ minHeight: failed ? 'auto' : '90px', minWidth: '100%' }}
    >
      {failed && (
        <div className="w-full h-[90px] bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
          Advertisement
        </div>
      )}
    </div>
  );
}