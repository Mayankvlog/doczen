import { useEffect, useRef, useState } from 'react';
import { hasRenderableAd, loadAd } from './adQueue';

const AD_KEY = '466be459b6a86595592eb7b4c62c5b3c';
const AD_DOMAIN = process.env.REACT_APP_ADSTERRA_DOMAIN || 'pl29568432.profitableratecpmnetwork.com';

export default function AdsterraNative() {
  var ref = useRef(null);
  var [failed, setFailed] = useState(false);
  var [mounted, setMounted] = useState(false);

  useEffect(function() {
    setMounted(true);
  }, []);

  useEffect(function() {
    if (!ref.current || failed || !mounted) return;

    var timeout;
    function checkForCreative() {
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        if (!hasRenderableAd(ref.current)) {
          console.warn('[AdsterraNative] No visible ad creative loaded after 15s');
          setFailed(true);
        }
      }, 15000);
    }

    var cleanup = loadAd({
      src: 'https://' + AD_DOMAIN + '/' + AD_KEY + '/invoke.js',
      dataCfasync: false,
      config: null,
      onload: checkForCreative,
      onerror: function() {
        setFailed(true);
      },
      container: ref.current,
    });

    return function() {
      if (cleanup) cleanup();
      clearTimeout(timeout);
    };
  }, [failed, mounted]);

  return (
    <div className="flex justify-center my-6 overflow-hidden">
      {!failed && <div ref={ref} id={'container-' + AD_KEY} className="w-full max-w-[300px] h-[250px] overflow-hidden relative"></div>}
      {failed && (
        <div className="w-full max-w-[300px] h-[250px] bg-gray-100 flex items-center justify-center text-gray-600 text-sm rounded overflow-hidden">
          Advertisement
        </div>
      )}
    </div>
  );
}
