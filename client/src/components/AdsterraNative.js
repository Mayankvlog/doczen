import { useEffect, useRef, useState } from 'react';

export default function AdsterraNative() {
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
        key: 'c53e6e4677b82c7e335cf46167b6321f',
        format: 'iframe',
        height: 250,
        width: 300,
        params: {},
      })};`;
      s1.defer = true;
      ref.current.appendChild(s1);

      const s2 = document.createElement('script');
      s2.src = 'https://www.highperformanceformat.com/c53e6e4677b82c7e335cf46167b6321f/invoke.js';
      s2.async = true;
      s2.defer = true;
      s2.onerror = (err) => {
        console.warn('[AdsterraNative] Failed to load ad script:', err);
        setFailed(true);
      };
      s2.onload = () => {
        console.log('[AdsterraNative] Ad script loaded successfully');
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
      className="flex justify-center my-6"
      style={{ minHeight: failed ? 'auto' : '250px', minWidth: '300px' }}
    >
      {failed && (
        <div className="w-[300px] h-[250px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
          Ad Space
        </div>
      )}
    </div>
  );
}
