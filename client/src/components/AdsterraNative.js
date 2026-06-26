import { useEffect, useRef, useState } from 'react';

const AD_KEY = '466be459b6a86595592eb7b4c62c5b3c';

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

export default function AdsterraNative() {
  var ref = useRef(null);
  var [failed, setFailed] = useState(false);

  useEffect(function() {
    if (!ref.current || failed) return;

    queueAd(
      'https://penguinsincequalify.com/' + AD_KEY + '/invoke.js',
      {
        key: AD_KEY,
        format: 'native',
        height: 250,
        width: 300,
        params: {},
      },
      function() { setFailed(true); },
      ref.current
    );
  }, [failed]);

  return (
    <div ref={ref} className="flex justify-center my-6">
      {!failed && <div id={'container-' + AD_KEY}></div>}
    </div>
  );
}
