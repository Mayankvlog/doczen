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

      const s = document.createElement('script');
      s.src = 'https://penguinsincequalify.com/466be459b6a86595592eb7b4c62c5b3c/invoke.js';
      s.async = true;
      s.setAttribute('data-cfasync', 'false');
      s.onerror = (err) => {
        console.warn('[AdsterraNative] Failed to load ad script:', err);
        setFailed(true);
      };
      s.onload = () => {
        console.log('[AdsterraNative] Ad script loaded successfully');
        setLoaded(true);
      };
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
      className="flex justify-center my-6"
      style={{ minHeight: failed ? 'auto' : '250px', minWidth: '300px' }}
    >
      <div id="container-466be459b6a86595592eb7b4c62c5b3c"></div>
      {failed && (
        <div className="w-[300px] h-[250px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
          Ad Space
        </div>
      )}
    </div>
  );
}