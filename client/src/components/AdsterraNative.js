import { useEffect, useRef, useState } from 'react';
import { loadAd } from './adQueue';

const AD_KEY = '466be459b6a86595592eb7b4c62c5b3c';
const AD_DOMAIN = process.env.REACT_APP_ADSTERRA_DOMAIN || 'pl29568432.profitableratecpmnetwork.com';

export default function AdsterraNative() {
  var ref = useRef(null);
  var [failed, setFailed] = useState(false);

  useEffect(function() {
    if (!ref.current || failed) return;

    var cleanup;

    // Small delay to ensure container is in DOM
    var timeout = setTimeout(function() {
      if (!ref.current || failed) return;

      console.log('[AdsterraNative] Loading ad with key:', AD_KEY);

      cleanup = loadAd({
        src: 'https://' + AD_DOMAIN + '/' + AD_KEY + '/invoke.js',
        dataCfasync: false,
        config: {
          key: AD_KEY,
          format: 'iframe',
          height: 250,
          width: 300,
          container: 'container-' + AD_KEY,
          params: {},
          async: true,
        },
        onload: function() {
          console.log('[AdsterraNative] Ad loaded successfully');
        },
        onerror: function(error) {
          console.error('[AdsterraNative] Ad failed to load:', error);
          setFailed(true);
        },
        container: ref.current,
      });
    }, 100);

    return function() {
      clearTimeout(timeout);
      if (cleanup) cleanup();
    };
  }, [failed]);

  return (
    <div className="relative flex justify-center my-6 overflow-hidden">
      <div ref={ref} id={'container-' + AD_KEY} className="w-full max-w-[300px] h-[250px] overflow-hidden relative" />
      {failed && (
        <div className="absolute inset-0 mx-auto w-full max-w-[300px] h-[250px] bg-gray-100 flex items-center justify-center text-gray-600 text-sm rounded overflow-hidden">
          Advertisement
        </div>
      )}
    </div>
  );
}
