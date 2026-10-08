var pendingAds = [];
var activeAd = null;

function finishAd(request, error) {
  if (request.finished) return;
  request.finished = true;
  clearTimeout(request.timeout);

  if (
    request.config &&
    request.config.key &&
    window.atOptions &&
    window.atOptions.key === request.config.key
  ) {
    delete window.atOptions;
  }

  if (error) request.script.remove();

  if (window._adActive[request.slotKey] === request.token) {
    window._adActive[request.slotKey] = false;
    if (!request.cancelled) {
      if (error) request.onerror(error);
      else request.onload();
    }
  }

  if (activeAd === request) activeAd = null;
  runNextAd();
}

function runNextAd() {
  if (activeAd || pendingAds.length === 0) return;

  var request = pendingAds.shift();
  if (request.cancelled || window._adActive[request.slotKey] !== request.token) {
    runNextAd();
    return;
  }

  if (!document.documentElement.contains(request.container)) {
    finishAd(request, new Error('Container not in DOM'));
    return;
  }

  activeAd = request;
  if (request.config && request.config.key) {
    window.atOptions = Object.assign({}, request.config);
  }

  request.script.onload = function() {
    console.log('[adQueue] Ad script loaded successfully:', request.src);
    finishAd(request);
  };
  request.script.onerror = function() {
    finishAd(request, new Error('Ad script failed to load'));
  };
  request.timeout = setTimeout(function() {
    finishAd(request, new Error('Ad script load timed out'));
  }, 15000);

  try {
    request.container.appendChild(request.script);
  } catch (error) {
    finishAd(request, error);
  }
}

export function loadAd(options) {
  var src = options.src;
  var config = options.config;
  var container = options.container;

  if (!src || !container) return undefined;

  try {
    if (!window._adActive) window._adActive = {};
    var slotKey = src + '::' + (container.id || 'default');
    if (window._adActive[slotKey]) return undefined;

    var token = {};
    var request = {
      src: src,
      config: config,
      container: container,
      slotKey: slotKey,
      token: token,
      onerror: function(error) {
        console.error('[adQueue] Ad script failed:', src, error);
        if (options.onerror) options.onerror(error);
      },
      onload: function() {
        if (options.onload) options.onload();
      },
      script: document.createElement('script'),
      cancelled: false,
      finished: false,
      timeout: null,
    };

    request.script.src = src;
    request.script.async = true;
    request.script.setAttribute('data-cfasync', 'false');
    window._adActive[slotKey] = token;
    pendingAds.push(request);
    Promise.resolve().then(runNextAd);

    return function cleanup() {
      if (window._adActive[slotKey] !== token) return;
      window._adActive[slotKey] = false;
      request.cancelled = true;

      var queuedIndex = pendingAds.indexOf(request);
      if (queuedIndex !== -1) {
        pendingAds.splice(queuedIndex, 1);
      }
    };
  } catch (error) {
    console.error('[adQueue] Load ad error:', error);
    if (options.onerror) options.onerror(error);
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
