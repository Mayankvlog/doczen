// Parallel ad-loader for High-Rev (highrevenueformat.com) and Adsterra placements.
//
// Why this is faster: the previous loader injected ad scripts one-at-a-time and
// waited for each script's full load (plus a 100ms delay) before starting the
// next. With banner + 2 sidebars + native = 3-4 scripts per page, the last ad
// only started after every earlier script had finished loading.
//
// The ad network supports multiple placements safely through the shared
// window.atAsyncOptions[] pool: every config is registered there before the
// scripts run, and the scripts consume the configs they need. Injecting all
// scripts in parallel therefore has no config race and lets every slot render
// as fast as the slowest single script.
export function loadAd(options) {
  var src = options.src;
  var config = options.config;
  var onerror = options.onerror;
  var container = options.container;

  if (!src || !container) return undefined;

  if (!window._adActive) window._adActive = {};
  if (window._adActive[src]) return undefined;
  window._adActive[src] = true;

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
    window._adActive[src] = false;
    if (onerror) onerror();
  };
  (container || document.body).appendChild(s);

  return function cleanup() {
    window._adActive[src] = false;
  };
}