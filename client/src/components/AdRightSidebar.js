import { useEffect, useRef, useState } from 'react';

const AD_KEY = '8727e64117c88455f41910d02f27827d';

function queueAd(src, config, onerror, container) {
  if (!window._adQueue) {
    window._adQueue = [];
    window._processAdQueue = function() {
      if (window._adQueue.length === 0) return;
      var item = window._adQueue[0];
      if (!item.container || !document.body.contains(item.container)) {
        window._adQueue.shift();
        window._processAdQueue();
        return;
      }
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
      item.container.appendChild(s);
    };
  }
  window._adQueue.push({ src: src, config: config, onerror: onerror, container: container });
  if (window._adQueue.length === 1) {
    window._processAdQueue();
  }
}

export default function AdRightSidebar() {
  var ref = useRef(null);
  var [failed, setFailed] = useState(false);

  useEffect(function() {
    if (!ref.current || failed) return;

    queueAd(
      'https://penguinsincequalify.com/' + AD_KEY + '/invoke.js',
      {
        key: AD_KEY,
        format: 'iframe',
        height: 300,
        width: 160,
        params: {},
      },
      function() { setFailed(true); },
      ref.current
    );

    return function() {
      if (window._adQueue) {
        window._adQueue = window._adQueue.filter(function(item) {
          return item.container !== ref.current;
        });
      }
    };
  }, [failed]);

  return (
    <div className="hidden lg:block fixed right-0 top-1/2 -translate-y-1/2 z-40 w-[160px]">
      <div
        ref={ref}
        className="flex justify-center"
        style={{ minHeight: failed ? 'auto' : '300px' }}
      >
        {failed && (
          <div className="w-[160px] h-[300px] bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
            Ad
          </div>
        )}
      </div>
    </div>
  );
}
