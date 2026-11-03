import { useEffect, useRef, useState } from 'react';
import { loadAd } from './adQueue';

const AD_SRC = 'https://bauval.org/22/eaf069e2ac26bd142818b8dae49979b6';
const AD_CONFIG = {
  key: 'eaf069e2ac26bd142818b8dae49979b6',
  format: 'iframe',
  height: 600,
  width: 160,
  params: {},
};
const CONTAINER_ID = 'ad-right-sidebar';

export default function AdRightSidebar() {
  const containerRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!containerRef.current || failed) return;

    const cleanup = loadAd({
      src: AD_SRC,
      config: AD_CONFIG,
      'data-cfasync': 'false',
      onempty: function() {
        setFailed(true);
      },
      onerror: function() {
        setFailed(true);
      },
      container: containerRef.current,
    });

    return function() {
      if (cleanup) cleanup();
    };
  }, [failed]);

  return (
    <div className="hidden lg:block fixed right-0 top-1/2 -translate-y-1/2 z-40 w-[160px]">
      <div
        ref={containerRef}
        id={CONTAINER_ID}
        className="w-full"
        style={{ minHeight: '600px' }}
      />
    </div>
  );
}
