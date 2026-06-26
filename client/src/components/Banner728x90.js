import { useEffect, useRef, useState } from 'react';

const AD_KEY = '20c23d55e0aa2d4c55f69cec04907f2b';

function queueAd(src, config, onerror, container) {
  if (!window._adQueue) {
    window._adQueue = [];
    window._processAdQueue = function() {
      if (window._adQueue.length === 0) return;
      var item = window._adQueue[0];
      window.atOptions = item.config;
      var s = document.createElement('script');
      s.src = item.src;
      s.async = true;
      s.setAttribute('data-cfasync', 'false');
      s.onload = function() {
        window._adQueue.shift();
        setTimeout(window._processAdQueue, 100);
      };
      s.onerror = function() {
        window._adQueue.shift();
        if (item.onerror) item.onerror();
        setTimeout(window._processAdQueue, 100);
      };
      (item.container || document.body).appendChild(s);
    };
  }
  var alreadyQueued = window._adQueue.some(function(i) { return i.src === src; });
  if (alreadyQueued) return;
  window._adQueue.push({ src: src, config: config, onerror: onerror, container: container });
  if (window._adQueue.length === 1) {
    window._processAdQueue();
  }
}

export default function Banner728x90() {
  var ref = useRef(null);
  var [failed, setFailed] = useState(false);

  useEffect(function() {
    if (!ref.current || failed) return;

    queueAd(
      'https://www.highperformanceformat.com/' + AD_KEY + '/invoke.js',
      {
        key: AD_KEY,
        format: 'iframe',
        height: 90,
        width: 728,
        params: {},
      },
      function() {
        console.warn('[Banner728x90] Failed to load ad script');
        setFailed(true);
      },
      ref.current
    );
  }, [failed]);

  return (
    <div
      ref={ref}
      className="flex justify-center bg-gray-100 py-2 overflow-hidden"
      style={{ minHeight: failed ? 'auto' : '90px', minWidth: '100%' }}
    >
      {failed && (
        <div className="w-full h-[90px] bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
          Advertisement
        </div>
      )}
    </div>
  );
}
