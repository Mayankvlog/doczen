import { useEffect, useRef, useState } from 'react';

const AD_KEY = '6df2ba92eab7a2efe6ea4a5a815b17fb';

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

export default function AdLeftSidebar() {
  var ref = useRef(null);
  var [failed, setFailed] = useState(false);

  useEffect(function() {
    if (!ref.current || failed) return;

    queueAd(
      'https://www.highrevenueformat.com/' + AD_KEY + '/invoke.js',
      {
        key: AD_KEY,
        format: 'iframe',
        height: 50,
        width: 320,
        container: 'sbLeft-' + AD_KEY,
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
    <div className="hidden lg:block fixed left-0 top-1/2 -translate-y-1/2 z-40 w-[320px]">
      <div
        ref={ref}
        id={'sbLeft-' + AD_KEY}
        className="flex justify-center items-center"
        style={{ minHeight: '50px' }}
      >
        {failed && (
          <div className="w-[320px] h-[50px] bg-gray-100 flex items-center justify-center text-gray-600 text-sm">
            Ad
          </div>
        )}
      </div>
    </div>
  );
}
