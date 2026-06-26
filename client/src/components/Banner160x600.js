import { useEffect, useRef, useState } from 'react';

export default function Banner160x600() {
  const ref = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!ref.current || failed) return;
    try {
      const existing = ref.current.querySelector('script');
      if (existing) return;

      const s1 = document.createElement('script');
      s1.text = `window.atOptions = ${JSON.stringify({
        key: 'b11a753fbb1e311a5b2734272ab5edda',
        format: 'iframe',
        height: 600,
        width: 160,
        params: {},
      })};`;
      s1.defer = true;
      s1.setAttribute('data-cfasync', 'false');
      ref.current.appendChild(s1);

      const s2 = document.createElement('script');
      s2.src = 'https://penguinsincequalify.com/b11a753fbb1e311a5b2734272ab5edda/invoke.js';
      s2.async = true;
      s2.defer = true;
      s2.setAttribute('data-cfasync', 'false');
      s2.onerror = (err) => {
        console.warn('[Banner160x600] Failed to load ad script:', err);
        setFailed(true);
      };
      s2.onload = () => {
        console.log('[Banner160x600] Ad script loaded successfully');
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
      className="flex justify-center overflow-hidden"
      style={{ minHeight: failed ? 'auto' : '600px', minWidth: '160px' }}
    >
      {failed && (
        <div className="w-[160px] h-[600px] bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
          Ad Space
        </div>
      )}
    </div>
  );
}
