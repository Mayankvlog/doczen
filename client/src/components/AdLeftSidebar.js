import { useEffect, useRef, useState } from 'react';
import { loadAd } from './adQueue';

const AD_SRC = 'https://biomanos.org/22/f2c73eb42a63865226329c4a75457c17';
const AD_CONFIG = {
  key: 'f2c73eb42a63865226329c4a75457c17',
  format: 'iframe',
  height: 600,
  width: 160,
  params: {},
};
const CONTAINER_ID = 'ad-left-sidebar';

export default function AdLeftSidebar() {
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
    <div className="hidden lg:block fixed left-0 top-1/2 -translate-y-1/2 z-40 w-[160px]">
      <div
        ref={containerRef}
        id={CONTAINER_ID}
        className="w-full"
        style={{ minHeight: '600px' }}
      />
    </div>
  );
}
