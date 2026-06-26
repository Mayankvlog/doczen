import { useEffect, useRef, useState } from 'react';

const AD_KEY = '466be459b6a86595592eb7b4c62c5b3c';
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
      document.body.appendChild(s);
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
  var [mounted, setMounted] = useState(false);

  useEffect(function() {
    setMounted(true);
  }, []);

  useEffect(function() {
    if (!ref.current || failed || !mounted) return;

    var containerId = 'atContainer-' + AD_KEY;
    var container = document.getElementById(containerId);
    
    if (!container) {
      console.warn('[AdsterraNative] Container not found:', containerId);
      return;
    }

    console.log('[AdsterraNative] Loading ad from:', 'https://' + AD_DOMAIN + '/' + AD_KEY + '/invoke.js');
    queueAd(
      'https://' + AD_DOMAIN + '/' + AD_KEY + '/invoke.js',
      {
        key: AD_KEY,
        format: 'native',
        height: 250,
        width: 300,
        container: containerId,
        params: {},
      },
      function() { 
        console.error('[AdsterraNative] Failed to load ad script');
        setFailed(true); 
      },
      container
    );

    return function() {
      if (window._adQueue) {
        window._adQueue = window._adQueue.filter(function(item) {
          return item.container !== container;
        });
      }
    };
  }, [failed, mounted]);

  return (
    <div className="flex justify-center my-6">
      {!failed && <div ref={ref} id={'atContainer-' + AD_KEY} className="w-[300px] h-[250px]"></div>}
      {failed && (
        <div className="w-[300px] h-[250px] bg-gray-100 flex items-center justify-center text-gray-400 text-sm rounded">
          Advertisement
        </div>
      )}
    </div>
  );
}
