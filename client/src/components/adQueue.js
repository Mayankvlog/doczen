// Parallel ad-loader for High-Rev (highrevenueformat.com) and Adsterra placements.
//
// Why this is faster: the previous loader injected ad scripts one-at-a-time and
// waited for each script's full load (plus a 100ms delay) before starting the
// next. With banner + 2 sidebars + native = 3-4 scripts per page, the last ad
// only started after every earlier script had finished loading.
//
// Register each configured placement in the shared window.atAsyncOptions[]
// pool before injecting its script. Track requests by URL and container so a
// shared script URL cannot prevent a different placement from loading.
export function loadAd(options) {
  var src = options.src;
  var config = options.config;
  var onerror = options.onerror;
  var container = options.container;

  if (!src || !container) return undefined;

  if (!window._adActive) window._adActive = {};
  var slotKey = src + '::' + (container.id || 'default');
  if (window._adActive[slotKey]) return undefined;
  var request = {};
  window._adActive[slotKey] = request;

  // Register the slot in the network's multi-ad config pool. Native Adsterra
  // placements (config === null) carry their own config and must NOT be added.
  if (config && config.key) {
    if (!window.atAsyncOptions) window.atAsyncOptions = [];
    var exists = window.atAsyncOptions.some(function(o) {
      return !!o && o.key === config.key && o.container === config.container;
    });
    if (!exists) window.atAsyncOptions.push(config);
  }

  var s = document.createElement('script');
  s.src = src;
  s.async = true;
  s.setAttribute('data-cfasync', 'false');
  s.onerror = function() {
    if (window._adActive[slotKey] !== request) return;
    window._adActive[slotKey] = false;
    if (onerror) onerror();
  };

  // Let every placement register its config before any async provider script
  // can read the shared atAsyncOptions pool.
  Promise.resolve().then(function() {
    if (window._adActive[slotKey] !== request) return;
    if (!document.documentElement.contains(container)) {
      window._adActive[slotKey] = false;
      return;
    }
    container.appendChild(s);
  });

  return function cleanup() {
    if (window._adActive[slotKey] === request) {
      window._adActive[slotKey] = false;
    }
  };
}