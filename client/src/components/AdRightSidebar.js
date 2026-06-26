import { useEffect, useRef, useState } from 'react';

export default function AdRightSidebar() {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!ref.current || failed) return;
    if (ref.current.querySelector('script')) return;

    window.atOptions = {
      key: '8727e64117c88455f41910d02f27827d',
      format: 'iframe',
      height: 300,
      width: 160,
      params: {},
    };

    const s = document.createElement('script');
    s.src = 'https://penguinsincequalify.com/8727e64117c88455f41910d02f27827d/invoke.js';
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
    <div className="hidden lg:block fixed right-0 top-1/2 -translate-y-1/2 z-40 w-[160px]">
      <div
        ref={ref}
        className="flex justify-center"
        style={{ minHeight: failed ? 'auto' : '300px' }}
      >
        {failed && (
          <div className="w-[160px] h-[300px] bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
            Ad
          </div>
        )}
      </div>
    </div>
  );
}
