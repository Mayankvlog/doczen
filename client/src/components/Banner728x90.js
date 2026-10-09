import { useEffect, useRef, useState } from 'react';
import { loadAd } from './adQueue';

const AD_KEY = '20c23d55e0aa2d4c55f69cec04907f2b';

export default function Banner728x90() {
  var ref = useRef(null);
  var [failed, setFailed] = useState(false);

  useEffect(function() {
    if (!ref.current || failed) return;

    console.log('[Banner728x90] Loading ad with key:', AD_KEY);

    // Clear container before loading new ad (safely)
    try {
      while (ref.current && ref.current.firstChild) {
        ref.current.removeChild(ref.current.firstChild);
      }
    } catch (e) {
      // Ignore if container was already cleared by React
    }

    var cleanup = loadAd({
      src: 'https://www.highrevenueformat.com/' + AD_KEY + '/invoke.js',
      dataCfasync: false,
      config: {
        key: AD_KEY,
        format: 'iframe',
        height: 90,
        width: 728,
        container: 'atContainer-' + AD_KEY,
        params: {},
        async: true,
      },
      onload: function() {
        console.log('[Banner728x90] Ad loaded successfully');
      },
      onerror: function(error) {
        console.error('[Banner728x90] Ad failed to load:', error);
        setFailed(true);
      },
      container: ref.current,
    });

    return function() {
      if (cleanup) cleanup();
    };
  }, [failed]);

  return (
    <div
      ref={ref}
      id={'atContainer-' + AD_KEY}
      className="flex justify-center bg-gray-100 py-2 overflow-hidden"
      style={{ minHeight: '90px', minWidth: '100%', position: 'relative' }}
    >
      {failed && (
        <div className="w-[728px] h-[90px] bg-gray-100 flex items-center justify-center text-gray-600 text-sm border border-gray-200">
          <div className="text-center">
            <div className="font-semibold text-gray-700 mb-1">Advertisement</div>
            <div className="text-gray-400 text-xs">Ad temporarily unavailable</div>
          </div>
        </div>
      )}
    </div>
  );
}
