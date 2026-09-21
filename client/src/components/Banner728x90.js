import { useEffect, useRef, useState } from 'react';
import { loadAd } from './adQueue';

const AD_KEY = '20c23d55e0aa2d4c55f69cec04907f2b';

export default function Banner728x90() {
  var ref = useRef(null);
  var [failed, setFailed] = useState(false);

  useEffect(function() {
    if (!ref.current || failed) return;

    var cleanup = loadAd({
      src: 'https://www.highrevenueformat.com/' + AD_KEY + '/invoke.js',
      config: {
        key: AD_KEY,
        format: 'iframe',
        height: 90,
        width: 728,
        container: 'atContainer-' + AD_KEY,
        params: {},
      },
      onerror: function() {
        setFailed(true);
      },
      container: ref.current,
    });

    return cleanup;
  }, [failed]);

  return (
    <div
      ref={ref}
      id={'atContainer-' + AD_KEY}
      className="flex justify-center bg-gray-100 py-2 overflow-hidden"
      style={{ minHeight: '90px', minWidth: '100%', position: 'relative' }}
    >
      {failed && (
        <div className="w-full h-[90px] bg-gray-100 flex items-center justify-center text-gray-600 text-sm">
          Advertisement
        </div>
      )}
    </div>
  );
}