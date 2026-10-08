import { useEffect, useRef, useState } from 'react';
import { hasRenderableAd, loadAd } from './adQueue';

const AD_KEY = 'b11a753fbb1e311a5b2734272ab5edda';

export default function AdLeftSidebar() {
  var ref = useRef(null);
  var [failed, setFailed] = useState(false);
  var [loading, setLoading] = useState(true);

  useEffect(function() {
    if (!ref.current || failed) return;

    console.log('[AdLeftSidebar] Loading ad with key:', AD_KEY);

    var cleanup = loadAd({
      src: 'https://www.highrevenueformat.com/' + AD_KEY + '/invoke.js',
      config: {
        key: AD_KEY,
        format: 'iframe',
        height: 600,
        width: 160,
        container: 'sbLeft-' + AD_KEY,
        params: {},
        async: true,
      },
      onload: function() {
        setLoading(false);
      },
      onerror: function(error) {
        console.error('[AdLeftSidebar] Ad failed to load:', error);
        setFailed(true);
        setLoading(false);
      },
      container: ref.current,
    });

    var timeout = setTimeout(function() {
      if (!hasRenderableAd(ref.current)) {
        console.warn('[AdLeftSidebar] No visible ad creative loaded after 8s');
        setFailed(true);
      }
      setLoading(false);
    }, 8000);

    return function() {
      if (cleanup) cleanup();
      clearTimeout(timeout);
    };
  }, [failed]);

  return (
    <div className="hidden lg:block fixed left-0 top-1/2 -translate-y-1/2 z-40 w-[160px]">
      <div
        ref={ref}
        id={'sbLeft-' + AD_KEY}
        className="flex justify-center items-center"
        style={{ minHeight: '600px' }}
      >
        {loading && (
          <div className="w-[160px] h-[600px] bg-gray-50 flex items-center justify-center text-gray-400 text-xs animate-pulse">
            Loading ad...
          </div>
        )}
        {failed && (
          <div className="w-[160px] h-[600px] bg-gray-100 flex items-center justify-center text-gray-500 text-xs border border-gray-200">
            <div className="text-center p-2">
              <div className="font-semibold text-gray-600 mb-1">Advertisement</div>
              <div className="text-gray-400">Ad temporarily unavailable</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
