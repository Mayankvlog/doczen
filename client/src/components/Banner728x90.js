import { useEffect, useRef, useState } from 'react';

export default function Banner728x90() {
  const ref = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!ref.current || failed) return;
    try {
      const existing = ref.current.querySelector('script');
      if (existing) return;

      // Use defer for better CSP compliance and async loading
      const s1 = document.createElement('script');
      s1.text = `window.atOptions = ${JSON.stringify({
        key: '20c23d55e0aa2d4c55f69cec04907f2b',
        format: 'iframe',
        height: 90,
        width: 728,
        params: {},
      })};`;
      s1.defer = true;
      s1.setAttribute('data-cfasync', 'false');
      ref.current.appendChild(s1);

      const s2 = document.createElement('script');
      s2.src = 'https://www.highperformanceformat.com/20c23d55e0aa2d4c55f69cec04907f2b/invoke.js';
      s2.async = true;
      s2.defer = true;
      s2.setAttribute('data-cfasync', 'false');
      s2.onerror = (err) => {
        console.warn('[Banner728x90] Failed to load ad script:', err);
        setFailed(true);
      };
      s2.onload = () => {
        console.log('[Banner728x90] Ad script loaded successfully');
        setLoaded(true);
      };
      ref.current.appendChild(s2);
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