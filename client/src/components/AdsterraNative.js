import { useEffect, useRef, useState } from 'react';

export default function AdsterraNative() {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!ref.current || failed) return;
    const timer = setTimeout(() => {
      try {
        const existing = ref.current.querySelector('script');
        if (existing) return;

        window.atOptions = {
          key: 'c53e6e4677b82c7e335cf46167b6321f',
          format: 'iframe',
          height: 250,
          width: 300,
          params: {},
        };

        const s = document.createElement('script');
        s.src = 'https://www.highperformanceformat.com/c53e6e4677b82c7e335cf46167b6321f/invoke.js';
        s.async = true;
        s.onerror = () => setFailed(true);
        s.onload = () => { window.__nativeAdLoaded = true; };
        ref.current.appendChild(s);
      } catch (e) {
        setFailed(true);
      }
    }, 1500);
    return () => {
      clearTimeout(timer);
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