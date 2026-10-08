import { useEffect, useRef, useState } from 'react';
import { hasRenderableAd, loadAd } from './adQueue';

const AD_KEY = '8727e64117c88455f41910d02f27827d';

export default function AdRightSidebar() {
  var ref = useRef(null);
  var [failed, setFailed] = useState(false);
  var [loading, setLoading] = useState(true);
  var loadedRef = useRef(false);

  useEffect(function() {
    if (!ref.current || failed || loadedRef.current) return;

    loadedRef.current = true;
    console.log('[AdRightSidebar] Loading ad with key:', AD_KEY);

    var cleanup = loadAd({
      src: 'https://www.highrevenueformat.com/' + AD_KEY + '/invoke.js',
      config: {
        key: AD_KEY,
        format: 'iframe',
        height: 300,
        width: 160,
        container: 'sbRight-' + AD_KEY,
        params: {},
        async: true,
      },
      onload: function() {
        setLoading(false);
      },
      onerror: function(error) {
        console.error('[AdRightSidebar] Ad failed to load:', error);
        setFailed(true);
        setLoading(false);
      },
      container: ref.current,
    });

    var timeout = setTimeout(function() {
      if (!hasRenderableAd(ref.current)) {
        console.warn('[AdRightSidebar] No visible ad creative loaded after 8s');
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
    <div className="hidden lg:block fixed right-0 top-1/2 -translate-y-1/2 z-40 w-[160px]">
      <div
        ref={ref}
        id={'sbRight-' + AD_KEY}
        className="flex justify-center items-center"
        style={{ minHeight: '300px' }}
      >
        {loading && (
          <div className="w-[160px] h-[300px] bg-gray-50 flex items-center justify-center text-gray-400 text-xs animate-pulse">
            Loading ad...
          </div>
        )}
        {failed && (
          <div className="w-[160px] h-[300px] bg-gray-100 flex items-center justify-center text-gray-500 text-xs border border-gray-200">
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
