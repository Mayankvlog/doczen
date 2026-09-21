import { useEffect, useRef, useState } from 'react';
import { loadAd } from './adQueue';

const AD_KEY = '466be459b6a86595592eb7b4c62c5b3c';
const AD_DOMAIN = process.env.REACT_APP_ADSTERRA_DOMAIN || 'penguinsincequalify.com';

export default function AdsterraNative() {
  var ref = useRef(null);
  var [failed, setFailed] = useState(false);
  var [mounted, setMounted] = useState(false);

  useEffect(function() {
    setMounted(true);
  }, []);

  useEffect(function() {
    if (!ref.current || failed || !mounted) return;

    var cleanup = loadAd({
      src: 'https://' + AD_DOMAIN + '/' + AD_KEY + '/invoke.js',
      config: null,
      onerror: function() {
        setFailed(true);
      },
      container: ref.current,
    });

    return cleanup;
  }, [failed, mounted]);

  return (
    <div className="flex justify-center my-6 overflow-hidden">
      {!failed && <div ref={ref} id={'atContainer-' + AD_KEY} className="w-full max-w-[300px] h-[250px] overflow-hidden relative"></div>}
      {failed && (
        <div className="w-full max-w-[300px] h-[250px] bg-gray-100 flex items-center justify-center text-gray-600 text-sm rounded overflow-hidden">
          Advertisement
        </div>
      )}
    </div>
  );
}