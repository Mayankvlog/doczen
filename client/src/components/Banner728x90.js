import { useEffect, useRef, useState } from 'react';
import { loadAd } from './adQueue';

const AD_SRC =
  'https://biomanos.org/22/c391fddb6bcf2cdce176a76720d24d5f';
const AD_CONFIG = {
  key: 'c391fddb6bcf2cdce176a76720d24d5f',
  format: 'iframe',
  height: 90,
  width: 728,
  params: {},
};
const CONTAINER_ID = 'banner-728x90';

export default function Banner728x90() {
  var ref = useRef(null);
  var [failed, setFailed] = useState(false);

  useEffect(function() {
    if (!ref.current || failed) return;

    var cleanup = loadAd({
      src: AD_SRC,
      config: AD_CONFIG,
      'data-cfasync': "false",
      onload: function() {
        // Ad loaded successfully
      },
      onempty: function() {
        setFailed(true);
      },
      onerror: function(error) {
        // Ad failed to load
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
      className="relative flex justify-center bg-gray-100 py-2 overflow-hidden"
      style={{ minHeight: '90px', minWidth: '100%' }}
    >
      <div
        ref={ref}
        id={CONTAINER_ID}
        className="absolute inset-0 flex items-center justify-center"
      />
      {failed && (
        <div className="absolute inset-0 w-[728px] h-[90px] bg-gray-100 flex items-center justify-center text-gray-600 text-sm border border-gray-200">
          <div className="text-center">
            <div className="font-semibold text-gray-700 mb-1">Advertisement</div>
            <div className="text-gray-400 text-xs">Ad temporarily unavailable</div>
          </div>
        </div>
      )}
    </div>
  );
}
