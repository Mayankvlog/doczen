var pendingAds = [];
var activeAd = null;

function finishAd(request, error) {
  if (request.finished) return;
  request.finished = true;
  clearTimeout(request.timeout);
  clearTimeout(request.retryTimer);
  clearTimeout(request.renderTimer);
  if (request.renderObserver) request.renderObserver.disconnect();

  if (
    request.config &&
    request.config.key &&
    window.atOptions &&
    window.atOptions.key === request.config.key
  ) {
    delete window.atOptions;
  }

  if ((error || request.cancelled) && request.script) request.script.remove();

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

function clearAdConfig(request) {
  if (
    request.config &&
    request.config.key &&
    window.atOptions &&
    window.atOptions.key === request.config.key
  ) {
    delete window.atOptions;
  }
}

function retryAd(request, error, attempt) {
  if (request.finished || request.attempt !== attempt) return;
  clearTimeout(request.timeout);
  request.script.remove();
  clearAdConfig(request);

  if (request.attempts < 2 && !request.cancelled) {
    console.warn(
      '[adQueue] Ad script attempt failed; retrying once:',
      request.src,
      error
    );
    request.retryTimer = setTimeout(function() {
      if (request.finished || request.cancelled || activeAd !== request) {
        finishAd(request);
        return;
      }
      startAdAttempt(request);
    }, 500);
    return;
  }

  finishAd(request, error);
}

function startAdAttempt(request) {
  request.attempts += 1;
  request.attempt += 1;
  var attempt = request.attempt;

  // Set atOptions BEFORE script loading - critical for ad rendering
  if (request.config && request.config.key) {
    window.atOptions = Object.assign({}, request.config);
    console.log('[adQueue] Setting atOptions:', request.config);
  }

  var script = document.createElement('script');
  request.script = script;
  script.src = request.src;
  script.async = true;
  if (request.dataCfasync !== undefined) {
    script.setAttribute('data-cfasync', String(request.dataCfasync));
  } else {
    script.setAttribute('data-cfasync', 'false');
  }

  script.onload = function() {
    if (request.finished || request.attempt !== attempt) return;
    clearTimeout(request.timeout);
    console.log('[adQueue] Ad script downloaded; waiting for its iframe:', request.src);

    var hasRenderedIframe = function() {
      var frames = request.container.querySelectorAll('iframe');
      for (var i = 0; i < frames.length; i++) {
        var frame = frames[i];
        var rect = frame.getBoundingClientRect();
        var width = rect.width || parseFloat(frame.getAttribute('width')) || parseFloat(frame.style.width);
        var height = rect.height || parseFloat(frame.getAttribute('height')) || parseFloat(frame.style.height);
        if (width > 1 && height > 1) return true;
      }
      return false;
    };

    var finishIfRendered = function() {
      if (request.finished || request.attempt !== attempt) return;
      if (hasRenderedIframe()) {
        console.log('[adQueue] Ad iframe rendered:', request.src);
        finishAd(request);
      }
    };

    finishIfRendered();
    if (request.finished) return;

    if (typeof MutationObserver !== 'undefined') {
      request.renderObserver = new MutationObserver(finishIfRendered);
      request.renderObserver.observe(request.container, { childList: true, subtree: true, attributes: true });
    }

    request.renderTimer = setTimeout(function() {
      if (request.finished || request.attempt !== attempt) return;
      if (hasRenderedIframe()) {
        finishAd(request);
        return;
      }
      finishAd(request, new Error('Ad script loaded, but no ad iframe was rendered'));
    }, 10000);
  };

  script.onerror = function() {
    retryAd(request, new Error('Ad script failed to load'), attempt);
  };

  request.timeout = setTimeout(function() {
    retryAd(request, new Error('Ad script load timed out'), attempt);
  }, 15000);

  try {
    request.container.appendChild(script);
  } catch (error) {
    retryAd(request, error, attempt);
  }
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
  startAdAttempt(request);
}

export function loadAd(options) {
  var src = options.src;
  var config = options.config;
  var container = options.container;
  var dataCfasync = options.dataCfasync !== undefined ? options.dataCfasync : options['data-cfasync'];

  if (!src || !container) return undefined;

  try {
    if (!window._adActive) window._adActive = {};
    var slotKey = src + '::' + (container.id || 'default');
    if (window._adActive[slotKey]) return undefined;

    var token = {};
    var request = {
      src: src,
      config: config,
      dataCfasync: data-cfasync !== undefined ? dataCfasync : false,
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
      script: null,
      attempts: 0,
      attempt: 0,
      cancelled: false,
      finished: false,
      timeout: null,
      retryTimer: null,
      renderTimer: null,
      renderObserver: null,
    };

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
        request.finished = true;
        clearTimeout(request.retryTimer);
        clearAdConfig(request);
        runNextAd();
      } else if (activeAd === request) {
        finishAd(request);
      }
    };
  } catch (error) {
    console.error('[adQueue] Load ad error:', error);
    if (options.onerror) options.onerror(error);
    return undefined;
  }
}
