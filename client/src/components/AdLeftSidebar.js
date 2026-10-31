import { useEffect, useRef } from 'react';

export default function AdLeftSidebar() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (containerRef.current.querySelector('script[data-ad-left]')) return;

    const script = document.createElement('script');
 
    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className="hidden lg:block fixed left-0 top-1/2 -translate-y-1/2 z-40 w-[160px]">
      <div ref={containerRef} className="w-full" style={{ minHeight: '600px' }} />
    </div>
  );
}
