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
  var onload = options.onload;
  var container = options.container;

  if (!src || !container) return undefined;

  try {
    if (!window._adActive) window._adActive = {};
    var slotKey = src + '::' + (container.id || 'default');
    if (window._adActive[slotKey]) return undefined;
    var request = {};
    window._adActive[slotKey] = request;

    var s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.setAttribute('data-cfasync', 'false');
    s.onerror = function() {
      if (window._adActive[slotKey] !== request) return;
      window._adActive[slotKey] = false;
      if (onerror) onerror(new Error('Ad script failed to load'));
    };
    s.onload = function() {
      if (window._adActive[slotKey] !== request) return;
      console.log('[adQueue] Ad script loaded successfully:', src);
      if (onload) onload();
    };

    // Register the slot in the network's shared config pool in the same microtask
    // that injects the provider script. Doing both here means:
    //   1. the container is guaranteed to be in the DOM before we register, and
    //   2. iframe configs always carry async:true + container, so the provider
    //      targets THIS slot instead of appending every drained option next to
    //      whichever script tag happened to execute first (the old collapse bug).
    Promise.resolve().then(function() {
      if (window._adActive[slotKey] !== request) return;
      if (!document.documentElement.contains(container)) {
        window._adActive[slotKey] = false;
        if (onerror) onerror(new Error('Container not in DOM'));
        return;
      }

      // Native Adsterra placements (config === null) carry their own config and
      // must NOT be added to the shared pool.
      if (config && config.key) {
        if (!window.atAsyncOptions) window.atAsyncOptions = [];
        var entry = config.async === undefined
          ? Object.assign({}, config, { async: true })
          : config;
        var exists = window.atAsyncOptions.some(function(o) {
          return !!o && o.key === entry.key && o.container === entry.container;
        });
        if (!exists) window.atAsyncOptions.push(entry);
      }

      try {
        container.appendChild(s);
      } catch (e) {
        console.error('[adQueue] Failed to append script:', e);
        window._adActive[slotKey] = false;
        if (onerror) onerror(e);
      }
    });

    return function cleanup() {
      if (window._adActive[slotKey] === request) {
        window._adActive[slotKey] = false;
      }
    };
  } catch (e) {
    console.error('[adQueue] Load ad error:', e);
    if (onerror) onerror(e);
    return undefined;
  }
}

export function hasRenderableAd(container) {
  if (!container) return false;

  var candidates = container.querySelectorAll('iframe, img, video, canvas');
  for (var i = 0; i < candidates.length; i += 1) {
    var element = candidates[i];
    var bounds = element.getBoundingClientRect();
    var style = window.getComputedStyle(element);

    if (
      bounds.width >= 20 &&
      bounds.height >= 20 &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0'
    ) {
      return true;
    }
  }

  return false;
}
