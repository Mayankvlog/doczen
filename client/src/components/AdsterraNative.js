import { useEffect, useRef, useState } from 'react';
import { loadAd } from './adQueue';

const AD_KEY = 'fa27a4d706e0837766689bed67c17636';
const AD_SRC = 'https://bauval.org/21/' + AD_KEY;
const CONTAINER_ID = 'container-' + AD_KEY;

export default function AdsterraNative() {
  var ref = useRef(null);
  var [failed, setFailed] = useState(false);

  useEffect(function() {
    if (!ref.current || failed) return;

    var cleanup;

    // Small delay to ensure container is in DOM
    var timeout = setTimeout(function() {
      if (!ref.current || failed) return;

      cleanup = loadAd({
        src: AD_SRC,
        'data-cfasync': "false",
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
  }, [failed]);

  return (
    <div className="relative flex justify-center my-6 overflow-hidden">
      <div ref={ref} id={CONTAINER_ID} className="w-full max-w-[300px] h-[250px] overflow-hidden relative" />
      {failed && (
        <div className="absolute inset-0 mx-auto w-full max-w-[300px] h-[250px] bg-gray-100 flex items-center justify-center text-gray-600 text-sm rounded overflow-hidden">
          Advertisement
        </div>
      )}
    </div>
  );
}
