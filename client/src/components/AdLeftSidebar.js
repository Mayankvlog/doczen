import { useEffect, useRef, useState } from 'react';

export default function AdLeftSidebar() {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!ref.current || failed) return;
    if (ref.current.querySelector('script')) return;

    window.atOptions = {
      key: 'b11a753fbb1e311a5b2734272ab5edda',
      format: 'iframe',
      height: 600,
      width: 160,
      params: {},
    };

    const s = document.createElement('script');
    s.src = 'https://penguinsincequalify.com/b11a753fbb1e311a5b2734272ab5edda/invoke.js';
    s.async = true;
    s.setAttribute('data-cfasync', 'false');
    s.onerror = () => setFailed(true);
    ref.current.appendChild(s);

    return () => {
      if (ref.current) {
        const scripts = ref.current.querySelectorAll('script');
        scripts.forEach(script => script.remove());
      }
    };
  }, [failed]);

  return (
    <div className="hidden lg:block fixed left-0 top-1/2 -translate-y-1/2 z-40 w-[160px]">
      <div
        ref={ref}
        className="flex justify-center"
        style={{ minHeight: failed ? 'auto' : '600px' }}
      >
        {failed && (
          <div className="w-[160px] h-[600px] bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
            Ad
          </div>
        )}
      </div>
    </div>
  );
}
