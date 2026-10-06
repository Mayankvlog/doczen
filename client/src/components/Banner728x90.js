import { useEffect, useRef, useState } from 'react';
import { loadAd } from './adQueue';

const AD_KEY = '8727e64117c88455f41910d02f27827d';

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
        height: 300,
        width: 160,
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
      style={{ minHeight: '300px', minWidth: '100%', position: 'relative' }}
    >
      {failed && (
        <div className="w-[160px] h-[300px] bg-gray-100 flex items-center justify-center text-gray-600 text-sm">
          Advertisement
        </div>
      )}
    </div>
  );
}