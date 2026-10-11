import { useEffect, useRef, useState } from 'react';
import { loadAd } from './adQueue';

const AD_KEY = '466be459b6a86595592eb7b4c62c5b3c';
const AD_DOMAIN = process.env.REACT_APP_ADSTERRA_DOMAIN || 'pl29568432.profitableratecpmnetwork.com';

export default function AdsterraNative() {
  var ref = useRef(null);
  var [failed, setFailed] = useState(false);
  var [containerId] = useState(function() {
    return 'container-' + AD_KEY + '-' + Math.random().toString(36).substr(2, 9);
  });

  useEffect(function() {
    if (!ref.current || failed) return;

    var cleanup;

    // Small delay to ensure container is in DOM
    var timeout = setTimeout(function() {
      if (!ref.current || failed) return;

      cleanup = loadAd({
        src: 'https://' + AD_DOMAIN + '/' + AD_KEY + '/invoke.js',
        'data-cfasync': "false",
        config: {
          key: AD_KEY,
          format: 'iframe',
          height: 250,
          width: 300,
          container: containerId,
          params: {},
          async: true,
        },
        onload: function() {
          // Ad loaded successfully
        },
        onempty: function() {
          setFailed(true);
        },
        onerror: function(error) {
          setFailed(true);
        },
        container: ref.current,
      });
    }, 100);

    return function() {
      clearTimeout(timeout);
      if (cleanup) cleanup();
    };
  }, [failed, containerId]);

  return (
    <div className="relative flex justify-center my-6 overflow-hidden">
      <div ref={ref} id={containerId} className="w-full max-w-[300px] h-[250px] overflow-hidden relative" />
      {failed && (
        <div className="absolute inset-0 mx-auto w-full max-w-[300px] h-[250px] bg-gray-100 flex items-center justify-center text-gray-600 text-sm rounded overflow-hidden">
          Advertisement
        </div>
      )}
    </div>
  );
}
