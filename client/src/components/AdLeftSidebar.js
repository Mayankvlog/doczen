import { useEffect, useRef, useState } from 'react';
import { loadAd } from './adQueue';

const AD_KEY = 'b11a753fbb1e311a5b2734272ab5edda';

export default function AdLeftSidebar() {
  var ref = useRef(null);
  var [failed, setFailed] = useState(false);

  useEffect(function() {
    if (!ref.current || failed) return;

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
      onerror: function() {
        setFailed(true);
      },
      container: ref.current,
    });

    return cleanup;
  }, [failed]);

  return (
    <div className="hidden lg:block fixed left-0 top-1/2 -translate-y-1/2 z-40 w-[160px]">
      <div
        ref={ref}
        id={'sbLeft-' + AD_KEY}
        className="flex justify-center items-center"
        style={{ minHeight: '600px' }}
      >
        {failed && (
          <div className="w-[160px] h-[600px] bg-gray-100 flex items-center justify-center text-gray-600 text-sm">
            Ad
          </div>
        )}
      </div>
    </div>
  );
}