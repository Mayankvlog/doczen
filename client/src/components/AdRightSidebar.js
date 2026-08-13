import { useEffect, useRef, useState } from 'react';

const AD_KEY = '8727e64117c88455f41910d02f27827d';
const AD_DOMAIN = process.env.REACT_APP_ADSTERRA_DOMAIN || 'penguinsincequalify.com';

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
  var alreadyQueued = window._adQueue.some(function(i) { return i.src === src && i.container === container; });
  if (alreadyQueued) return;
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
      'https://' + AD_DOMAIN + '/' + AD_KEY + '/invoke.js',
      {
        key: AD_KEY,
        format: 'iframe',
        height: 300,
        width: 160,
        container: 'sbRight-' + AD_KEY,
        params: {},
      },
      function() { 
        setFailed(true); 
      },
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
        id={'sbRight-' + AD_KEY}
        className="flex justify-center items-center"
        style={{ minHeight: '300px' }}
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
